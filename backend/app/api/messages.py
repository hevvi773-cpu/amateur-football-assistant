"""消息 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Message
from app.services.database import messages_db

router = APIRouter()


@router.get("", response_model=List[Message])
async def list_messages():
    return messages_db.all()


@router.get("/unread-count")
async def unread_count():
    messages = messages_db.all()
    count = sum(1 for m in messages if not m.get("isRead", False))
    return {"count": count}


@router.post("/mark-all-read")
async def mark_all_read():
    messages = messages_db.all()
    for msg in messages:
        if not msg.get("isRead", False):
            messages_db.update(msg["id"], {"isRead": True})
    return {"message": "全部标记已读"}


@router.get("/{message_id}", response_model=Message)
async def get_message(message_id: str):
    msg = messages_db.get(message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="消息不存在")
    return msg


@router.post("", response_model=Message)
async def create_message(message: Message):
    return messages_db.create(message.model_dump())


@router.delete("/{message_id}")
async def delete_message(message_id: str):
    if not messages_db.delete(message_id):
        raise HTTPException(status_code=404, detail="消息不存在")
    return {"message": "删除成功"}
