"""AI 能力接口：比分预测 / 赛前战术攻略 / 赛程文件解析 / 服务状态。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils import get_or_404
from app.models import Match, Team
from app.schemas import ParseScheduleOut, PredictionOut, TacticsOut
from app.services.generators import gen_tactics, parse_schedule_text
from app.services.llm import llm_service
from app.services.prediction import predict_match

router = APIRouter(prefix="/api/ai", tags=["ai"])

ALLOWED_SCHEDULE_TYPES = {".txt", ".docx"}


@router.get("/status")
def ai_status():
    """AI 服务状态：大模型是否启用、比分预测使用哪种模型。"""
    return {
        "llm": {"enabled": llm_service.enabled, "mode": "llm" if llm_service.enabled else "mock"},
        "prediction": {"model": "ml_model" if _model_file_exists() else "heuristic"},
    }


@router.get("/predict/{match_id}", response_model=PredictionOut)
def predict(match_id: str, db: Session = Depends(get_db)):
    """AI 比分预测：胜平负概率分布 + 预测比分（仅展示，不干预业务逻辑）。"""
    match = get_or_404(db, Match, match_id, "比赛不存在")
    home = _team_name(db, match.home_team_id)
    away = _team_name(db, match.away_team_id)
    result = predict_match(db, match)
    return PredictionOut(
        match_id=match_id, home_team_name=home, away_team_name=away,
        probabilities=result["probabilities"], predicted_score=result["predicted_score"],
        model=result["model"], note=result.get("note"),
    )


@router.get("/tactics/{match_id}", response_model=TacticsOut)
def tactics(match_id: str, db: Session = Depends(get_db)):
    """AI 赛前战术攻略：摘要 + 展开详情。"""
    match = get_or_404(db, Match, match_id, "比赛不存在")
    draft = gen_tactics(db, match)
    source = "mock"
    if llm_service.enabled:
        text = llm_service.chat(
            "你是业余足球队的AI助教，用中文输出赛前战术攻略，先给2-3句摘要，再分点说明："
            "对手分析、战术建议、关键球员提醒、阵型推荐、预案提醒。",
            f"{_team_name(db, match.home_team_id)} vs {_team_name(db, match.away_team_id)}，"
            f"时间 {match.time}，地点 {match.venue}。",
        )
        if text:
            draft = {"summary": text.splitlines()[0], "sections": {"完整攻略": "\n".join(text.splitlines()[1:])}}
            source = "llm"
    return TacticsOut(match_id=match_id,
                      home_team_name=_team_name(db, match.home_team_id),
                      away_team_name=_team_name(db, match.away_team_id),
                      summary=draft["summary"], sections=draft["sections"], source=source)


@router.post("/parse-schedule", response_model=ParseScheduleOut)
def parse_schedule(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """赛程文件解析：仅支持 txt/docx，AI 抽取时间/地点/主队/客队，草稿确认后入库。"""
    ext = _suffix(file.filename)
    if ext not in ALLOWED_SCHEDULE_TYPES:
        raise HTTPException(status_code=400, detail="仅支持 .txt 和 .docx 格式的赛程文件")

    text = _read_file_text(file, ext)
    if not text.strip():
        raise HTTPException(status_code=400, detail="文件内容为空")

    matches, warnings = parse_schedule_text(text)
    source = "mock"
    if llm_service.enabled:
        parsed = llm_service.chat_json(
            "你是赛程解析助手，从文本中抽取比赛信息，输出JSON数组，字段：stage/group/time/venue/home/away。",
            f"请解析以下赛程文本：\n{text[:3000]}",
        )
        if parsed and isinstance(parsed, list):
            matches = [{key: value for key, value in item.items() if value} for item in parsed if isinstance(item, dict)]
            source = "llm"
    return ParseScheduleOut(matches=matches, warnings=warnings, source=source)


def _read_file_text(file: UploadFile, ext: str) -> str:
    content = file.file.read()
    if ext == ".docx":
        try:
            from docx import Document  # 延迟导入，避免未安装时阻塞其他功能

            doc = Document(__import__("io").BytesIO(content))
            return "\n".join(paragraph.text for paragraph in doc.paragraphs)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"docx 解析失败：{exc}")
    return content.decode("utf-8", errors="ignore")


def _suffix(filename: str) -> str:
    return ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""



def _team_name(db: Session, team_id: str) -> str:
    team = db.get(Team, team_id)
    return team.name if team else team_id


def _model_file_exists() -> bool:
    from app.config import settings

    return settings.ML_MODEL_PATH.exists()
