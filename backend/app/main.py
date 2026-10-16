"""足球AI助手 FastAPI 后端入口"""
import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 确保 app 包可导入
sys.path.insert(0, str(Path(__file__).parent))

from app.api.matches import router as matches_router
from app.api.teams import router as teams_router
from app.api.players import router as players_router
from app.api.reviews import router as reviews_router
from app.api.articles import router as articles_router
from app.api.social import router as social_router
from app.api.messages import router as messages_router
from app.api.lineup import router as lineup_router
from app.api.ai import router as ai_router

app = FastAPI(
    title="足球AI助手 API",
    description="面向业余足球赛事赛区的一体化管理工具后端API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(matches_router, prefix="/api/matches", tags=["比赛"])
app.include_router(teams_router, prefix="/api/teams", tags=["球队"])
app.include_router(players_router, prefix="/api/players", tags=["球员"])
app.include_router(reviews_router, prefix="/api/reviews", tags=["赛后复盘"])
app.include_router(articles_router, prefix="/api/articles", tags=["赛事纪实"])
app.include_router(social_router, prefix="/api/social", tags=["约球社交"])
app.include_router(messages_router, prefix="/api/messages", tags=["消息"])
app.include_router(lineup_router, prefix="/api/lineup", tags=["阵容"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI能力"])


@app.get("/")
async def root():
    return {
        "message": "足球AI助手 API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
