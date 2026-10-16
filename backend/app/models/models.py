"""Pydantic 数据模型 - 对接前端 TypeScript 接口"""
from typing import List, Optional
from pydantic import BaseModel


# ===== 比赛 =====
class GoalRecord(BaseModel):
    id: str
    playerId: str
    teamId: str
    minute: int


class CardRecord(BaseModel):
    id: str
    playerId: str
    teamId: str
    minute: int
    type: str  # yellow | red | second_yellow


class Match(BaseModel):
    id: str
    stage: str  # group | knockout
    groupName: Optional[str] = None
    homeTeamId: str
    awayTeamId: str
    homeScore: Optional[int] = None
    awayScore: Optional[int] = None
    time: str
    venue: str
    status: str  # upcoming | ongoing | finished
    goals: Optional[List[GoalRecord]] = None
    cards: Optional[List[CardRecord]] = None
    aiPrediction: Optional[str] = None
    aiPreview: Optional[str] = None
    articleId: Optional[str] = None


# ===== 球队 =====
class Team(BaseModel):
    id: str
    name: str
    logo: Optional[str] = None
    coach: Optional[str] = None
    founded: Optional[str] = None
    homeVenue: Optional[str] = None


# ===== 球员 =====
class Player(BaseModel):
    id: str
    name: str
    teamId: str
    number: int
    position: str
    avatar: Optional[str] = None
    age: Optional[int] = None


# ===== 赛后复盘 =====
class Review(BaseModel):
    id: str
    matchId: str
    authorId: str
    content: str
    createdAt: str
    aiGenerated: bool = False


# ===== 赛事纪实文章 =====
class Article(BaseModel):
    id: str
    matchId: Optional[str] = None
    title: str
    content: str
    author: str
    createdAt: str
    aiGenerated: bool = False


# ===== 约球社交事件 =====
class SocialEvent(BaseModel):
    id: str
    type: str  # match_invite | training | gathering
    title: str
    description: str
    organizerId: str
    time: str
    venue: str
    maxParticipants: int
    currentParticipants: int = 0
    status: str = "open"  # open | full | cancelled


# ===== 消息 =====
class Message(BaseModel):
    id: str
    userId: str
    title: str
    content: str
    type: str = "system"  # system | match | social
    isRead: bool = False
    createdAt: str


# ===== 阵容 =====
class LineupSlot(BaseModel):
    position: str
    posLabel: str
    row: float
    col: float
    playerId: Optional[str] = None


class Lineup(BaseModel):
    matchId: str
    formation: str
    slots: List[LineupSlot]
    substitutes: List[str]
    status: str = "draft"  # draft | published


# ===== AI 相关 =====
class PredictionRequest(BaseModel):
    homeTeamId: str
    awayTeamId: str


class PredictionResponse(BaseModel):
    homeWinProb: float
    drawProb: float
    awayWinProb: float
    predictedScore: str
    confidence: str
    reasoning: str


class TacticsRequest(BaseModel):
    matchId: str
    teamId: str


class TacticsResponse(BaseModel):
    formation: str
    keyPlayers: List[str]
    tactics: str
    weaknesses: List[str]


class ReviewRequest(BaseModel):
    matchId: str


class ReviewResponse(BaseModel):
    content: str
    keyMoments: List[str]
    playerRatings: dict


class LineupRequest(BaseModel):
    matchId: str
    teamId: str
    formation: Optional[str] = None


class LineupResponse(BaseModel):
    formation: str
    slots: List[LineupSlot]
    substitutes: List[str]
    reasoning: str
