"""查询真实比赛样例，供测试适配使用。"""
import sqlite3

con = sqlite3.connect("data/football.db")
cur = con.cursor()

print("测试红队存在:", cur.execute("SELECT COUNT(*) FROM teams WHERE name='测试红队'").fetchone()[0])

print("--- 已结束比赛样例 ---")
for r in cur.execute(
    "SELECT id, home_team_id, away_team_id, home_score, away_score, status "
    "FROM matches WHERE status='finished' ORDER BY time DESC LIMIT 3"
).fetchall():
    print(r)

print("--- 未开赛比赛 ---")
for r in cur.execute(
    "SELECT id, home_team_id, away_team_id, status FROM matches WHERE status='upcoming' LIMIT 2"
).fetchall():
    print(r)

print("--- 球队名映射 ---")
for r in cur.execute("SELECT id, name FROM teams WHERE id IN (SELECT home_team_id FROM matches LIMIT 5)").fetchall():
    print(r)

con.close()
