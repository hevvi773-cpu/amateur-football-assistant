"""配置管理接口：读取/更新 LLM 配置、测试 API Key 连通性。"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import config_manager

router = APIRouter(prefix="/api/config", tags=["config"])


class ConfigUpdate(BaseModel):
    """配置更新请求体，所有字段可选，传 None 表示不修改。"""
    ai_mode: str | None = None
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    llm_model: str | None = None


class ApiKeyTest(BaseModel):
    """API Key 连通性测试请求。"""
    api_key: str
    base_url: str = ""
    model: str = "gpt-4o-mini"


@router.get("")
def get_config():
    """读取当前配置（API Key 脱敏，不返回明文）。"""
    return config_manager.get_config()


@router.post("")
def update_config(payload: ConfigUpdate):
    """更新配置并持久化到 .env，运行时立即生效。"""
    return config_manager.update_config(
        ai_mode=payload.ai_mode,
        llm_api_key=payload.llm_api_key,
        llm_base_url=payload.llm_base_url,
        llm_model=payload.llm_model,
    )


@router.post("/test")
def test_api_key(payload: ApiKeyTest):
    """测试 API Key 连通性，返回 {ok, model, latency_ms, error}。"""
    return config_manager.test_api_key(
        api_key=payload.api_key,
        base_url=payload.base_url,
        model=payload.model,
    )
