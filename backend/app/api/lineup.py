"""阵容 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Lineup
from app.services.database import lineup_db

router = APIRouter()


@router.get("/{match_id}", response_model=Lineup)
async def get_lineup(match_id: str):
    lineups = lineup_db.filter(matchId=match_id)
    if not lineups:
        raise HTTPException(status_code=404, detail="阵容不存在")
    return lineups[0]


@router.post("", response_model=Lineup)
async def create_or_update_lineup(lineup: Lineup):
    existing = lineup_db.filter(matchId=lineup.matchId)
    if existing:
        updated = lineup_db.update(existing[0]["id"], lineup.model_dump())
        return updated
    return lineup_db.create(lineup.model_dump())


@router.delete("/{match_id}")
async def delete_lineup(match_id: str):
    lineups = lineup_db.filter(matchId=match_id)
    if not lineups:
        raise HTTPException(status_code=404, detail="阵容不存在")
    lineup_db.delete(lineups[0]["id"])
    return {"message": "删除成功"}
