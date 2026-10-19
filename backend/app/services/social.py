"""约球接龙规则服务：报名/退出与截止结算。"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import SocialEvent
from app.services.notifications import create_notification


def signup_event(db: Session, event: SocialEvent, player_id: str) -> SocialEvent:
    """报名；已在名单中则忽略。"""
    if player_id not in event.current_players:
        event.current_players = event.current_players + [player_id]
        db.commit()
    return event


def cancel_signup(db: Session, event: SocialEvent, player_id: str) -> SocialEvent:
    """取消报名。"""
    if player_id in event.current_players:
        event.current_players = [pid for pid in event.current_players if pid != player_id]
        db.commit()
    return event


def settle_deadline(db: Session, event: SocialEvent) -> str:
    """截止结算：人数达标 → 已成行（通知一次）；人数不足 → 已取消（通知一次）。

    返回动作描述；若状态已非招募中则不做任何变更。
    """
    if event.status != "recruiting":
        return "noop"

    enough = len(event.current_players) >= event.min_players
    if enough:
        event.status = "confirmed"
        create_notification(
            db, event.creator_id, "social", "约球已成行",
            f"「{event.title}」报名人数已达标，活动确认举行！",
            related_id=event.id,
        )
        action = "confirmed"
    else:
        event.status = "cancelled"
        create_notification(
            db, event.creator_id, "social", "约球已取消",
            f"「{event.title}」截止时人数不足（{len(event.current_players)}/{event.min_players}），活动取消。",
            related_id=event.id,
        )
        action = "cancelled"
    event.deadline_notified = True
    db.commit()
    return action


def is_deadline_passed(event: SocialEvent) -> bool:
    """判断截止时间是否已过。"""
    try:
        deadline = datetime.strptime(event.deadline, "%Y-%m-%d %H:%M")
        return datetime.now() > deadline
    except ValueError:
        return False
