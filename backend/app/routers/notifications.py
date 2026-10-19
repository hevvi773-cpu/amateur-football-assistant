"""站内消息接口：列表/已读/未读数。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Notification
from app.schemas import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user["user_id"])
        .order_by(Notification.created_at.desc())
        .all()
    )
    return notifications


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """全部标记已读，顶部铃铛红点消除。"""
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user["user_id"], Notification.is_read.is_(False))
        .all()
    )
    for row in rows:
        row.is_read = True
    db.commit()
    return {"marked": len(rows)}


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user["user_id"], Notification.is_read.is_(False))
        .count()
    )
    return {"unread": count}
