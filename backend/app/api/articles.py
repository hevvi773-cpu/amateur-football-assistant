"""赛事纪实文章 API"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Article
from app.services.database import articles_db

router = APIRouter()


@router.get("", response_model=List[Article])
async def list_articles():
    return articles_db.all()


@router.get("/{article_id}", response_model=Article)
async def get_article(article_id: str):
    article = articles_db.get(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")
    return article


@router.post("", response_model=Article)
async def create_article(article: Article):
    return articles_db.create(article.model_dump())


@router.put("/{article_id}", response_model=Article)
async def update_article(article_id: str, article: Article):
    updated = articles_db.update(article_id, article.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="文章不存在")
    return updated


@router.delete("/{article_id}")
async def delete_article(article_id: str):
    if not articles_db.delete(article_id):
        raise HTTPException(status_code=404, detail="文章不存在")
    return {"message": "删除成功"}
