"""Softmax 回归模型（纯 Python 实现，零额外依赖）。

独立成模块是为了让训练脚本与推理服务都能 import 到同一个类，
否则 pickle 序列化后无法跨进程反序列化。
"""
from __future__ import annotations

import math

CLASS_COUNT = 3  # 0=主胜 1=平局 2=客胜


class SoftmaxModel:
    """三分类 Softmax 回归，接口与 sklearn 风格对齐：fit / predict。"""

    def __init__(self, feature_count: int):
        self.weights = [[0.0] * feature_count for _ in range(CLASS_COUNT)]
        self.feature_count = feature_count

    def fit(self, x_rows: list[list[float]], y_labels: list[int],
            learning_rate: float = 0.15, regularization: float = 1e-4, epochs: int = 800) -> None:
        data = [(list(row), label) for row, label in zip(x_rows, y_labels)]
        for _ in range(epochs):
            gradients = [[0.0] * self.feature_count for _ in range(CLASS_COUNT)]
            for row, label in data:
                probs = self._probs(row)
                for cls in range(CLASS_COUNT):
                    indicator = 1.0 if cls == label else 0.0
                    for index, value in enumerate(row):
                        gradients[cls][index] += (probs[cls] - indicator) * value
            for cls in range(CLASS_COUNT):
                for index in range(self.feature_count):
                    gradient = gradients[cls][index] / len(data)
                    gradient += regularization * self.weights[cls][index]
                    self.weights[cls][index] -= learning_rate * gradient

    def predict(self, features: list[float]) -> list[float]:
        """返回 [主胜概率, 平局概率, 客胜概率]。"""
        return self._probs(features)

    def _probs(self, features: list[float]) -> list[float]:
        scores = [
            sum(weight * feature for weight, feature in zip(self.weights[cls], features)) for cls in range(CLASS_COUNT)
        ]
        max_score = max(scores)
        exps = [math.exp(score - max_score) for score in scores]
        total = sum(exps)
        return [value / total for value in exps]
