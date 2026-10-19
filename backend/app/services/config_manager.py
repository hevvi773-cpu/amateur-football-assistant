"""运行时配置管理：支持动态更新 LLM 配置、持久化到 .env、测试 API 连通性。"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.config import BASE_DIR, settings

logger = logging.getLogger(__name__)

ENV_PATH = BASE_DIR / ".env"


def get_config() -> dict[str, Any]:
    """返回当前配置（API Key 只显示是否已设置，不返回明文）。"""
    return {
        "ai_mode": settings.AI_MODE,
        "llm_api_key_set": bool(settings.LLM_API_KEY),
        "llm_api_key_masked": _mask_key(settings.LLM_API_KEY),
        "llm_base_url": settings.LLM_BASE_URL,
        "llm_model": settings.LLM_MODEL,
        "llm_enabled": settings.llm_enabled,
        "ml_model_path": str(settings.ML_MODEL_PATH),
        "ml_model_exists": settings.ML_MODEL_PATH.exists(),
    }


def update_config(
    ai_mode: str | None = None,
    llm_api_key: str | None = None,
    llm_base_url: str | None = None,
    llm_model: str | None = None,
) -> dict[str, Any]:
    """更新运行时配置并持久化到 .env 文件。传入 None 的字段保持不变。"""
    if ai_mode is not None:
        settings.AI_MODE = ai_mode.strip().lower()
    if llm_api_key is not None:
        settings.LLM_API_KEY = llm_api_key.strip()
    if llm_base_url is not None:
        settings.LLM_BASE_URL = llm_base_url.strip()
    if llm_model is not None:
        settings.LLM_MODEL = llm_model.strip()

    _save_to_env()
    logger.info("配置已更新：AI_MODE=%s, LLM_MODEL=%s, Key已设置=%s",
                settings.AI_MODE, settings.LLM_MODEL, bool(settings.LLM_API_KEY))
    return get_config()


def test_api_key(api_key: str, base_url: str, model: str) -> dict[str, Any]:
    """测试 API Key 连通性，返回 {ok, model, latency_ms, error}。"""
    if not api_key:
        return {"ok": False, "error": "API Key 为空"}

    import time

    start = time.time()
    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key, base_url=base_url or None)
        response = client.chat.completions.create(
            model=model,
            max_tokens=5,
            messages=[{"role": "user", "content": "ping"}],
        )
        latency_ms = round((time.time() - start) * 1000)
        return {
            "ok": True,
            "model": response.model,
            "latency_ms": latency_ms,
            "reply": (response.choices[0].message.content or "")[:50],
        }
    except Exception as exc:
        latency_ms = round((time.time() - start) * 1000)
        logger.warning("API Key 测试失败：%s", exc)
        return {"ok": False, "error": str(exc), "latency_ms": latency_ms}


def _save_to_env() -> None:
    """将当前配置写入 .env 文件（保留注释和其他变量，只更新 LLM 相关字段）。"""
    lines = _read_env_lines()
    updates = {
        "AI_MODE": settings.AI_MODE,
        "LLM_API_KEY": settings.LLM_API_KEY,
        "LLM_BASE_URL": settings.LLM_BASE_URL,
        "LLM_MODEL": settings.LLM_MODEL,
    }

    new_lines = []
    found_keys = set()
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith("#") or "=" not in stripped:
            new_lines.append(line)
            continue
        key = stripped.split("=", 1)[0].strip()
        if key in updates:
            new_lines.append(f"{key}={updates[key]}")
            found_keys.add(key)
        else:
            new_lines.append(line)

    for key, value in updates.items():
        if key not in found_keys:
            new_lines.append(f"{key}={value}")

    ENV_PATH.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


def _read_env_lines() -> list[str]:
    """读取 .env 文件行，不存在则返回空列表。"""
    if not ENV_PATH.exists():
        return []
    return ENV_PATH.read_text(encoding="utf-8").splitlines()


def _mask_key(api_key: str) -> str:
    """脱敏显示 API Key：前4位 + **** + 后4位。"""
    if not api_key or len(api_key) < 8:
        return "****" if api_key else ""
    return f"{api_key[:4]}****{api_key[-4:]}"
