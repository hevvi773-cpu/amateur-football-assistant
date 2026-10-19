"""内置 AI 内容生成器（未配置大模型密钥时的降级实现）。

每个生成器基于真实数据库内容产出结构化文本，与 PRD 5.x 的功能描述对齐。
"""
from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.models import Card, Goal, Match, Player, Team
from app.services.standings import compute_standings


def gen_tactics(db: Session, match: Match) -> dict:
    """生成赛前战术攻略：对手分析、战术建议、关键球员、阵型推荐、预案提醒。"""
    home, away = _teams(db, match)
    home_row = _team_standing(db, match.home_team_id)
    away_row = _team_standing(db, match.away_team_id)

    home_desc = _standing_desc(home_row, home)
    away_desc = _standing_desc(away_row, away)
    key_home = _key_player(db, match.home_team_id)
    key_away = _key_player(db, match.away_team_id)

    summary = (
        f"{home.name} 对阵 {away.name}：{home_desc}，{away_desc}；"
        f"建议立足防守反击，重点盯防对方 {key_away or '核心球员'}。"
    )
    sections = {
        "对手分析": f"{away.name}{away_desc}，进攻端需重点限制 {key_away or '核心球员'} 的持球与串联。",
        "战术建议": f"{home.name} 可优先稳守反击：压缩中场空间，边路回防形成层次，利用 {key_home or '锋线球员'} 的速度打身后。",
        "关键球员": f"本方关键：{key_home or '无突出个人'}；对方需盯防：{key_away or '暂无突出个人'}。",
        "阵型推荐": "建议沿用近期磨合成熟的阵型，保持中路人数优势，避免大面积轮换影响默契。",
        "预案提醒": "若上半场落后，下半场提前加强边路冲击并增加远射；若领先则收缩阵型控制节奏。",
    }
    return {"summary": summary, "sections": sections}


def gen_review_summary(db: Session, match: Match, reviews: list) -> str:
    """聚合全队赛后感想，生成一份统一总结。"""
    if not reviews:
        return "本场比赛暂无队员感想，无法生成全队总结。"
    names = [_player_name(db, review.player_id) for review in reviews]
    captain_count = sum(1 for review in reviews if review.author_role == "captain")
    positive = sum(1 for review in reviews if _is_positive(review.content))

    return (
        f"本场共收到 {len(reviews)} 份感想（来自{'、'.join(names)}，含队长 {captain_count} 份）。"
        f"整体氛围{'积极，多数队员对跑动与配合表示认可' if positive >= len(reviews) / 2 else '有喜有忧'}；"
        f"共同关注点集中在{'体能分配与关键阶段把握' if positive < len(reviews) / 2 else '进攻效率与定位球防守'}。"
        "建议下场继续保持防守强度，同时针对体能短板加强有氧储备。"
    )


def gen_article(db: Session, match: Match) -> dict:
    """基于比分、进球、红黄牌生成赛事纪实文稿草稿。"""
    home, away = _teams(db, match)
    home_score, away_score = match.home_score or 0, match.away_score or 0
    goals = db.query(Goal).filter(Goal.match_id == match.id).order_by(Goal.minute).all()
    cards = db.query(Card).filter(Card.match_id == match.id).order_by(Card.minute).all()

    if home_score == away_score:
        headline = f"{home.name}{home_score}-{away_score}战平{away.name}，互交白卷难分高下"
    elif home_score > away_score:
        headline = f"{home.name}{home_score}-{away_score}力克{away.name}，主场全取三分"
    else:
        headline = f"{away.name}{away_score}-{home_score}客场取胜，{home.name}憾负"

    body = [f"北京时间 {match.time}，{match.venue}，小组赛迎来一场焦点对决。"]
    body.append(
        f"经过90分钟鏖战，{home.name}与{away.name}战成 {home_score}-{away_score}"
        f"{'，' + home.name + '笑到最后' if home_score > away_score else '，' + away.name + '带走了胜利' if away_score > home_score else '，双方各取一分'}。"
    )
    for goal in goals:
        scorer = _player_name(db, goal.player_id)
        team = _team_name(db, goal.team_id)
        body.append(f"第{goal.minute}分钟，{scorer}为{team}建功。")
    card_lines = [f"第{card.minute}分钟，{_player_name(db, card.player_id)}吃到{_card_label(card.type)}" for card in cards]
    if card_lines:
        body.append("；".join(card_lines) + "。")
    body.append("本场过后，积分榜形势更加胶着，后续赛程值得期待。")

    return {"title": headline, "content": "\n".join(body)}


def parse_schedule_text(text: str) -> tuple[list[dict], list[str]]:
    """从 txt/docx 文本中抽取比赛信息（时间、地点、主队、客队、阶段、分组）。

    支持行格式示例：
      6月15日 15:00 南宁市体育场 A组 南宁联队 vs 柳州铁骑
      [淘汰赛] 2026-06-20 19:30 市体育中心 桂林雄鹰 VS 北海浪花
    """
    matches: list[dict] = []
    warnings: list[str] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or "vs" not in line.lower():
            continue
        parsed = _parse_line(line)
        if parsed is None:
            warnings.append(f"无法解析的行：{line}")
            continue
        matches.append(parsed)
    return matches, warnings


def _parse_line(line: str) -> dict | None:
    teams = re.split(r"\s+vs\s+", line, flags=re.IGNORECASE)
    if len(teams) != 2:
        return None
    left_part, away = teams[0].strip(), teams[1].strip()
    time = _extract_time(left_part)
    venue = _extract_venue(left_part)
    group = _extract_group(left_part)
    stage = "knockout" if re.search(r"淘汰|决赛|半决赛|1/4|8强|4强", line, re.IGNORECASE) else "group"
    home = _last_token(left_part)
    if not home or not away or not time:
        return None
    return {"stage": stage, "group": group, "time": time, "venue": venue, "home": home, "away": away}


def _extract_time(text: str) -> str | None:
    match = re.search(r"(\d{1,2}月\d{1,2}日\s+\d{1,2}[:：]\d{2})", text)
    if match:
        return match.group(1).replace("：", ":")
    match = re.search(r"(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}[:：]\d{2})", text)
    if match:
        return match.group(1).replace("/", "-").replace("：", ":")
    return None


def _extract_venue(text: str) -> str:
    match = re.search(r"([\u4e00-\u9fa5A-Za-z0-9]{2,}(?:体育场|体育中心|球场|公园|体育馆))", text)
    return match.group(1) if match else "待定场地"


def _extract_group(text: str) -> str | None:
    match = re.search(r"([A-H]组)", text)
    return match.group(1) if match else None


def _last_token(text: str) -> str:
    tokens = text.split()
    return tokens[-1] if tokens else text


def _card_label(card_type: str) -> str:
    return {"yellow": "黄牌", "red": "红牌", "second_yellow": "两黄变一红"}.get(card_type, card_type)


def _is_positive(content: str) -> bool:
    return any(word in content for word in ("好", "不错", "积极", "到位", "流畅", "满意", "保持", "精彩", "认可"))


def _teams(db: Session, match: Match) -> tuple[Team, Team]:
    home = db.get(Team, match.home_team_id)
    away = db.get(Team, match.away_team_id)
    return home or Team(id=match.home_team_id, name=match.home_team_id, group=""), \
        away or Team(id=match.away_team_id, name=match.away_team_id, group="")


def _team_standing(db: Session, team_id: str):
    rows = compute_standings(db)
    return next((row for row in rows if row.team_id == team_id), None)


def _standing_desc(row, team: Team) -> str:
    if row is None or row.played == 0:
        return "暂无战绩数据"
    return f"{row.played}战{row.won}胜{row.drawn}平{row.lost}负，积{row.points}分"


def _team_name(db: Session, team_id: str) -> str:
    team = db.get(Team, team_id)
    return team.name if team else team_id


def _player_name(db: Session, player_id: str) -> str:
    player = db.get(Player, player_id)
    return f"{player.name}（{player.number}号）" if player else player_id


def _key_player(db: Session, team_id: str) -> str | None:
    players = db.query(Player).filter(Player.team_id == team_id).all()
    if not players:
        return None
    best = max(players, key=lambda p: len(p.personal_traits))
    return f"{best.name}（{best.number}号）" if best.personal_traits else None
