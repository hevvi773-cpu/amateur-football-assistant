"""站内消息通知服务。"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Notification, Player
from app.utils import new_id, now_str


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    content: str,
    related_id: str | None = None,
) -> Notification:
    """创建一条站内消息。"""
    notification = Notification(
        id=new_id("msg"),
        user_id=user_id,
        type=notification_type,
        title=title,
        content=content,
        is_read=False,
        related_id=related_id,
        created_at=now_str(),
    )
    db.add(notification)
    db.commit()
    return notification


def notify_team(
    db: Session,
    team_id: str,
    notification_type: str,
    title: str,
    content: str,
    related_id: str | None = None,
) -> int:
    """向某支球队的全部球员推送同一条消息，返回推送条数。"""
    player_ids = [p.id for p in db.query(Player).filter(Player.team_id == team_id).all()]
    for player_id in player_ids:
        create_notification(db, player_id, notification_type, title, content, related_id)
    return len(player_ids)


def notify_players(
    db: Session,
    player_ids: list[str],
    notification_type: str,
    title: str,
    content: str,
    related_id: str | None = None,
) -> int:
    """向指定球员列表推送同一条消息，返回推送条数。"""
    for player_id in player_ids:
        create_notification(db, player_id, notification_type, title, content, related_id)
    return len(player_ids)
