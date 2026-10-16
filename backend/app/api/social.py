"""约球社交 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import SocialEvent
from app.services.database import social_db

router = APIRouter()


@router.get("", response_model=List[SocialEvent])
async def list_events():
    return social_db.all()


@router.get("/{event_id}", response_model=SocialEvent)
async def get_event(event_id: str):
    event = social_db.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="活动不存在")
    return event


@router.post("", response_model=SocialEvent)
async def create_event(event: SocialEvent):
    return social_db.create(event.model_dump())


@router.put("/{event_id}", response_model=SocialEvent)
async def update_event(event_id: str, event: SocialEvent):
    updated = social_db.update(event_id, event.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="活动不存在")
    return updated


@router.delete("/{event_id}")
async def delete_event(event_id: str):
    if not social_db.delete(event_id):
        raise HTTPException(status_code=404, detail="活动不存在")
    return {"message": "删除成功"}


@router.post("/{event_id}/join")
async def join_event(event_id: str):
    event = social_db.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="活动不存在")
    if event["currentParticipants"] >= event["maxParticipants"]:
        raise HTTPException(status_code=400, detail="活动已满")
    event["currentParticipants"] += 1
    social_db.update(event_id, event)
    return {"message": "报名成功", "currentParticipants": event["currentParticipants"]}
