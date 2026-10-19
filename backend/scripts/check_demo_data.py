"""检查 football.db 中演示数据分布，用于确定删除范围（只读检查）。"""
import sqlite3

DB = "data/football.db"

con = sqlite3.connect(DB)
cur = con.cursor()

print("=== 各表行数 ===")
for t in [
    "teams", "matches", "goals", "cards", "players", "lineups", "reviews",
    "articles", "comments", "social_events", "notifications",
]:
    n = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"{t}: {n}")

print("\n=== 演示队（A/B组）及关联数据 ===")
demos = cur.execute('SELECT id, name FROM teams WHERE "group" IN (?,?)', ('A组','B组')).fetchall()
demo_ids = [tid for tid, _ in demos]
print("demo team ids:", demo_ids)
for tid, name in demos:
    ms = cur.execute(
        "SELECT COUNT(*) FROM matches WHERE home_team_id=? OR away_team_id=?", (tid, tid)
    ).fetchone()[0]
    ps = cur.execute("SELECT COUNT(*) FROM players WHERE team_id=?", (tid,)).fetchone()[0]
    ls = cur.execute("SELECT COUNT(*) FROM lineups WHERE team_id=?", (tid,)).fetchone()[0]
    print(f"{name}: matches={ms} players={ps} lineups={ls}")

# 演示队参与的比赛 id
demo_match_ids = [
    row[0]
    for row in cur.execute(
        f"SELECT id FROM matches WHERE home_team_id IN ({','.join('?' * len(demo_ids))}) OR away_team_id IN ({','.join('?' * len(demo_ids))})",
        demo_ids + demo_ids,
    ).fetchall()
]
print("\ndemo match ids:", demo_match_ids)

print("\n=== 演示比赛关联数据 ===")
for m in demo_match_ids:
    g = cur.execute("SELECT COUNT(*) FROM goals WHERE match_id=?", (m,)).fetchone()[0]
    c = cur.execute("SELECT COUNT(*) FROM cards WHERE match_id=?", (m,)).fetchone()[0]
    r = cur.execute("SELECT COUNT(*) FROM reviews WHERE match_id=?", (m,)).fetchone()[0]
    a = cur.execute("SELECT COUNT(*) FROM articles WHERE match_id=?", (m,)).fetchone()[0]
    l = cur.execute("SELECT COUNT(*) FROM lineups WHERE match_id=?", (m,)).fetchone()[0]
    print(f"{m}: goals={g} cards={c} reviews={r} articles={a} lineups={l}")

print("\n=== 演示队球员 ===")
for tid in demo_ids:
    for row in cur.execute("SELECT id, name, number FROM players WHERE team_id=?", (tid,)).fetchall():
        print(row)

print("\n=== reviews 明细 ===")
for row in cur.execute("SELECT id, match_id, player_id, author_role, content FROM reviews").fetchall():
    print(row[0], row[1], row[2], row[3], (row[4] or "")[:20])

print("\n=== articles 明细 ===")
for row in cur.execute("SELECT id, match_id, title FROM articles").fetchall():
    print(row)

print("\n=== social_events 明细 ===")
for row in cur.execute("SELECT id, title, type, creator_id, creator_name, status FROM social_events").fetchall():
    print(row)

print("\n=== notifications 明细 ===")
for row in cur.execute("SELECT id, user_id, type, title FROM notifications").fetchall():
    print(row)

con.close()
