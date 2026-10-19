"""ORM 数据模型，对应 PRD §8 数据模型概要中的全部实体。"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import JSON, Boolean, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Team(Base):
    """球队。"""

    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    group: Mapped[str] = mapped_column(String(16))
    captain_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)


class Player(Base):
    """球员。"""

    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    number: Mapped[int] = mapped_column(Integer)
    team_id: Mapped[str] = mapped_column(String(32), index=True)
    position: Mapped[str] = mapped_column(String(32))
    personal_traits: Mapped[list] = mapped_column(JSON, default=list)
    health_status: Mapped[str] = mapped_column(String(24), default="healthy")  # healthy/tired/minor_injury/injured
    yellow_cards: Mapped[int] = mapped_column(Integer, default=0)
    red_cards: Mapped[int] = mapped_column(Integer, default=0)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False)


class Match(Base):
    """比赛/赛程。"""

    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    stage: Mapped[str] = mapped_column(String(16))  # group / knockout
    group_name: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    home_team_id: Mapped[str] = mapped_column(String(32))
    away_team_id: Mapped[str] = mapped_column(String(32))
    home_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    away_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time: Mapped[str] = mapped_column(String(32))
    venue: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(16), default="upcoming")  # upcoming/ongoing/finished/cancelled


class Goal(Base):
    """进球记录。"""

    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(32), index=True)
    player_id: Mapped[str] = mapped_column(String(32))
    minute: Mapped[int] = mapped_column(Integer)


class Card(Base):
    """红黄牌记录。"""

    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(32), index=True)
    player_id: Mapped[str] = mapped_column(String(32))
    minute: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(16))  # yellow / red / second_yellow


class Lineup(Base):
    """出场阵容。"""

    __tablename__ = "lineups"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(32), index=True)
    team_id: Mapped[str] = mapped_column(String(32))
    formation: Mapped[str] = mapped_column(String(16))
    slots: Mapped[list] = mapped_column(JSON, default=list)  # [{position,posLabel,row,col,playerId}]
    substitutes: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(16), default="draft")  # draft / published
    published_at: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)


class Review(Base):
    """赛后感想。"""

    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(32), index=True)
    player_id: Mapped[str] = mapped_column(String(32))
    author_role: Mapped[str] = mapped_column(String(16), default="member")  # member / captain
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String(32))


class Article(Base):
    """赛事纪实文稿。"""

    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(32), index=True)
    title: Mapped[str] = mapped_column(String(128))
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="draft")  # draft / published
    created_at: Mapped[str] = mapped_column(String(32))


class Comment(Base):
    """文稿评论。"""

    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    article_id: Mapped[str] = mapped_column(String(32), index=True)
    author: Mapped[str] = mapped_column(String(64))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String(32))


class SocialEvent(Base):
    """约球接龙。"""

    __tablename__ = "social_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(128))
    type: Mapped[str] = mapped_column(String(16), default="football")  # football / dinner
    time: Mapped[str] = mapped_column(String(32))
    venue: Mapped[str] = mapped_column(String(128))
    min_players: Mapped[int] = mapped_column(Integer)
    current_players: Mapped[list] = mapped_column(JSON, default=list)
    deadline: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16), default="recruiting")  # recruiting/confirmed/cancelled
    creator_id: Mapped[str] = mapped_column(String(32))
    creator_name: Mapped[str] = mapped_column(String(64))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deadline_notified: Mapped[bool] = mapped_column(Boolean, default=False)


class Notification(Base):
    """站内消息。"""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(32), index=True)
    type: Mapped[str] = mapped_column(String(24))  # lineup / review_invite / social / system
    title: Mapped[str] = mapped_column(String(128))
    content: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    related_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))
