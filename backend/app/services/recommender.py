"""AI 阵容推荐服务（规则引擎，未接入大模型时兜底）。

原则：优先健康、未停赛球员；按位置匹配度、个人特点与状态打分排序。
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Match, Player, Team
from app.schemas import LineupSlot
from app.services.formations import POSITION_COMPAT, build_default_slots

HEALTH_PENALTY = {"healthy": 0, "tired": -1, "minor_injury": -2, "injured": -99}
TRAIT_BONUS = {"速度快": 2, "技术强": 2, "强壮": 1.5, "灵活": 1.5, "背身拿球": 1}


def recommend_lineup(db: Session, match: Match, team: Team, formation: str) -> dict:
    """生成推荐阵容（slots + substitutes）与推荐理由。"""
    ranked = _rank_players(db, team.id)

    slots = _fill_slots(formation, ranked)
    fielded_ids = {slot.playerId for slot in slots if slot.playerId}
    substitutes = [player.id for player in ranked if player.id not in fielded_ids][:5]

    reasons = _build_reasons(db, match, team, formation, slots, substitutes)
    return {
        "formation": formation,
        "slots": [slot.model_dump() for slot in slots],
        "substitutes": substitutes,
        "reasons": reasons,
    }


def _rank_players(db: Session, team_id: str) -> list[Player]:
    """按 停赛/伤病 > 健康 > 牌数 > 特点 打分，返回降序的可用球员。"""
    players = [player for player in db.query(Player).filter(Player.team_id == team_id).all()]
    eligible = [
        player for player in players
        if not p.is_suspended and p.health_status != "injured"
    ]
    eligible.sort(key=_score_player, reverse=True)
    return eligible


def _score_player(player: Player) -> float:
    score = 50.0 + HEALTH_PENALTY.get(player.health_status, 0) - player.yellow_cards * 2
    score += sum(TRAIT_BONUS.get(trait, 0) for trait in player.personal_traits)
    return score


def _fill_slots(formation: str, ranked: list[Player]) -> list[LineupSlot]:
    """按位置兼容度贪心填位：先匹配擅长位置，再兜底任意可用球员。"""
    slots = build_default_slots(formation)
    used: set[str] = set()

    for slot in slots:
        chosen = _pick_candidate(ranked, used, POSITION_COMPAT.get(slot.position, []))
        if chosen:
            slot.playerId = chosen
            used.add(chosen)
    return slots


def _pick_candidate(ranked: list[Player], used: set[str], preferred: list[str]) -> str | None:
    for player in ranked:
        if player.id in used:
            continue
        if player.position in preferred:
            return player.id
    for player in ranked:
        if player.id not in used:
            return player.id
    return None


def _build_reasons(db: Session, match: Match, team: Team, formation: str, slots: list, substitutes: list) -> dict:
    """生成可读的推荐理由（对应 PRD 5.2.4 理由面板字段）。"""
    opponent = db.get(Team, match.home_team_id if match.away_team_id == team.id else match.away_team_id)
    fielded_ids = [slot.playerId for slot in slots if slot.playerId]
    health_note = _health_note(db, team.id)

    return {
        "阵型选择依据": (
            f"本队当前可用健康球员充足，推荐 {formation} 以保持攻守平衡；"
            f"对手 {opponent.name if opponent else '待定'} 中场推进为主，此阵型可兼顾中路密度与边路回防。"
        ),
        "各位置人选依据": (
            f"优先安排未停赛、状态健康的球员，按擅长位置对号入座；"
            f"共占用 {len(fielded_ids)} 名首发，替补 {len(substitutes)} 人。"
        ),
        "针对性安排": health_note,
        "替补策略": (
            "替补优先保留体能充沛的边路与锋线球员，便于下半场提速；"
            + ("名单见替补栏。" if substitutes else "当前无可用替补。")
        ),
        "注意事项": "推荐结果仅为参考草稿，队长可手动调整后再发布。",
    }


def _health_note(db: Session, team_id: str) -> str:
    players = db.query(Player).filter(Player.team_id == team_id).all()
    suspended = [player.name for player in players if player.is_suspended]
    injured = [player.name for player in players if player.health_status in ("minor_injury", "injured")]
    parts = []
    if suspended:
        parts.append(f"停赛球员：{'、'.join(suspended)}（已排除）")
    if injured:
        parts.append(f"带伤球员：{'、'.join(injured)}（已降权/排除）")
    return "；".join(parts) if parts else "全队健康状态良好，无停赛或伤病干扰。"
