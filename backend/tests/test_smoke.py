"""后端冒烟测试：覆盖核心业务链路。

测试使用独立临时 SQLite 数据库（不触碰主库 data/football.db），
fixture 内自建最小数据集（真实风格球队/比赛/球员/文稿），不依赖演示数据。
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.database as database
from app.main import app
from app.models import Base, Match, Player, Team, Article


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    # 1) 独立临时库，隔离主库
    db_path = tmp_path_factory.mktemp("db") / "test.db"
    test_engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    TestSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    database.engine = test_engine
    database.SessionLocal = TestSession

    # 2) 建表 + 最小数据集（真实风格）
    Base.metadata.create_all(bind=test_engine)
    db = TestSession()
    try:
        home = Team(id="t_fc836779", name="地理科学学院", group="学院联赛", captain_id=None)
        away = Team(id="t_41d0d45a", name="计算机与信息科学学院", group="学院联赛", captain_id=None)
        db.add_all([home, away])
        db.add_all([
            Match(id="m_fin", stage="group", group_name="学院联赛",
                  home_team_id="t_fc836779", away_team_id="t_41d0d45a",
                  home_score=3, away_score=2, time="2026-06-04 15:00",
                  venue="第二运动场", status="finished"),
            Match(id="m_up", stage="group", group_name="学院联赛",
                  home_team_id="t_fc836779", away_team_id="t_41d0d45a",
                  time="2026-06-08 19:30", venue="第二运动场", status="upcoming"),
            Match(id="m_ongo", stage="group", group_name="学院联赛",
                  home_team_id="t_fc836779", away_team_id="t_41d0d45a",
                  time="2026-06-05 16:00", venue="第二运动场", status="ongoing"),
        ])
        db.add_all([
            Player(id="p_test1", name="测试前锋", number=9, team_id="t_fc836779",
                   position="前锋", personal_traits=["速度快"], health_status="healthy"),
            Player(id="p_test2", name="测试中场", number=6, team_id="t_fc836779",
                   position="中场", personal_traits=["技术强"], health_status="healthy",
                   yellow_cards=1),
        ])
        db.add(Article(id="a_test", match_id="m_fin", title="真实赛事纪实",
                       content="这是一篇用于测试的赛事纪实文稿。", status="published",
                       created_at="2026-06-04 20:00"))
        db.commit()
    finally:
        db.close()

    with TestClient(app) as test_client:
        yield test_client


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_matches_list(client):
    response = client.get("/api/matches")
    assert response.status_code == 200
    matches = response.json()
    match = next(m for m in matches if m["id"] == "m_fin")
    assert match["home_score"] == 3 and match["away_score"] == 2
    assert match["home_team_name"] == "地理科学学院"


def test_standings_sorted_by_points(client):
    response = client.get("/api/standings", params={"group": "学院联赛"})
    assert response.status_code == 200
    rows = response.json()
    assert rows, "学院联赛应有积分榜数据"
    points = [row["points"] for row in rows]
    assert points == sorted(points, reverse=True)


def test_ai_predict(client):
    response = client.get("/api/ai/predict/m_fin")
    assert response.status_code == 200
    data = response.json()
    assert set(data["probabilities"]) == {"home_win", "draw", "away_win"}
    assert abs(sum(data["probabilities"].values()) - 1.0) < 0.01


def test_ai_tactics(client):
    response = client.get("/api/ai/tactics/m_fin")
    assert response.status_code == 200
    assert response.json()["summary"]


def test_result_entry_accumulates_cards(client):
    """录入结果后：比分写入、黄牌累计、达到两黄自动停赛。"""
    payload = {
        "home_score": 1, "away_score": 1,
        "goals": [{"player_id": "p_test1", "minute": 30}],
        "cards": [{"player_id": "p_test2", "minute": 40, "type": "yellow"}],
    }
    headers = {"X-User-Role": "association"}
    response = client.post("/api/matches/m_ongo/result", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "finished"

    db = database.SessionLocal()
    try:
        player = db.get(Player, "p_test2")
        assert player.yellow_cards >= 2
        assert player.is_suspended is True  # 累计两黄停赛
    finally:
        db.close()


def test_permission_denied_for_member(client):
    """普通队员无权修改赛程。"""
    response = client.patch("/api/matches/m_up", json={"venue": "新场地"},
                            headers={"X-User-Role": "member"})
    assert response.status_code == 403


def test_parse_schedule_txt(client):
    files = {"file": ("赛程.txt", "6月15日 15:00 南宁市体育场 A组 南宁联队 vs 柳州铁骑\n"
                      "6月16日 19:30 市体育中心 B组 桂林雄鹰 vs 北海浪花", "text/plain")}
    response = client.post("/api/ai/parse-schedule", files=files)
    assert response.status_code == 200
    assert len(response.json()["matches"]) == 2


def test_create_matches_batch(client):
    """协会确认解析结果后批量入库（按队名自动建队）。"""
    payload = [
        {"stage": "group", "group": "友谊赛", "time": "2024-07-01 15:00",
         "venue": "测试场", "home": "测试红队", "away": "测试蓝队"},
    ]
    headers = {"X-User-Role": "association"}
    response = client.post("/api/matches", json=payload, headers=headers)
    assert response.status_code == 200
    created = response.json()
    assert len(created) == 1
    assert created[0]["home_team_name"] == "测试红队"
    assert created[0]["status"] == "upcoming"


def test_update_article(client):
    """协会编辑文稿标题与内容。"""
    headers = {"X-User-Role": "association"}
    response = client.patch("/api/articles/a_test", json={"title": "新标题"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "新标题"
