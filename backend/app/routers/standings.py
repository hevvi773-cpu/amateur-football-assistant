"""积分榜与球队接口。"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import Player, Team
from app.schemas import StandingRow, TeamOut
from app.services.standings import compute_standings

router = APIRouter(prefix="/api", tags=["standings"])


@router.get("/standings", response_model=list[StandingRow])
def get_standings(group: Optional[str] = None, db: Session = Depends(get_db)):
    """积分榜（按分组，实时由已结束比赛重算）。"""
    return compute_standings(db, group)


@router.get("/teams", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).order_by(Team.group, Team.id).all()


@router.get("/teams/overview", dependencies=[Depends(require_roles("association"))])
def team_overview(db: Session = Depends(get_db)):
    """协会视角：全赛区各球队总览（人数/健康率/红黄牌/停赛/积分排名/战绩）。"""
    standings = {row.team_id: row for row in compute_standings(db)}
    overview = []
    for team in db.query(Team).order_by(Team.group, Team.id).all():
        players = db.query(Player).filter(Player.team_id == team.id).all()
        healthy = sum(1 for player in players if player.health_status == "healthy")
        overview.append({
            "team_id": team.id,
            "team_name": team.name,
            "group": team.group,
            "player_count": len(players),
            "health_rate": round(healthy / len(players), 2) if players else 0.0,
            "yellow_cards": sum(player.yellow_cards for player in players),
            "red_cards": sum(player.red_cards for player in players),
            "suspended_count": sum(1 for player in players if player.is_suspended),
            "points": standings[team.id].points if team.id in standings else 0,
            "rank": standings[team.id].rank if team.id in standings else None,
            "record": {
                "won": standings[team.id].won if team.id in standings else 0,
                "drawn": standings[team.id].drawn if team.id in standings else 0,
                "lost": standings[team.id].lost if team.id in standings else 0,
            },
        })
    return overview
