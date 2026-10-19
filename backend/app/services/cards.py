"""比赛结果录入服务：比分、进球、红黄牌累计与停赛状态更新。"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Card, Goal, Match, Player
from app.schemas import ResultIn
from app.utils import new_id

SUSPEND_YELLOW_THRESHOLD = 2  # 累计两黄停赛


def apply_match_result(db: Session, match: Match, result: ResultIn) -> Match:
    """写入比分与进球、累计红黄牌、更新停赛状态、置比赛为已结束。"""
    match.home_score = result.home_score
    match.away_score = result.away_score
    match.status = "finished"

    for goal in result.goals:
        db.add(Goal(id=new_id("g"), match_id=match.id, player_id=goal.player_id, minute=goal.minute))

    for card in result.cards:
        db.add(Card(id=new_id("c"), match_id=match.id, player_id=card.player_id, minute=card.minute, type=card.type))
        _accumulate_card(db, card.player_id, card.type)

    db.commit()
    return match


def _accumulate_card(db: Session, player_id: str, card_type: str) -> None:
    player = db.get(Player, player_id)
    if player is None:
        return  # 非本赛区注册球员（如外队球员），跳过累计
    if card_type == "red":
        player.red_cards += 1
    else:
        player.yellow_cards += 1
    player.is_suspended = (
        player.yellow_cards >= SUSPEND_YELLOW_THRESHOLD or player.red_cards >= 1
    )


def refresh_suspensions(db: Session, team_id: str | None = None) -> None:
    """按当前累计牌数重算停赛状态（用于人工更正牌数后同步）。"""
    query = db.query(Player)
    if team_id:
        query = query.filter(Player.team_id == team_id)
    for player in query.all():
        player.is_suspended = (
            player.yellow_cards >= SUSPEND_YELLOW_THRESHOLD or player.red_cards >= 1
        )
    db.commit()
