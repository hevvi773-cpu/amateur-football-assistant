"""赛后感想接口：查看/填写/全队 AI 综合总结。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import Match, Player, Review
from app.schemas import ReviewIn, ReviewOut, ReviewSummaryOut
from app.services.generators import gen_review_summary
from app.services.llm import llm_service
from app.utils import new_id, now_str

router = APIRouter(prefix="/api/matches", tags=["reviews"])


@router.get("/{match_id}/reviews", response_model=list[ReviewOut])
def list_reviews(match_id: str, db: Session = Depends(get_db)):
    """查看某场比赛的赛后感想（本队队员视角）。"""
    get_or_404(db, Match, match_id, "比赛不存在")
    reviews = db.query(Review).filter(Review.match_id == match_id).order_by(Review.created_at).all()
    return [_serialize(db, review) for review in reviews]


@router.post("/{match_id}/reviews", response_model=ReviewOut)
def create_review(match_id: str, payload: ReviewIn, db: Session = Depends(get_db),
                  user: dict = Depends(require_roles("member", "captain"))):
    """填写赛后感想。"""
    match = get_or_404(db, Match, match_id, "比赛不存在")
    if match.status != "finished":
        raise HTTPException(status_code=400, detail="比赛尚未结束，暂不能填写感想")
    review = Review(
        id=new_id("r"), match_id=match_id, player_id=user["user_id"],
        author_role=user["role"], content=payload.content, created_at=now_str(),
    )
    db.add(review)
    db.commit()
    return _serialize(db, review)


@router.get("/{match_id}/review-summary", response_model=ReviewSummaryOut,
            dependencies=[Depends(require_roles("member", "captain"))])
def review_summary(match_id: str, db: Session = Depends(get_db)):
    """全队 AI 综合总结（汇总本场所有感想生成一份，不逐条生成）。"""
    get_or_404(db, Match, match_id, "比赛不存在")
    reviews = db.query(Review).filter(Review.match_id == match_id).all()

    source = "mock"
    summary = gen_review_summary(db, db.get(Match, match_id), reviews)
    if llm_service.enabled:
        text = llm_service.chat(
            "你是足球队的AI复盘助手，把全队感想综合成一段简洁中文总结。",
            "本场赛后感想如下，请综合提炼为全队统一的复盘总结：\n"
            + "\n".join(f"- {review.content}" for review in reviews),
        )
        if text:
            summary = text
            source = "llm"
    return ReviewSummaryOut(match_id=match_id, summary=summary, source=source)


def _serialize(db: Session, review: Review) -> ReviewOut:
    player = db.get(Player, review.player_id)
    return ReviewOut(
        id=review.id, match_id=review.match_id, player_id=review.player_id,
        player_name=player.name if player else None, author_role=review.author_role,
        content=review.content, created_at=review.created_at,
    )



