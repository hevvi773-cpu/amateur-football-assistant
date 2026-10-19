"""积分榜计算服务：根据已结束比赛实时重算，不落库。"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Match, Team
from app.schemas import StandingRow


def compute_standings(db: Session, group: str | None = None) -> list[StandingRow]:
    """按分组计算积分榜（排名、场次、胜平负、净胜球、积分）。"""
    teams = db.query(Team).all()
    if group:
        teams = [t for t in teams if t.group == group]

    stats = {team.id: _empty_stats(team) for team in teams}
    finished = db.query(Match).filter(Match.status == "finished").all()

    for match in finished:
        if match.home_team_id not in stats or match.away_team_id not in stats:
            continue  # 对阵球队不在本分组内（如跨组友谊赛）
        home, away = stats[match.home_team_id], stats[match.away_team_id]
        home_score, away_score = match.home_score or 0, match.away_score or 0
        home["played"] += 1
        away["played"] += 1
        home["goals_for"] += home_score
        home["goals_against"] += away_score
        away["goals_for"] += away_score
        away["goals_against"] += home_score
        if home_score > away_score:
            home["won"] += 1
            away["lost"] += 1
        elif home_score < away_score:
            away["won"] += 1
            home["lost"] += 1
        else:
            home["drawn"] += 1
            away["drawn"] += 1

    rows = [_to_row(team, stats[team.id]) for team in teams]
    rows.sort(key=lambda r: (r.points, r.goal_difference, r.goals_for), reverse=True)
    for index, row in enumerate(rows, start=1):
        row.rank = index
    return rows


def _empty_stats(team: Team) -> dict:
    return {
        "played": 0, "won": 0, "drawn": 0, "lost": 0,
        "goals_for": 0, "goals_against": 0,
    }


def _to_row(team: Team, s: dict) -> StandingRow:
    goals_for, goals_against = s["goals_for"], s["goals_against"]
    return StandingRow(
        rank=0,
        team_id=team.id,
        team_name=team.name,
        group=team.group,
        played=s["played"],
        won=s["won"],
        drawn=s["drawn"],
        lost=s["lost"],
        goals_for=goals_for,
        goals_against=goals_against,
        goal_difference=goals_for - goals_against,
        points=s["won"] * 3 + s["drawn"],
    )
