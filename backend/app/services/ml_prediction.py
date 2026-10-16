"""ML 比分预测服务 - 基于历史赛事数据训练的模型"""
import os
import logging
import pickle
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent.parent / "models"
MODEL_PATH = MODEL_DIR / "score_predictor.pkl"


class MLPredictionService:
    def __init__(self):
        self.model = None
        self.team_encoding = {}
        self._load_model()

    def _load_model(self):
        """加载训练好的模型"""
        if MODEL_PATH.exists():
            try:
                with open(MODEL_PATH, "rb") as f:
                    data = pickle.load(f)
                    self.model = data.get("model")
                    self.team_encoding = data.get("team_encoding", {})
                logger.info(f"ML 模型加载成功，已编码 {len(self.team_encoding)} 支球队")
            except Exception as e:
                logger.error(f"ML 模型加载失败: {e}")
                self.model = None
        else:
            logger.warning("ML 模型文件不存在，使用规则预测")
            self.model = None

    @property
    def is_model_loaded(self) -> bool:
        return self.model is not None

    def predict(self, home_team_id: str, away_team_id: str) -> Dict:
        """预测比赛结果"""
        if self.is_model_loaded and home_team_id in self.team_encoding and away_team_id in self.team_encoding:
            return self._model_predict(home_team_id, away_team_id)
        else:
            return self._rule_based_predict(home_team_id, away_team_id)

    def _model_predict(self, home_team_id: str, away_team_id: str) -> Dict:
        """使用训练好的模型预测"""
        try:
            home_enc = self.team_encoding[home_team_id]
            away_enc = self.team_encoding[away_team_id]
            features = np.array([[home_enc, away_enc, 1]])  # 1=主场优势

            # 预测胜平负概率
            proba = self.model.predict_proba(features)[0]
            classes = self.model.classes_

            result = {"homeWinProb": 0.0, "drawProb": 0.0, "awayWinProb": 0.0}
            for i, cls in enumerate(classes):
                if cls == 1:  # 主胜
                    result["homeWinProb"] = round(float(proba[i]), 3)
                elif cls == 0:  # 平局
                    result["drawProb"] = round(float(proba[i]), 3)
                elif cls == -1:  # 客胜
                    result["awayWinProb"] = round(float(proba[i]), 3)

            # 预测比分
            pred_class = self.model.predict(features)[0]
            if pred_class == 1:
                result["predictedScore"] = "2-1"
                result["confidence"] = "高" if result["homeWinProb"] > 0.5 else "中"
            elif pred_class == 0:
                result["predictedScore"] = "1-1"
                result["confidence"] = "中"
            else:
                result["predictedScore"] = "1-2"
                result["confidence"] = "高" if result["awayWinProb"] > 0.5 else "中"

            result["reasoning"] = f"基于历史赛事数据模型预测，主队胜率 {result['homeWinProb']*100:.1f}%，平局 {result['drawProb']*100:.1f}%，客队胜率 {result['awayWinProb']*100:.1f}%。"
            return result
        except Exception as e:
            logger.error(f"模型预测失败，回退到规则预测: {e}")
            return self._rule_based_predict(home_team_id, away_team_id)

    def _rule_based_predict(self, home_team_id: str, away_team_id: str) -> Dict:
        """基于规则的简单预测（模型未加载时使用）"""
        # 简单规则：主场优势 + 球队编号差
        try:
            home_num = int(''.join(filter(str.isdigit, home_team_id))) if any(c.isdigit() for c in home_team_id) else 1
            away_num = int(''.join(filter(str.isdigit, away_team_id))) if any(c.isdigit() for c in away_team_id) else 2
        except:
            home_num, away_num = 1, 2

        diff = home_num - away_num
        home_advantage = 0.15  # 主场优势

        if diff > 0:
            home_win = 0.45 + home_advantage
            draw = 0.25
            away_win = 0.30 - home_advantage
        elif diff < 0:
            home_win = 0.30 + home_advantage
            draw = 0.25
            away_win = 0.45 - home_advantage
        else:
            home_win = 0.35 + home_advantage
            draw = 0.30
            away_win = 0.35 - home_advantage

        # 归一化
        total = home_win + draw + away_win
        home_win /= total
        draw /= total
        away_win /= total

        if home_win > away_win and home_win > draw:
            predicted_score = "2-1"
            confidence = "中"
        elif away_win > home_win and away_win > draw:
            predicted_score = "1-2"
            confidence = "中"
        else:
            predicted_score = "1-1"
            confidence = "低"

        return {
            "homeWinProb": round(home_win, 3),
            "drawProb": round(draw, 3),
            "awayWinProb": round(away_win, 3),
            "predictedScore": predicted_score,
            "confidence": confidence,
            "reasoning": f"基于主场优势和球队实力对比的规则预测，主队胜率 {home_win*100:.1f}%，平局 {draw*100:.1f}%，客队胜率 {away_win*100:.1f}%。注：加载训练好的ML模型后可获得更精准预测。",
        }


_ml_service: Optional[MLPredictionService] = None


def get_ml_prediction_service() -> MLPredictionService:
    global _ml_service
    if _ml_service is None:
        _ml_service = MLPredictionService()
    return _ml_service
