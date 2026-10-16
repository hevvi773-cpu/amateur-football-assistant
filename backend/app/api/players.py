"""球员 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Player
from app.services.database import players_db

router = APIRouter()


@router.get("", response_model=List[Player])
async def list_players(teamId: str = None):
    if teamId:
        return players_db.filter(teamId=teamId)
    return players_db.all()


@router.get("/{player_id}", response_model=Player)
async def get_player(player_id: str):
    player = players_db.get(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="球员不存在")
    return player


@router.post("", response_model=Player)
async def create_player(player: Player):
    return players_db.create(player.model_dump())


@router.put("/{player_id}", response_model=Player)
async def update_player(player_id: str, player: Player):
    updated = players_db.update(player_id, player.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="球员不存在")
    return updated


@router.delete("/{player_id}")
async def delete_player(player_id: str):
    if not players_db.delete(player_id):
        raise HTTPException(status_code=404, detail="球员不存在")
    return {"message": "删除成功"}
