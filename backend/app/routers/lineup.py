"""阵容接口：读取/保存/发布/AI 推荐。"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import Lineup, Match, Team
from app.schemas import LineupOut, LineupRecommendIn, LineupSave
from app.services import recommender
from app.services.llm import llm_service
from app.services.notifications import notify_team
from app.utils import new_id, now_str

router = APIRouter(prefix="/api/lineups", tags=["lineup"])


@router.get("", response_model=LineupOut)
def get_lineup(match_id: str, team_id: str, db: Session = Depends(get_db)):
    """获取某场比赛某支球队的阵容，不存在时返回空草稿。"""
    lineup = _find_lineup(db, match_id, team_id)
    if lineup is None:
        lineup = _create_draft(db, match_id, team_id)
    return lineup


@router.put("", response_model=LineupOut, dependencies=[Depends(require_roles("captain"))])
def save_lineup(payload: LineupSave, db: Session = Depends(get_db)):
    """队长保存阵容草稿。"""
    lineup = _find_lineup(db, payload.match_id, payload.team_id)
    if lineup is None:
        lineup = Lineup(id=new_id("l"), match_id=payload.match_id, team_id=payload.team_id,
                        formation=payload.formation, slots=[slot.dict() for slot in payload.slots],
                        substitutes=payload.substitutes, status="draft")
        db.add(lineup)
    else:
        lineup.formation = payload.formation
        lineup.slots = [slot.dict() for slot in payload.slots]
        lineup.substitutes = payload.substitutes
        lineup.status = "draft"
    db.commit()
    return lineup


@router.post("/{lineup_id}/publish", response_model=LineupOut,
             dependencies=[Depends(require_roles("captain"))])
def publish_lineup(lineup_id: str, db: Session = Depends(get_db)):
    """发布阵容，并向本队全体队员推送站内消息。"""
    lineup = get_or_404(db, Lineup, lineup_id, "阵容不存在")
    lineup.status = "published"
    lineup.published_at = now_str()
    db.commit()
    opponent = _opponent_name(db, lineup.match_id, lineup.team_id)
    notify_team(db, lineup.team_id, "lineup", "阵容发布通知",
                f"队长已发布对阵{opponent}的首发阵容，请及时查看。", related_id=lineup.match_id)
    return lineup


@router.post("/recommend", response_model=None, dependencies=[Depends(require_roles("captain"))])
def recommend(payload: LineupRecommendIn, db: Session = Depends(get_db)):
    """AI 推荐阵容：返回推荐站位、替补与理由面板。"""
    match = db.get(Match, payload.match_id)
    team = db.get(Team, payload.team_id)
    if match is None or team is None:
        raise HTTPException(status_code=404, detail="比赛或球队不存在")

    result = recommender.recommend_lineup(db, match, team, payload.formation)
    source = "mock"
    if llm_service.enabled:
        try:
            text = llm_service.chat(
                "你是业余足球队的AI助教，输出简洁中文推荐理由。",
                f"球队{team.name}（{payload.formation}）对阵{_opponent_name(db, payload.match_id, payload.team_id)}，"
                f"请给出推荐理由：阵型选择依据、各位置人选依据、针对性安排、替补策略、注意事项。",
            )
            if text:
                result["reasons"] = _fallback_reasons(result, text)
                source = "llm"
        except Exception:
            source = "mock"
    result["source"] = source
    return result


def _find_lineup(db: Session, match_id: str, team_id: str) -> Optional[Lineup]:
    return (
        db.query(Lineup)
        .filter(Lineup.match_id == match_id, Lineup.team_id == team_id)
        .first()
    )


def _create_draft(db: Session, match_id: str, team_id: str) -> Lineup:
    from app.services.formations import build_default_slots

    lineup = Lineup(id=new_id("l"), match_id=match_id, team_id=team_id, formation="4-3-3",
                    slots=[slot.dict() for slot in build_default_slots("4-3-3")],
                    substitutes=[], status="draft")
    db.add(lineup)
    db.commit()
    return lineup



def _opponent_name(db: Session, match_id: str, team_id: str) -> str:
    match = db.get(Match, match_id)
    if match is None:
        return "对手"
    opponent_id = match.home_team_id if match.away_team_id == team_id else match.away_team_id
    team = db.get(Team, opponent_id)
    return team.name if team else opponent_id


def _fallback_reasons(result: dict, text: str) -> dict:
    """大模型未输出结构化 JSON 时，把文本塞进注意事项并保留规则理由兜底。"""
    reasons = result.get("reasons", {})
    reasons["注意事项"] = text
    return reasons
