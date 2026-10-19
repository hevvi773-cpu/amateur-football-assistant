"""数据库引擎与会话管理（SQLite + SQLAlchemy 2.0）。"""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

Path(settings.DB_PATH).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    f"sqlite:///{settings.DB_PATH}",
    connect_args={"check_same_thread": False},
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db():
    """FastAPI 依赖：提供一个数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
