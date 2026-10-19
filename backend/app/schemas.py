"""Pydantic 出入参模型。"""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------- 通用 ----------

class Message(BaseModel):
    message: str


# ---------- 球队 / 球员 ----------

class TeamOut(BaseModel):
    id: str
    name: str
    group: str
    captain_id: Optional[str] = None


class PlayerOut(BaseModel):
    id: str
    name: str
    number: int
    team_id: str
    position: str
    personal_traits: list[str] = Field(default_factory=list)
    health_status: str
    yellow_cards: int
    red_cards: int
    is_suspended: bool


class HealthUpdate(BaseModel):
    health_status: str


class TraitsUpdate(BaseModel):
    personal_traits: list[str]


# ---------- 比赛 ----------

class GoalIn(BaseModel):
    player_id: str
    minute: int


class CardIn(BaseModel):
    player_id: str
    minute: int
    type: str  # yellow / red / second_yellow


class GoalOut(GoalIn):
    id: str


class CardOut(CardIn):
    id: str


class MatchOut(BaseModel):
    id: str
    stage: str
    group_name: Optional[str] = None
    home_team_id: str
    away_team_id: str
    home_team_name: Optional[str] = None
    away_team_name: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    time: str
    venue: str
    status: str
    goals: list[GoalOut] = Field(default_factory=list)
    cards: list[CardOut] = Field(default_factory=list)


class MatchUpdate(BaseModel):
    time: Optional[str] = None
    venue: Optional[str] = None
    home_team_id: Optional[str] = None
    away_team_id: Optional[str] = None
    status: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None


class ResultIn(BaseModel):
    home_score: int
    away_score: int
    goals: list[GoalIn] = Field(default_factory=list)
    cards: list[CardIn] = Field(default_factory=list)


# ---------- 积分榜 ----------

class StandingRow(BaseModel):
    rank: int
    team_id: str
    team_name: str
    group: str
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int


# ---------- 阵容 ----------

class LineupSlot(BaseModel):
    position: str
    posLabel: str
    row: float
    col: float
    playerId: Optional[str] = None


class LineupOut(BaseModel):
    id: str
    match_id: str
    team_id: str
    formation: str
    slots: list[LineupSlot] = Field(default_factory=list)
    substitutes: list[str] = Field(default_factory=list)
    status: str
    published_at: Optional[str] = None


class LineupSave(BaseModel):
    match_id: str
    team_id: str
    formation: str
    slots: list[LineupSlot]
    substitutes: list[str] = Field(default_factory=list)


class LineupRecommendIn(BaseModel):
    match_id: str
    team_id: str
    formation: str = "4-3-3"


# ---------- 感想 / 文稿 ----------

class ReviewIn(BaseModel):
    content: str


class ReviewOut(BaseModel):
    id: str
    match_id: str
    player_id: str
    player_name: Optional[str] = None
    author_role: str
    content: str
    created_at: str


class ArticleIn(BaseModel):
    match_id: str
    title: str
    content: str


class ArticlePatch(BaseModel):
    """文稿编辑：标题/内容可只改其一。"""
    title: Optional[str] = None
    content: Optional[str] = None


class CommentIn(BaseModel):
    author: str
    content: str


class CommentOut(CommentIn):
    id: str
    created_at: str


class ArticleOut(BaseModel):
    id: str
    match_id: str
    title: str
    content: str
    status: str
    created_at: str
    comments: list[CommentOut] = Field(default_factory=list)


# ---------- 约球接龙 ----------

class SocialEventIn(BaseModel):
    title: str
    type: str = "football"
    time: str
    venue: str
    min_players: int
    deadline: str
    description: Optional[str] = None


class SocialEventOut(SocialEventIn):
    id: str
    current_players: list[str] = Field(default_factory=list)
    status: str
    creator_id: str
    creator_name: str


# ---------- 消息 ----------

class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    content: str
    is_read: bool
    related_id: Optional[str] = None
    created_at: str


# ---------- AI ----------

class PredictionOut(BaseModel):
    match_id: str
    home_team_name: str
    away_team_name: str
    probabilities: dict[str, float]  # home_win / draw / away_win
    predicted_score: dict[str, int]
    model: str
    note: Optional[str] = None


class TacticsOut(BaseModel):
    match_id: str
    home_team_name: str
    away_team_name: str
    summary: str
    sections: dict[str, str]
    source: str  # llm / mock


class LineupRecommendOut(BaseModel):
    match_id: str
    formation: str
    lineup: dict[str, Any]  # slots / substitutes
    reasons: dict[str, str]
    source: str


class ReviewSummaryOut(BaseModel):
    match_id: str
    summary: str
    source: str


class ArticleDraftOut(BaseModel):
    match_id: str
    title: str
    content: str
    source: str


class ParsedScheduleItem(BaseModel):
    stage: Optional[str] = None
    group: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    home: Optional[str] = None
    away: Optional[str] = None


class ParseScheduleOut(BaseModel):
    matches: list[ParsedScheduleItem] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    source: str
