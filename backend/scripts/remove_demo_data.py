"""移除全部演示（模拟）数据：
- 删除 6 支 A/B 组演示队（t1~t6）及其全部比赛；
- 清空 goals/cards/players/lineups/reviews/articles/comments/social_events/notifications（当前均为演示内容）；
- 保留 60 支真实学院队 + 427 场真实赛事。
执行前会先做数据库备份。
"""
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

DB = Path("data/football.db")

# 1) 备份
bak = DB.with_name(f"football.db.bak_{datetime.now():%Y%m%d_%H%M%S}")
shutil.copy2(DB, bak)
print(f"备份完成: {bak}")

# 2) 删除演示数据
con = sqlite3.connect(DB)
cur = con.cursor()

demo_ids = ["t1", "t2", "t3", "t4", "t5", "t6"]
placeholders = ",".join("?" * len(demo_ids))

# 演示队
n = cur.execute(
    f'DELETE FROM teams WHERE "group" IN (?,?)', ("A组", "B组")
).rowcount
print(f"删除演示球队: {n}")

# 演示比赛（与演示队相关）
demo_matches = cur.execute(
    f"SELECT id FROM matches WHERE home_team_id IN ({placeholders}) OR away_team_id IN ({placeholders})",
    demo_ids + demo_ids,
).fetchall()
print(f"演示比赛: {len(demo_matches)} 场")
if demo_matches:
    m_placeholders = ",".join("?" * len(demo_matches))
    mid = [m[0] for m in demo_matches]
    for table in ["goals", "cards", "reviews", "articles", "lineups"]:
        n = cur.execute(f"DELETE FROM {table} WHERE match_id IN ({m_placeholders})", mid).rowcount
        print(f"清理 {table}: {n}")
    cur.execute(f"DELETE FROM matches WHERE id IN ({m_placeholders})", mid)

# 其余业务表当前全部为演示内容，直接清空
for table in [
    "comments", "social_events", "notifications",
    "goals", "cards", "players", "lineups", "reviews", "articles",
]:
    n = cur.execute(f"DELETE FROM {table}").rowcount
    print(f"清空 {table}: {n}")

con.commit()

# 3) 校验
for table in ["teams", "matches", "players", "reviews", "goals", "cards", "lineups", "articles", "comments", "social_events", "notifications"]:
    n = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    print(f"校验 {table}: {n}")
con.close()
