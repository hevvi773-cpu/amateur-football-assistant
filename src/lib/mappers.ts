/**
 * 后端 snake_case 响应 → 前端 camelCase 类型映射。
 * 前端原型的数据类型（IMatch/ITeam/IPlayer/...）保持不变，这里做字段转换。
 */
import { IMatch, IGoalRecord, ICardRecord } from '@/data/matches'
import { ITeam } from '@/data/teams'
import { IPlayer } from '@/data/players'
import { IReview } from '@/data/reviews'
import { IArticle, IComment } from '@/data/articles'
import { ISocialEvent } from '@/data/social'
import { IMessage } from '@/data/messages'
import { ILineup, ILineupSlot } from '@/data/lineup'

// ---------- 原始响应类型（后端契约） ----------

export interface RawMatch {
  id: string
  stage: string
  group_name?: string | null
  home_team_id: string
  away_team_id: string
  home_team_name?: string | null
  away_team_name?: string | null
  home_score?: number | null
  away_score?: number | null
  time: string
  venue: string
  status: string
  goals?: RawGoal[]
  cards?: RawCard[]
}

export interface RawGoal {
  id: string
  player_id?: string | null
  minute: number
}

export interface RawCard {
  id: string
  player_id?: string | null
  minute: number
  type: string
}

export interface RawStanding {
  rank: number
  team_id: string
  team_name: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

export interface RawTeam {
  id: string
  name: string
  group: string
  captain_id?: string | null
}

export interface RawPlayer {
  id: string
  name: string
  number: number
  team_id: string
  position: string
  personal_traits?: string[]
  health_status: string
  yellow_cards: number
  red_cards: number
  is_suspended: boolean
}

export interface RawReview {
  id: string
  match_id: string
  player_id: string
  player_name?: string | null
  author_role: string
  content: string
  created_at: string
}

export interface RawComment {
  id: string
  article_id?: string
  author: string
  content: string
  created_at: string
}

export interface RawArticle {
  id: string
  match_id: string
  title: string
  content: string
  status: string
  created_at: string
  comments?: RawComment[]
}

export interface RawSocialEvent {
  id: string
  title: string
  type: string
  time: string
  venue: string
  min_players: number
  current_players: string[]
  deadline: string
  status: string
  creator_id: string
  creator_name: string
  description?: string | null
}

export interface RawNotification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  is_read: boolean
  related_id?: string | null
  created_at: string
}

export interface RawLineup {
  id: string
  match_id: string
  team_id: string
  formation: string
  slots: RawLineupSlot[]
  substitutes: string[]
  status: string
}

export interface RawLineupSlot {
  position: string
  posLabel: string
  row: number
  col: number
  playerId?: string | null
}

// ---------- 映射函数 ----------

export function mapMatch(raw: RawMatch): IMatch {
  const goals: IGoalRecord[] = (raw.goals ?? []).map((g) => ({
    id: g.id,
    playerId: g.player_id ?? '',
    teamId: '',
    minute: g.minute,
  }))
  const cards: ICardRecord[] = (raw.cards ?? []).map((c) => ({
    id: c.id,
    playerId: c.player_id ?? '',
    teamId: '',
    minute: c.minute,
    type: c.type as ICardRecord['type'],
  }))
  return {
    id: raw.id,
    stage: raw.stage === 'knockout' ? 'knockout' : 'group',
    groupName: raw.group_name ?? undefined,
    homeTeamId: raw.home_team_id,
    awayTeamId: raw.away_team_id,
    homeScore: raw.home_score ?? undefined,
    awayScore: raw.away_score ?? undefined,
    time: raw.time,
    venue: raw.venue,
    status: raw.status as IMatch['status'],
    goals,
    cards,
  }
}

/** 球队 = /api/teams 基础信息 + /api/standings 战绩统计（按 team_id 合并）。 */
export function buildTeams(rawTeams: RawTeam[], standings: RawStanding[]): ITeam[] {
  const statsByTeam = new Map(standings.map((row) => [row.team_id, row]))
  return rawTeams.map((team) => {
    const stats = statsByTeam.get(team.id)
    return {
      id: team.id,
      name: team.name,
      group: team.group,
      played: stats?.played ?? 0,
      won: stats?.won ?? 0,
      drawn: stats?.drawn ?? 0,
      lost: stats?.lost ?? 0,
      goalsFor: stats?.goals_for ?? 0,
      goalsAgainst: stats?.goals_against ?? 0,
      goalDifference: stats?.goal_difference ?? 0,
      points: stats?.points ?? 0,
      logoUrl: '',
    }
  })
}

export function mapPlayer(raw: RawPlayer): IPlayer {
  return {
    id: raw.id,
    name: raw.name,
    number: raw.number,
    position: raw.position,
    personalTraits: raw.personal_traits ?? [],
    healthStatus: raw.health_status as IPlayer['healthStatus'],
    yellowCards: raw.yellow_cards,
    redCards: raw.red_cards,
    isSuspended: raw.is_suspended,
    teamId: raw.team_id,
    imageUrl: '',
  }
}

export function mapReview(raw: RawReview): IReview {
  return {
    id: raw.id,
    matchId: raw.match_id,
    playerId: raw.player_id,
    authorRole: (raw.author_role === 'captain' ? 'captain' : 'member') as IReview['authorRole'],
    content: raw.content,
    createdAt: raw.created_at,
  }
}

export function mapArticle(raw: RawArticle): IArticle {
  const comments: IComment[] = (raw.comments ?? []).map((c) => ({
    id: c.id,
    articleId: c.article_id ?? raw.id,
    author: c.author,
    content: c.content,
    createdAt: c.created_at,
  }))
  return {
    id: raw.id,
    matchId: raw.match_id,
    title: raw.title,
    content: raw.content,
    status: raw.status === 'published' ? 'published' : 'draft',
    comments,
    createdAt: raw.created_at,
  }
}

export function mapSocialEvent(raw: RawSocialEvent): ISocialEvent {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type === 'dinner' ? 'dinner' : 'football',
    time: raw.time,
    venue: raw.venue,
    minPlayers: raw.min_players,
    currentPlayers: raw.current_players ?? [],
    deadline: raw.deadline,
    status: raw.status as ISocialEvent['status'],
    creatorId: raw.creator_id,
    creatorName: raw.creator_name,
    description: raw.description ?? undefined,
  }
}

export function mapNotification(raw: RawNotification): IMessage {
  return {
    id: raw.id,
    userId: raw.user_id,
    type: raw.type as IMessage['type'],
    title: raw.title,
    content: raw.content,
    isRead: raw.is_read,
    createdAt: raw.created_at,
    relatedId: raw.related_id ?? undefined,
  }
}

export function mapLineup(raw: RawLineup): ILineup {
  const slots: ILineupSlot[] = (raw.slots ?? []).map((slot) => ({
    position: slot.position,
    posLabel: slot.posLabel,
    row: slot.row,
    col: slot.col,
    playerId: slot.playerId ?? undefined,
  }))
  return {
    id: raw.id,
    matchId: raw.match_id,
    formation: raw.formation,
    slots,
    substitutes: raw.substitutes ?? [],
    status: raw.status === 'published' ? 'published' : 'draft',
  }
}
