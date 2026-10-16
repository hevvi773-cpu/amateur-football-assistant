"""比赛 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Match
from app.services.database import matches_db

router = APIRouter()


@router.get("", response_model=List[Match])
async def list_matches():
    """获取所有比赛"""
    return matches_db.all()


@router.get("/{match_id}", response_model=Match)
async def get_match(match_id: str):
    """获取单个比赛"""
    match = matches_db.get(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="比赛不存在")
    return match


@router.post("", response_model=Match)
async def create_match(match: Match):
    """创建比赛"""
    return matches_db.create(match.model_dump())


@router.put("/{match_id}", response_model=Match)
async def update_match(match_id: str, match: Match):
    """更新比赛"""
    updated = matches_db.update(match_id, match.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="比赛不存在")
    return updated


@router.delete("/{match_id}")
async def delete_match(match_id: str):
    """删除比赛"""
    if not matches_db.delete(match_id):
        raise HTTPException(status_code=404, detail="比赛不存在")
    return {"message": "删除成功"}
