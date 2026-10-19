"""约球接龙接口：列表/创建/报名/取消/模拟截止。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import SocialEvent
from app.schemas import SocialEventIn, SocialEventOut
from app.services.social import cancel_signup, settle_deadline, signup_event
from app.utils import new_id

router = APIRouter(prefix="/api/social", tags=["social"])


@router.get("/events", response_model=list[SocialEventOut])
def list_events(db: Session = Depends(get_db)):
    """全赛区公开的约球接龙列表。"""
    return db.query(SocialEvent).order_by(SocialEvent.deadline).all()


@router.post("/events", response_model=SocialEventOut)
def create_event(payload: SocialEventIn, db: Session = Depends(get_db),
                 user: dict = Depends(require_roles("member", "captain", "association"))):
    """创建接龙（外部访客不可参与）。"""
    event = SocialEvent(
        id=new_id("s"), title=payload.title, type=payload.type, time=payload.time,
        venue=payload.venue, min_players=payload.min_players, current_players=[user["user_id"]],
        deadline=payload.deadline, status="recruiting", creator_id=user["user_id"],
        creator_name=_user_name(db, user["user_id"]), description=payload.description,
    )
    db.add(event)
    db.commit()
    return event


@router.post("/events/{event_id}/signup", response_model=SocialEventOut)
def signup(event_id: str, db: Session = Depends(get_db),
           user: dict = Depends(require_roles("member", "captain", "association"))):
    event = get_or_404(db, SocialEvent, event_id, "接龙不存在")
    if event.status != "recruiting":
        raise HTTPException(status_code=400, detail="该接龙已截止，无法报名")
    return signup_event(db, event, user["user_id"])


@router.post("/events/{event_id}/cancel-signup", response_model=SocialEventOut)
def cancel_signup_route(event_id: str, db: Session = Depends(get_db),
                        user: dict = Depends(require_roles("member", "captain", "association"))):
    event = get_or_404(db, SocialEvent, event_id, "接龙不存在")
    return cancel_signup(db, event, user["user_id"])


@router.post("/events/{event_id}/simulate-deadline", response_model=SocialEventOut)
def simulate_deadline(event_id: str, db: Session = Depends(get_db)):
    """模拟截止：人数达标→已成行（通知一次）；不足→已取消（持续可再触发通知）。"""
    event = get_or_404(db, SocialEvent, event_id, "接龙不存在")
    settle_deadline(db, event)
    return event



def _user_name(db: Session, user_id: str) -> str:
    from app.models import Player

    player = db.get(Player, user_id)
    return player.name if player else "用户"
