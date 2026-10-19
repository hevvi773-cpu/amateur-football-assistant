"""通用工具函数。"""
from datetime import datetime
from typing import Type, TypeVar
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

ID_PREFIX_MAX_LEN = 16

ModelT = TypeVar("ModelT")


def new_id(prefix: str) -> str:
    """生成带业务前缀的唯一ID，如 'm_9f3a2b1c0d4e'。"""
    return f"{prefix}_{uuid4().hex[:12]}"


def now_str() -> str:
    """当前时间字符串，格式 YYYY-MM-DD HH:MM。"""
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def get_or_404(db: Session, model: Type[ModelT], obj_id: str, detail: str) -> ModelT:
    """按主键取记录，不存在时抛 404。各路由共用，避免重复实现。"""
    obj = db.get(model, obj_id)
    if obj is None:
        raise HTTPException(status_code=404, detail=detail)
    return obj
