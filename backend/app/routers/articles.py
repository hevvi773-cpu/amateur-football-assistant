"""赛事纪实文稿接口：列表/详情/创建/发布/评论/AI 生成草稿。"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import Article, Comment, Match
from app.schemas import ArticleIn, ArticleOut, ArticlePatch, CommentIn, CommentOut
from app.services.generators import gen_article
from app.services.llm import llm_service
from app.utils import get_or_404, new_id, now_str

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("", response_model=list[ArticleOut])
def list_articles(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Article)
    if status:
        query = query.filter(Article.status == status)
    return [_serialize(db, article) for article in query.order_by(Article.created_at.desc()).all()]


@router.get("/{article_id}", response_model=ArticleOut)
def get_article(article_id: str, db: Session = Depends(get_db)):
    article = get_or_404(db, Article, article_id, "文稿不存在")
    return _serialize(db, article)


@router.post("", response_model=ArticleOut, dependencies=[Depends(require_roles("association"))])
def create_article(payload: ArticleIn, db: Session = Depends(get_db)):
    """协会创建文稿（草稿态，需发布后才公开展示）。"""
    get_or_404(db, Match, payload.match_id, "比赛不存在")
    article = Article(id=new_id("a"), match_id=payload.match_id, title=payload.title,
                      content=payload.content, status="draft", created_at=now_str())
    db.add(article)
    db.commit()
    return _serialize(db, article)


@router.patch("/{article_id}", response_model=ArticleOut,
              dependencies=[Depends(require_roles("association"))])
def update_article(article_id: str, payload: ArticlePatch, db: Session = Depends(get_db)):
    """协会编辑文稿（标题/内容）。"""
    article = get_or_404(db, Article, article_id, "文稿不存在")
    if payload.title is not None:
        article.title = payload.title
    if payload.content is not None:
        article.content = payload.content
    db.commit()
    return _serialize(db, article)


@router.post("/{article_id}/publish", response_model=ArticleOut,
             dependencies=[Depends(require_roles("association"))])
def publish_article(article_id: str, db: Session = Depends(get_db)):
    article = get_or_404(db, Article, article_id, "文稿不存在")
    article.status = "published"
    db.commit()
    return _serialize(db, article)


@router.post("/{article_id}/unpublish", response_model=ArticleOut,
             dependencies=[Depends(require_roles("association"))])
def unpublish_article(article_id: str, db: Session = Depends(get_db)):
    article = get_or_404(db, Article, article_id, "文稿不存在")
    article.status = "draft"
    db.commit()
    return _serialize(db, article)


@router.post("/{article_id}/comments", response_model=CommentOut)
def add_comment(article_id: str, payload: CommentIn, db: Session = Depends(get_db)):
    """全赛区用户可读可评论。"""
    get_or_404(db, Article, article_id, "文稿不存在")
    comment = Comment(id=new_id("c"), article_id=article_id, author=payload.author,
                      content=payload.content, created_at=now_str())
    db.add(comment)
    db.commit()
    return CommentOut(id=comment.id, author=comment.author, content=comment.content,
                      created_at=comment.created_at)


@router.post("/generate/{match_id}", response_model=ArticleOut,
             dependencies=[Depends(require_roles("association"))])
def generate_article(match_id: str, db: Session = Depends(get_db)):
    """AI 一键生成赛事纪实文稿草稿（不直接发布）。"""
    match = get_or_404(db, Match, match_id, "比赛不存在")
    if match.status != "finished":
        raise HTTPException(status_code=400, detail="比赛尚未结束，无法生成文稿")

    draft = gen_article(db, match)
    if llm_service.enabled:
        text = llm_service.chat(
            "你是赛事纪实撰稿人，输出简短中文赛事纪实文稿（标题+正文，用换行分隔）。",
            f"比赛：{match.home_team_id} vs {match.away_team_id}，比分 {match.home_score or 0}-{match.away_score or 0}，"
            f"时间 {match.time}，地点 {match.venue}。",
        )
        if text:
            lines = text.splitlines()
            draft = {"title": lines[0].replace("标题：", "") if lines else "赛事纪实",
                     "content": "\n".join(lines[1:]) or text}

    article = Article(id=new_id("a"), match_id=match_id, title=draft["title"],
                      content=draft["content"], status="draft", created_at=now_str())
    db.add(article)
    db.commit()
    return _serialize(db, article)


def _serialize(db: Session, article: Article) -> ArticleOut:
    comments = db.query(Comment).filter(Comment.article_id == article.id).order_by(Comment.created_at).all()
    return ArticleOut(
        id=article.id, match_id=article.match_id, title=article.title,
        content=article.content, status=article.status, created_at=article.created_at,
        comments=[CommentOut(id=comment.id, author=comment.author, content=comment.content, created_at=comment.created_at)
                  for comment in comments],
    )




