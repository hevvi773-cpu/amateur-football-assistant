"""比分预测模型训练脚本。

- 数据来源：数据库中的已结束比赛（含导入的真实赛事纪录）
- 模型：纯 Python 实现的 Softmax 回归（三分类：主胜/平/客胜），零额外依赖
- 产物：backend/models/prediction_model.pkl，被 app.services.prediction 自动加载

用法：
  cd backend
  python scripts/train_model.py
"""
from __future__ import annotations

import pickle
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal  # noqa: E402
from app.models import Match  # noqa: E402
from app.services.prediction import build_features  # noqa: E402
from app.services.softmax_model import SoftmaxModel  # noqa: E402

OUT_PATH = BACKEND_DIR / "models" / "prediction_model.pkl"


def main() -> None:
    x_rows, y_labels = _load_training_set()
    if len(y_labels) < 20:
        print(f"警告：可用样本仅 {len(y_labels)} 条，建议先导入赛事纪录（scripts/import_season_records.py）")
    if not y_labels:
        print("没有可用的已结束比赛，请先导入数据")
        return

    model = SoftmaxModel(feature_count=len(x_rows[0]))
    start = time.time()
    model.fit(x_rows, y_labels)
    elapsed = time.time() - start

    accuracy = _accuracy(model, x_rows, y_labels)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "wb") as handle:
        pickle.dump(model, handle)
    print(f"训练完成：{len(y_labels)} 场样本，训练耗时 {elapsed:.1f}s，训练集准确率 {accuracy:.1%}")
    print(f"模型已保存：{OUT_PATH}")


def _load_training_set() -> tuple[list[list[float]], list[int]]:
    db = SessionLocal()
    try:
        matches = db.query(Match).filter(Match.status == "finished").all()
        x_rows, y_labels = [], []
        for match in matches:
            home, away = match.home_score, match.away_score
            if home is None or away is None:
                continue
            x_rows.append(build_features(db, match))
            y_labels.append(0 if home > away else 2 if home < away else 1)
    finally:
        db.close()
    return x_rows, y_labels


def _accuracy(model: SoftmaxModel, x_rows: list[list[float]], y_labels: list[int]) -> float:
    correct = sum(1 for row, label in zip(x_rows, y_labels)
                  if _argmax(model.predict(row)) == label)
    return correct / len(y_labels)


def _argmax(probs: list[float]) -> int:
    return max(range(len(probs)), key=lambda index: probs[index])


if __name__ == "__main__":
    main()
