"""足球AI助手 FastAPI 应用入口。"""
import asyncio
import contextlib
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal, engine
from app.models import Base, SocialEvent
from app.routers import ai, articles, config, lineup, matches, notifications, players, reviews, social, standings
from app.seed import seed_db
from app.services.social import is_deadline_passed, settle_deadline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEADLINE_CHECK_INTERVAL = 30  # 后台检查接龙截止的间隔（秒）


@contextlib.asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with contextlib.closing(SessionLocal()) as db:
        seed_db(db)
    deadline_task = asyncio.create_task(_deadline_loop())
    yield
    deadline_task.cancel()


def create_app() -> FastAPI:
    application = FastAPI(title="足球AI助手 API", version="1.0.0", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 本地开发放开，上线前按域名收紧
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for api_router in (
        matches.router, standings.router, players.router, lineup.router,
        reviews.router, articles.router, social.router, notifications.router, ai.router,
        config.router,
    ):
        application.include_router(api_router)

    @application.get("/api/health")
    def health():
        return {"status": "ok"}

    return application


async def _deadline_loop():
    """后台定时结算已到截止时间的约球接龙（人数达标成行/不足取消）。"""
    while True:
        try:
            _settle_overdue_events()
        except Exception as exc:  # 后台任务异常不拖垮服务
            logger.warning("接龙截止结算失败: %s", exc)
        await asyncio.sleep(DEADLINE_CHECK_INTERVAL)


def _settle_overdue_events() -> None:
    db = SessionLocal()
    try:
        events = db.query(SocialEvent).filter(SocialEvent.status == "recruiting").all()
        for event in events:
            if is_deadline_passed(event):
                settle_deadline(db, event)
    finally:
        db.close()


app = create_app()
