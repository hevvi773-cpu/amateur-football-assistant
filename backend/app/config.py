"""足球AI助手 - 后端服务配置。"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/ 目录


class Settings:
    """从环境变量 / .env 读取的全局配置。"""

    # 数据库（测试可用 FOOTBALL_DB_PATH 指定独立库，避免污染开发数据）
    DB_PATH: Path = Path(os.getenv("FOOTBALL_DB_PATH", str(BASE_DIR / "data" / "football.db")))

    # 大模型（OpenAI 兼容接口，可选项）
    LLM_API_KEY: str = (os.getenv("LLM_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")).strip()
    LLM_BASE_URL: str = (
        os.getenv("LLM_BASE_URL", "") or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    ).strip()
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini").strip()

    # auto = 有密钥用真实大模型，否则降级内置模板生成器；mock / llm 可强制指定
    AI_MODE: str = os.getenv("AI_MODE", "auto").strip().lower()

    # 比分预测：可选预训练模型文件（pickle，含 predict 方法），未提供时用启发式规则模型
    ML_MODEL_PATH: Path = BASE_DIR / "models" / "prediction_model.pkl"

    @property
    def llm_enabled(self) -> bool:
        if self.AI_MODE == "llm":
            return bool(self.LLM_API_KEY)
        if self.AI_MODE == "mock":
            return False
        return bool(self.LLM_API_KEY)  # auto


load_dotenv(BASE_DIR / ".env")
settings = Settings()
