"""比分预测服务。

默认使用可解释的启发式模型（基于积分、净胜球、主客场、伤停），
若 backend/models/prediction_model.pkl 存在（由 scripts/train_model.py 训练），
则优先加载该模型做胜平负概率预测（对应 PRD 6.2 的 LightGBM/XGBoost 方案）。
"""
from __future__ import annotations

import logging
import math
import pickle
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Match, Player, Team
from app.services.standings import compute_standings

logger = logging.getLogger(__name__)

HOME_ADVANTAGE = 4.0
RATING_BASE = 50.0
POINTS_WEIGHT = 6.0
GOAL_DIFF_WEIGHT = 3.0
ABSENT_PENALTY = 2.0
GOAL_SCALE = 0.05  # 评级 → 期望进球换算系数


def predict_match(db: Session, match: Match) -> dict:
    """返回 {probabilities, predicted_score, model, note}。"""
    model = _load_model()
    if model is not None:
        try:
            return _predict_with_model(model, db, match)
        except Exception as exc:
            logger.warning("预训练模型推理失败，降级启发式: %s", exc)

    home_rating, away_rating = _team_ratings(db, match)
    probabilities = _softmax(home_rating, away_rating)
    home_goals, away_goals = _expected_scores(home_rating, away_rating)
    return {
        "probabilities": probabilities,
        "predicted_score": {"home": home_goals, "away": away_goals},
        "model": "heuristic",
        "note": "历史数据不足或未配置预训练模型，当前使用积分/净胜球/伤停启发式估算。",
    }


def _team_ratings(db: Session, match: Match) -> tuple[float, float]:
    standings = {row.team_id: row for row in compute_standings(db)}
    home = _rating_for(db, standings, match.home_team_id, is_home=True)
    away = _rating_for(db, standings, match.away_team_id, is_home=False)
    return home, away


def _rating_for(db: Session, standings: dict, team_id: str, is_home: bool) -> float:
    row = standings.get(team_id)
    rating = RATING_BASE
    if row and row.played > 0:
        rating += row.points / row.played * POINTS_WEIGHT
        rating += row.goal_difference / row.played * GOAL_DIFF_WEIGHT
    if is_home:
        rating += HOME_ADVANTAGE
    rating -= _absent_count(db, team_id) * ABSENT_PENALTY
    return rating


def _absent_count(db: Session, team_id: str) -> int:
    players = db.query(Player).filter(Player.team_id == team_id).all()
    return sum(1 for player in players if player.is_suspended or player.health_status in ("minor_injury", "injured"))


def _softmax(home_rating: float, away_rating: float) -> dict[str, float]:
    """胜平负三分类概率：平局概率随实力接近而升高。"""
    draw_bias = 0.28 * math.exp(-abs(home_rating - away_rating) / 30)
    home_win = max(0.05, (home_rating - away_rating) / 60 + 0.42)
    away_win = max(0.05, (away_rating - home_rating) / 60 + 0.38)
    raw = {"home_win": home_win, "draw": draw_bias, "away_win": away_win}
    total = sum(raw.values())
    return {key: round(value / total, 3) for key, value in raw.items()}


def _expected_scores(home_rating: float, away_rating: float) -> tuple[int, int]:
    diff = (home_rating - away_rating) / 2
    home_goals = max(0, round(1.4 + diff * GOAL_SCALE * 10))
    away_goals = max(0, round(1.2 - diff * GOAL_SCALE * 10))
    return home_goals, away_goals


def _load_model():
    """尝试加载预训练模型（pickle，由 scripts/train_model.py 生成）。"""
    model_path: Path = settings.ML_MODEL_PATH
    if not model_path.exists():
        return None
    try:
        with open(model_path, "rb") as handle:
            return pickle.load(handle)
    except Exception as exc:
        logger.warning("加载预训练模型失败，使用启发式模型: %s", exc)
        return None


def _predict_with_model(model, db: Session, match: Match) -> dict:
    """使用预训练模型推理（特征与训练脚本完全一致）。"""
    features = build_features(db, match)
    probs = model.predict(features)  # 期望返回 [home_win, draw, away_win]
    home_goals, away_goals = _expected_scores(_team_ratings(db, match)[0], _team_ratings(db, match)[1])
    return {
        "probabilities": {
            "home_win": round(float(probs[0]), 3),
            "draw": round(float(probs[1]), 3),
            "away_win": round(float(probs[2]), 3),
        },
        "predicted_score": {"home": home_goals, "away": away_goals},
        "model": "ml_model",
        "note": "使用预训练模型推理结果。",
    }


def build_features(db: Session, match: Match) -> list[float]:
    """特征（训练与推理共用，与 PRD 6.2 特征工程对齐）：
    [主队场均积分, 主队场均净胜球, 客队场均积分, 客队场均净胜球, 主队伤停人数, 客队伤停人数]。"""
    standings = {row.team_id: row for row in compute_standings(db)}
    home = _stats_of(standings, match.home_team_id)
    away = _stats_of(standings, match.away_team_id)
    return [
        _points_per_game(home),
        _gd_per_game(home),
        _points_per_game(away),
        _gd_per_game(away),
        _absent_count(db, match.home_team_id),
        _absent_count(db, match.away_team_id),
    ]


def _stats_of(standings: dict, team_id: str):
    return standings.get(team_id)


def _points_per_game(row) -> float:
    if row is None or row.played == 0:
        return 0.5
    return row.points / row.played


def _gd_per_game(row) -> float:
    if row is None or row.played == 0:
        return 0.0
    return row.goal_difference / row.played
