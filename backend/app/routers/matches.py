"""赛程相关接口：列表/详情/更改/结果录入。"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import Card, Goal, Match, Player, Team
from app.schemas import MatchOut, MatchUpdate, ParsedScheduleItem, ResultIn
from app.services import cards as card_service
from app.services.notifications import notify_players
from app.utils import get_or_404, new_id

router = APIRouter(prefix="/api/matches", tags=["matches"])

VALID_STATUS = {"upcoming", "ongoing", "finished", "cancelled"}


@router.post("", response_model=list[MatchOut], dependencies=[Depends(require_roles("association"))])
def create_matches(payload: list[ParsedScheduleItem], db: Session = Depends(get_db)):
    """协会确认 AI 解析结果后批量入库：按队名解析/创建球队，生成未开赛比赛。"""
    created = []
    for item in payload:
        home_name = (item.home or "").strip()
        away_name = (item.away or "").strip()
        if not home_name or not away_name:
            continue
        group = (item.group or "学院联赛").strip()
        home_id = _ensure_team_by_name(db, home_name, group)
        away_id = _ensure_team_by_name(db, away_name, group)
        if home_id == away_id:
            continue
        stage = item.stage or "group"
        match = Match(
            id=new_id("m"), stage=stage,
            group_name=group if stage == "group" else None,
            home_team_id=home_id, away_team_id=away_id,
            time=item.time or "", venue=item.venue or "",
            status="upcoming", home_score=None, away_score=None,
        )
        db.add(match)
        created.append(match)
    db.commit()
    return [serialize_match(db, match) for match in created]


@router.get("", response_model=list[MatchOut])
def list_matches(
    stage: Optional[str] = None,
    team_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """赛程列表，支持按阶段/球队/状态过滤。"""
    query = db.query(Match)
    if stage:
        query = query.filter(Match.stage == stage)
    if status:
        query = query.filter(Match.status == status)
    if team_id:
        query = query.filter(or_(Match.home_team_id == team_id, Match.away_team_id == team_id))
    matches = query.order_by(Match.time).all()
    return [serialize_match(db, match) for match in matches]


@router.get("/{match_id}", response_model=MatchOut)
def get_match(match_id: str, db: Session = Depends(get_db)):
    match = get_or_404(db, Match, match_id, "比赛不存在")
    return serialize_match(db, match)


@router.patch("/{match_id}", response_model=MatchOut, dependencies=[Depends(require_roles("association"))])
def update_match(match_id: str, payload: MatchUpdate, db: Session = Depends(get_db)):
    """协会更改赛程：时间/地点/对阵/状态（用于解决时间冲突等调整）。"""
    match = get_or_404(db, Match, match_id, "比赛不存在")
    if payload.status and payload.status not in VALID_STATUS:
        raise HTTPException(status_code=400, detail=f"非法状态: {payload.status}")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(match, field, value)
    db.commit()
    return serialize_match(db, match)


@router.post("/{match_id}/result", response_model=MatchOut, dependencies=[Depends(require_roles("association"))])
def enter_result(match_id: str, result: ResultIn, db: Session = Depends(get_db)):
    """录入比赛结果：比分/进球/红黄牌，自动累计牌数与停赛，并推送赛后感想邀请。"""
    match = get_or_404(db, Match, match_id, "比赛不存在")
    if match.status == "finished":
        raise HTTPException(status_code=400, detail="该比赛已录入结果，请通过更改接口修改")
    card_service.apply_match_result(db, match, result)

    player_ids = _participant_player_ids(db, match.home_team_id, match.away_team_id)
    notify_players(
        db, player_ids, "review_invite", "邀请填写赛后感想",
        f"{_team_name(db, match.home_team_id)} vs {_team_name(db, match.away_team_id)} 的比赛已结束，邀请你填写本场赛后感想。",
        related_id=match.id,
    )
    return serialize_match(db, match)


def serialize_match(db: Session, match: Match) -> MatchOut:
    """组装比赛详情：队伍名 + 进球/红黄牌记录。"""
    goals = sorted(db.query(Goal).filter(Goal.match_id == match.id).all(), key=lambda goal: goal.minute)
    cards = sorted(db.query(Card).filter(Card.match_id == match.id).all(), key=lambda card: card.minute)
    return MatchOut(
        id=match.id,
        stage=match.stage,
        group_name=match.group_name,
        home_team_id=match.home_team_id,
        away_team_id=match.away_team_id,
        home_team_name=_team_name(db, match.home_team_id),
        away_team_name=_team_name(db, match.away_team_id),
        home_score=match.home_score,
        away_score=match.away_score,
        time=match.time,
        venue=match.venue,
        status=match.status,
        goals=[{"id": goal.id, "player_id": goal.player_id, "minute": goal.minute} for goal in goals],
        cards=[{"id": card.id, "player_id": card.player_id, "minute": card.minute, "type": card.type} for card in cards],
    )



def _participant_player_ids(db: Session, home_team_id: str, away_team_id: str) -> list[str]:
    return [
        player.id for player in db.query(Player)
        .filter(or_(Player.team_id == home_team_id, Player.team_id == away_team_id))
        .all()
    ]


def _ensure_team_by_name(db: Session, name: str, group: str) -> str:
    """按规范名查找球队，不存在则创建（用于赛程批量入库）。"""
    team = db.query(Team).filter(Team.name == name).first()
    if team is not None:
        return team.id
    team = Team(id=new_id("t"), name=name, group=group)
    db.add(team)
    return team.id


def _team_name(db: Session, team_id: str) -> str:
    team = db.get(Team, team_id)
    return team.name if team else team_id
