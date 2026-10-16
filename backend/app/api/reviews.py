"""赛后复盘 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Review
from app.services.database import reviews_db

router = APIRouter()


@router.get("", response_model=List[Review])
async def list_reviews(matchId: str = None):
    if matchId:
        return reviews_db.filter(matchId=matchId)
    return reviews_db.all()


@router.get("/{review_id}", response_model=Review)
async def get_review(review_id: str):
    review = reviews_db.get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="复盘不存在")
    return review


@router.post("", response_model=Review)
async def create_review(review: Review):
    return reviews_db.create(review.model_dump())


@router.put("/{review_id}", response_model=Review)
async def update_review(review_id: str, review: Review):
    updated = reviews_db.update(review_id, review.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="复盘不存在")
    return updated


@router.delete("/{review_id}")
async def delete_review(review_id: str):
    if not reviews_db.delete(review_id):
        raise HTTPException(status_code=404, detail="复盘不存在")
    return {"message": "删除成功"}
