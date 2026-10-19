"""球员接口：列表/详情/身体状态上报/个人特点设置。"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils import get_or_404
from app.deps import get_current_user, require_roles
from app.models import Player
from app.schemas import HealthUpdate, PlayerOut, TraitsUpdate

router = APIRouter(prefix="/api/players", tags=["players"])

VALID_HEALTH = {"healthy", "tired", "minor_injury", "injured"}


@router.get("", response_model=list[PlayerOut])
def list_players(team_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Player)
    if team_id:
        query = query.filter(Player.team_id == team_id)
    return query.order_by(Player.number).all()


@router.get("/{player_id}", response_model=PlayerOut)
def get_player(player_id: str, db: Session = Depends(get_db)):
    player = get_or_404(db, Player, player_id, "球员不存在")
    return player


@router.patch("/{player_id}/health", response_model=PlayerOut,
              dependencies=[Depends(require_roles("member", "captain"))])
def update_health(player_id: str, payload: HealthUpdate, db: Session = Depends(get_db),
                  user: dict = Depends(get_current_user)):
    """上报身体状态：队员仅可改自己；队长/协会人员为全能账号，可管理任意球员。"""
    if payload.health_status not in VALID_HEALTH:
        raise HTTPException(status_code=400, detail=f"非法身体状态: {payload.health_status}")
    player = get_or_404(db, Player, player_id, "球员不存在")
    _ensure_editable(player, user)
    player.health_status = payload.health_status
    db.commit()
    return player


@router.put("/{player_id}/traits", response_model=PlayerOut,
            dependencies=[Depends(require_roles("member", "captain"))])
def update_traits(player_id: str, payload: TraitsUpdate, db: Session = Depends(get_db),
                  user: dict = Depends(get_current_user)):
    """设置个人特点标签：队员仅可改自己；队长/协会人员可管理任意球员。"""
    player = get_or_404(db, Player, player_id, "球员不存在")
    _ensure_editable(player, user)
    player.personal_traits = payload.personal_traits
    db.commit()
    return player


def _ensure_editable(player: Player, user: dict) -> None:
    """全能账号规则：本人可改自己；captain/association 可改任意球员。"""
    if player.id == user["user_id"]:
        return
    if user["role"] in ("captain", "association"):
        return
    raise HTTPException(status_code=403, detail="只能修改自己的身体状态/个人特点")



