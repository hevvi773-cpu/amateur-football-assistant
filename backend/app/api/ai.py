"""AI 能力 API - 比分预测、战术攻略、阵容推荐、赛后复盘、赛事纪实、赛程解析"""
from fastapi import APIRouter, HTTPException
from typing import List

from app.models.models import (
    PredictionRequest, PredictionResponse,
    TacticsRequest, TacticsResponse,
    ReviewRequest, ReviewResponse,
    LineupRequest, LineupResponse, LineupSlot,
)
from app.services.llm_service import get_llm_service
from app.services.ml_prediction import get_ml_prediction_service
from app.services.rag_service import get_rag_service
from app.services.database import matches_db, teams_db, players_db

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict_score(request: PredictionRequest):
    """AI 比分预测 - 使用 ML 模型预测"""
    ml_service = get_ml_prediction_service()
    result = ml_service.predict(request.homeTeamId, request.awayTeamId)
    return PredictionResponse(**result)


@router.post("/tactics")
async def generate_tactics(request: TacticsRequest):
    """AI 赛前战术攻略 - 使用 DeepSeek + RAG 战术知识库"""
    llm_service = get_llm_service()
    rag_service = get_rag_service()

    # 获取比赛和球队信息
    match = matches_db.get(request.matchId)
    team = teams_db.get(request.teamId)
    if not match:
        raise HTTPException(status_code=404, detail="比赛不存在")

    match_info = f"{match.get('homeTeamId')} vs {match.get('awayTeamId')}，时间：{match.get('time')}，地点：{match.get('venue')}"
    team_info = team.get("name", "未知球队") if team else "未知球队"

    # RAG 检索战术知识
    context = rag_service.get_context(f"{team_info} 战术 阵型")
    system_prompt = f"你是一名专业足球战术分析师。参考以下战术知识：\n{context}\n\n请用中文回答。"
    user_prompt = f"比赛信息：{match_info}\n球队信息：{team_info}\n请给出赛前战术攻略，包含阵型建议、关键球员、进攻战术、防守战术、注意事项。"

    tactics = await llm_service.chat(system_prompt, user_prompt, temperature=0.8)
    return {"tactics": tactics, "matchId": request.matchId, "teamId": request.teamId}


@router.post("/review")
async def generate_review(request: ReviewRequest):
    """AI 赛后复盘 - 使用 DeepSeek 生成"""
    llm_service = get_llm_service()

    match = matches_db.get(request.matchId)
    if not match:
        raise HTTPException(status_code=404, detail="比赛不存在")

    match_info = f"{match.get('homeTeamId')} {match.get('homeScore', 0)} - {match.get('awayScore', 0)} {match.get('awayTeamId')}"
    stats = f"进球：{len(match.get('goals', []))}个，黄牌：{len([c for c in match.get('cards', []) if c.get('type') == 'yellow'])}张"

    review = await llm_service.generate_review(match_info, stats)
    return {"content": review, "matchId": request.matchId, "aiGenerated": True}


@router.post("/lineup", response_model=LineupResponse)
async def recommend_lineup(request: LineupRequest):
    """AI 阵容推荐 - 使用 DeepSeek 生成推荐理由"""
    llm_service = get_llm_service()

    team = teams_db.get(request.teamId)
    players = players_db.filter(teamId=request.teamId)

    team_info = team.get("name", "未知球队") if team else "未知球队"
    player_names = [p.get("name", "") for p in players[:11]]

    # 默认 4-3-3 阵型
    default_slots = [
        LineupSlot(position="GK", posLabel="门将", row=4, col=2, playerId=players[0]["id"] if len(players) > 0 else None),
        LineupSlot(position="RB", posLabel="右后卫", row=3, col=0, playerId=players[1]["id"] if len(players) > 1 else None),
        LineupSlot(position="CB1", posLabel="中后卫", row=3, col=1, playerId=players[2]["id"] if len(players) > 2 else None),
        LineupSlot(position="CB2", posLabel="中后卫", row=3, col=3, playerId=players[3]["id"] if len(players) > 3 else None),
        LineupSlot(position="LB", posLabel="左后卫", row=3, col=4, playerId=players[4]["id"] if len(players) > 4 else None),
        LineupSlot(position="CDM", posLabel="后腰", row=2, col=2, playerId=players[5]["id"] if len(players) > 5 else None),
        LineupSlot(position="CM1", posLabel="中前卫", row=2, col=1, playerId=players[6]["id"] if len(players) > 6 else None),
        LineupSlot(position="CM2", posLabel="中前卫", row=2, col=3, playerId=players[7]["id"] if len(players) > 7 else None),
        LineupSlot(position="RW", posLabel="右边锋", row=1, col=0, playerId=players[8]["id"] if len(players) > 8 else None),
        LineupSlot(position="ST", posLabel="中锋", row=1, col=2, playerId=players[9]["id"] if len(players) > 9 else None),
        LineupSlot(position="LW", posLabel="左边锋", row=1, col=4, playerId=players[10]["id"] if len(players) > 10 else None),
    ]

    reasoning = await llm_service.generate_lineup_recommendation(team_info, "对手球队")

    return LineupResponse(
        formation=request.formation or "4-3-3",
        slots=default_slots,
        substitutes=[p["id"] for p in players[11:14]],
        reasoning=reasoning,
    )


@router.post("/article")
async def generate_article(request: ReviewRequest):
    """AI 赛事纪实 - 使用 DeepSeek 生成纪实文章"""
    llm_service = get_llm_service()

    match = matches_db.get(request.matchId)
    if not match:
        raise HTTPException(status_code=404, detail="比赛不存在")

    match_info = f"{match.get('homeTeamId')} {match.get('homeScore', 0)} - {match.get('awayScore', 0)} {match.get('awayTeamId')}，时间：{match.get('time')}，地点：{match.get('venue')}"

    article = await llm_service.generate_article(match_info)
    return {"content": article, "matchId": request.matchId, "aiGenerated": True}


@router.get("/status")
async def ai_status():
    """AI 服务状态检查"""
    llm_service = get_llm_service()
    ml_service = get_ml_prediction_service()
    rag_service = get_rag_service()
    return {
        "llm_configured": llm_service.is_configured,
        "ml_model_loaded": ml_service.is_model_loaded,
        "rag_knowledge_count": len(rag_service.knowledge_base),
    }
