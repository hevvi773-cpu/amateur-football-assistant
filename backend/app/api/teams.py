"""球队 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Team
from app.services.database import teams_db

router = APIRouter()


@router.get("", response_model=List[Team])
async def list_teams():
    return teams_db.all()


@router.get("/{team_id}", response_model=Team)
async def get_team(team_id: str):
    team = teams_db.get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="球队不存在")
    return team


@router.post("", response_model=Team)
async def create_team(team: Team):
    return teams_db.create(team.model_dump())


@router.put("/{team_id}", response_model=Team)
async def update_team(team_id: str, team: Team):
    updated = teams_db.update(team_id, team.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="球队不存在")
    return updated


@router.delete("/{team_id}")
async def delete_team(team_id: str):
    if not teams_db.delete(team_id):
        raise HTTPException(status_code=404, detail="球队不存在")
    return {"message": "删除成功"}
