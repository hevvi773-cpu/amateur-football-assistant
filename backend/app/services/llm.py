"""大模型调用服务（OpenAI 兼容接口）。

- 配置了 LLM_API_KEY / LLM_BASE_URL 时走真实大模型；
- 未配置或调用失败时返回 None，由上层降级到内置生成器（generators）。
"""
from __future__ import annotations

import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """封装大模型 chat 调用，失败不抛出，返回 None 表示不可用。"""

    @property
    def enabled(self) -> bool:
        return settings.llm_enabled

    def chat(self, system: str, user: str, temperature: float = 0.7) -> str | None:
        """返回模型文本；未配置或调用异常时返回 None。"""
        if not self.enabled:
            return None
        try:
            return self._call_openai_compatible(system, user, temperature)
        except Exception as exc:  # 网络/鉴权/限流等异常统一降级，不影响页面
            logger.warning("LLM 调用失败，降级为内置生成器: %s", exc)
            return None

    def chat_json(self, system: str, user: str, temperature: float = 0.3) -> dict[str, Any] | None:
        """要求模型输出 JSON 并解析；解析失败返回 None。"""
        raw = self.chat(system, user + "\n\n请只输出合法 JSON，不要包含任何其他文字。", temperature)
        if raw is None:
            return None
        try:
            return json.loads(_strip_code_fence(raw))
        except (json.JSONDecodeError, TypeError):
            logger.warning("LLM 输出无法解析为 JSON，降级为内置生成器")
            return None

    def _call_openai_compatible(self, system: str, user: str, temperature: float) -> str:
        # 延迟导入，未安装 openai 包时同样降级，不阻塞启动
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL or None)
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return response.choices[0].message.content or ""


llm_service = LLMService()


def _strip_code_fence(raw: str) -> str:
    """去掉 ```json ... ``` 代码块包裹。"""
    text = raw.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline + 1:]
        if text.endswith("```"):
            text = text[:-3].rstrip()
    return text
