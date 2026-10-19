import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { scopedStorage } from '@lark-apaas/client-toolkit-lite'
import { IMatch } from '@/data/matches'
import { ITeam } from '@/data/teams'
import { IPlayer } from '@/data/players'
import { IReview } from '@/data/reviews'
import { IArticle } from '@/data/articles'
import { ISocialEvent } from '@/data/social'
import { IMessage } from '@/data/messages'
import { ILineup } from '@/data/lineup'
import * as api from '@/lib/api'
import {
  buildTeams,
  mapArticle,
  mapLineup,
  mapMatch,
  mapNotification,
  mapPlayer,
  mapReview,
  mapSocialEvent,
  type RawArticle,
  type RawLineup,
  type RawMatch,
  type RawNotification,
  type RawPlayer,
  type RawReview,
  type RawSocialEvent,
  type RawStanding,
  type RawTeam,
} from '@/lib/mappers'

export type UserRole = 'member' | 'captain' | 'association' | 'visitor'
export type DataSource = 'api' | 'mock'

// 全能账号：默认挂在南宁联队（t1）队长张伟（p1），可随意切换身份与所属球队
// 全能账号默认视角：真实校园联赛中比赛最多的球队（地理科学学院，43场），打开即可看到真实数据
const DEFAULT_TEAM_ID = 't_fc836779'
const DEFAULT_PLAYER_ID = 'v_t_fc836779'

interface AppState {
  currentRole: UserRole
  matches: IMatch[]
  teams: ITeam[]
  players: IPlayer[]
  reviews: IReview[]
  articles: IArticle[]
  socialEvents: ISocialEvent[]
  messages: IMessage[]
  lineup: ILineup
  currentPlayerId: string
}

interface AppContextType extends AppState {
  setCurrentRole: (role: UserRole) => void
  setMatches: (matches: IMatch[]) => void
  setTeams: (teams: ITeam[]) => void
  setPlayers: (players: IPlayer[]) => void
  setReviews: (reviews: IReview[]) => void
  setArticles: (articles: IArticle[]) => void
  setSocialEvents: (events: ISocialEvent[]) => void
  setMessages: (messages: IMessage[]) => void
  setLineup: (lineup: ILineup) => void
  unreadCount: number
  markAllRead: () => void
  addMessage: (msg: Omit<IMessage, 'id' | 'userId' | 'isRead' | 'createdAt'>) => void
  isTeamMember: boolean
  /** 当前数据源：'api' = 后端真实数据，'mock' = 本地模拟数据（后端不可达时） */
  dataSource: DataSource
  /** 重新从后端拉取全量数据 */
  refreshAll: () => Promise<void>
  /** 当前所属球队ID（全能账号可随意切换） */
  currentTeamId: string
  /** 切换所属球队，自动重拉该队数据 */
  switchTeam: (teamId: string) => void
  /** 本队最近一场未开赛/进行中的比赛ID（阵容页用），无则 null */
  activeLineupMatchId: string | null
}

const AppContext = createContext<AppContextType | null>(null)

const ROLE_KEY = '__football_currentRole'
/** 全部数据缓存 key（本地持久化，仅存后端真实数据；旧版本可能混入模拟数据，一次性清除） */
const CACHE_KEYS = [
  '__football_matches', '__football_teams', '__football_players', '__football_reviews',
  '__football_articles', '__football_socialEvents', '__football_messages', '__football_lineup',
]
const CACHE_VERSION_FLAG = '__football_cache_v2'

function clearLegacyMockCache() {
  if (scopedStorage.getItem(CACHE_VERSION_FLAG)) return
  for (const key of CACHE_KEYS) scopedStorage.removeItem(key)
  scopedStorage.setItem(CACHE_VERSION_FLAG, '1')
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = scopedStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore
  }
  return fallback
}

function saveToStorage(key: string, value: unknown) {
  try {
    scopedStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  clearLegacyMockCache()
  const [currentRole, setCurrentRoleState] = useState<UserRole>(
    loadFromStorage<UserRole>(ROLE_KEY, 'member')
  )
  const [matches, setMatches] = useState<IMatch[]>(loadFromStorage<IMatch[]>('__football_matches', []))
  const [teams, setTeams] = useState<ITeam[]>(loadFromStorage<ITeam[]>('__football_teams', []))
  const [players, setPlayers] = useState<IPlayer[]>(loadFromStorage<IPlayer[]>('__football_players', []))
  const [reviews, setReviews] = useState<IReview[]>(loadFromStorage<IReview[]>('__football_reviews', []))
  const [articles, setArticles] = useState<IArticle[]>(loadFromStorage<IArticle[]>('__football_articles', []))
  const [socialEvents, setSocialEvents] = useState<ISocialEvent[]>(
    loadFromStorage<ISocialEvent[]>('__football_socialEvents', [])
  )
  const [messages, setMessages] = useState<IMessage[]>(loadFromStorage<IMessage[]>('__football_messages', []))
  const [lineup, setLineup] = useState<ILineup>(
    loadFromStorage<ILineup>('__football_lineup', { matchId: '', formation: '4-3-3', slots: [], substitutes: [], status: 'draft' })
  )
  const [dataSource, setDataSource] = useState<DataSource>('mock')
  // 全能账号：所属球队 + 代表球员（该队有球员数据时取第一人，否则用虚拟ID），持久化到本地
  const [currentTeamId, setCurrentTeamId] = useState<string>(
    loadFromStorage('__football_currentTeamId', DEFAULT_TEAM_ID)
  )
  const [currentPlayerId, setCurrentPlayerId] = useState<string>(
    loadFromStorage('__football_currentPlayerId', DEFAULT_PLAYER_ID)
  )
  const [activeLineupMatchId, setActiveLineupMatchId] = useState<string | null>(null)

  const currentPlayerIdRef = currentPlayerId
  const isTeamMember = currentRole === 'member' || currentRole === 'captain'

  const unreadCount = messages.filter((m) => !m.isRead).length

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentRoleState(role)
    saveToStorage(ROLE_KEY, role)
  }, [])

  const setMatchesAndSave = useCallback((m: IMatch[]) => {
    setMatches(m)
    saveToStorage('__football_matches', m)
  }, [])

  const setTeamsAndSave = useCallback((t: ITeam[]) => {
    setTeams(t)
    saveToStorage('__football_teams', t)
  }, [])

  const setPlayersAndSave = useCallback((p: IPlayer[]) => {
    setPlayers(p)
    saveToStorage('__football_players', p)
  }, [])

  const setReviewsAndSave = useCallback((r: IReview[]) => {
    setReviews(r)
    saveToStorage('__football_reviews', r)
  }, [])

  const setArticlesAndSave = useCallback((a: IArticle[]) => {
    setArticles(a)
    saveToStorage('__football_articles', a)
  }, [])

  const setSocialEventsAndSave = useCallback((s: ISocialEvent[]) => {
    setSocialEvents(s)
    saveToStorage('__football_socialEvents', s)
  }, [])

  const setMessagesAndSave = useCallback((m: IMessage[]) => {
    setMessages(m)
    saveToStorage('__football_messages', m)
  }, [])

  const setLineupAndSave = useCallback((l: ILineup) => {
    setLineup(l)
    saveToStorage('__football_lineup', l)
  }, [])

  const markAllRead = useCallback(() => {
    const updated = messages.map((m) => ({ ...m, isRead: true }))
    setMessagesAndSave(updated)
    if (dataSource === 'api') {
      api.markAllNotificationsRead().catch(() => undefined)
    }
  }, [messages, setMessagesAndSave, dataSource])

  const addMessage = useCallback(
    (msg: Omit<IMessage, 'id' | 'userId' | 'isRead' | 'createdAt'>) => {
      const now = new Date()
      const newMsg: IMessage = {
        ...msg,
        id: `msg_${Date.now()}`,
        userId: currentPlayerId,
        isRead: false,
        createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      }
      setMessagesAndSave([newMsg, ...messages])
    },
    [messages, setMessagesAndSave, currentPlayerId]
  )

  /** 切换所属球队（全能账号）：先挂虚拟球员，拉取后按该队球员数据校准。 */
  const switchTeam = useCallback((teamId: string) => {
    setCurrentTeamId(teamId)
    setCurrentPlayerId(`v_${teamId}`)
    saveToStorage('__football_currentTeamId', teamId)
    saveToStorage('__football_currentPlayerId', `v_${teamId}`)
  }, [])

  /** 从后端拉取全量数据；各模块独立失败时保留本地（mock）数据兜底。 */
  const refreshAll = useCallback(async () => {
    const targetTeamId = currentTeamId
    let apiOk = false
    const role = currentRole
    const userId = currentPlayerIdRef

    // 第一步：比赛列表，用于确定本队的感想场次与阵容场次
    let matchList: IMatch[] | null = null
    try {
      const raw = await api.fetchMatches({}, { role, userId })
      matchList = raw.map(mapMatch)
      apiOk = true
      setMatchesAndSave(matchList)
    } catch {
      // 后端不可达，保留本地数据
    }

    const currentMatches = matchList ?? matches
    const myMatches = currentMatches.filter(
      (m) => m.homeTeamId === targetTeamId || m.awayTeamId === targetTeamId
    )
    const myFinished = myMatches
      .filter((m) => m.status === 'finished')
      .sort((a, b) => b.time.localeCompare(a.time))[0]
    const myUpcoming = myMatches
      .filter((m) => m.status === 'upcoming' || m.status === 'ongoing')
      .sort((a, b) => a.time.localeCompare(b.time))[0]

    setActiveLineupMatchId(myUpcoming?.id ?? null)
    if (!myFinished) {
      setReviewsAndSave([])
    }
    if (!myUpcoming) {
      setLineupAndSave({ matchId: '', formation: '4-3-3', slots: [], substitutes: [], status: 'draft' })
    }

    // 第二步：其余接口并行拉取
    const results = await Promise.allSettled([
      api.fetchTeams({ role, userId }),
      api.fetchStandings(undefined, { role, userId }),
      api.fetchPlayers(targetTeamId, { role, userId }),
      myFinished ? api.fetchReviews(myFinished.id, { role, userId }) : Promise.resolve(null),
      api.fetchArticles({ role, userId }),
      api.fetchSocialEvents({ role, userId }),
      api.fetchNotifications({ role, userId }),
      myUpcoming ? api.fetchLineup(myUpcoming.id, targetTeamId, { role, userId }) : Promise.resolve(null),
    ])

    const settled = <T,>(result: PromiseSettledResult<T>): T | null =>
      result.status === 'fulfilled' ? result.value : null

    const rawTeams = settled(results[0]) as RawTeam[] | null
    const rawStandings = settled(results[1]) as RawStanding[] | null
    const rawPlayers = settled(results[2]) as RawPlayer[] | null
    const rawReviews = settled(results[3]) as RawReview[] | null
    const rawArticles = settled(results[4]) as RawArticle[] | null
    const rawSocial = settled(results[5]) as RawSocialEvent[] | null
    const rawNotifications = settled(results[6]) as RawNotification[] | null
    const rawLineup = settled(results[7]) as RawLineup | null

    if (rawTeams && rawStandings) {
      const mappedTeams = buildTeams(rawTeams, rawStandings)
      setTeamsAndSave(mappedTeams)
      // 校准所属球队：当前球队不在列表（如后端仅返回演示队）时，回退到真实学院联赛球队
      if (!mappedTeams.some((t) => t.id === targetTeamId)) {
        const leagueTeam = mappedTeams.find((t) => t.group === '学院联赛') ?? mappedTeams[0]
        if (leagueTeam) {
          setCurrentTeamId(leagueTeam.id)
          saveToStorage('__football_currentTeamId', leagueTeam.id)
        }
      }
    }
    if (rawPlayers) {
      const mappedPlayers = rawPlayers.map(mapPlayer)
      setPlayersAndSave(mappedPlayers)
      // 校准全能账号的代表球员：该队有球员取第一人，无球员用虚拟ID
      if (mappedPlayers.length > 0) {
        if (!mappedPlayers.some((p) => p.id === currentPlayerIdRef)) {
          const next = mappedPlayers[0].id
          setCurrentPlayerId(next)
          saveToStorage('__football_currentPlayerId', next)
        }
      } else {
        setCurrentPlayerId(`v_${targetTeamId}`)
        saveToStorage('__football_currentPlayerId', `v_${targetTeamId}`)
      }
    }
    if (rawReviews) {
      setReviewsAndSave(rawReviews.map(mapReview))
    }
    if (rawArticles) {
      setArticlesAndSave(rawArticles.map(mapArticle))
    }
    if (rawSocial) {
      setSocialEventsAndSave(rawSocial.map(mapSocialEvent))
    }
    if (rawNotifications) {
      setMessagesAndSave(rawNotifications.map(mapNotification))
    }
    if (rawLineup) {
      setLineupAndSave(mapLineup(rawLineup))
    }

    setDataSource(apiOk ? 'api' : 'mock')
  }, [currentRole, currentTeamId, matches, setMatchesAndSave, setTeamsAndSave, setPlayersAndSave, setReviewsAndSave, setArticlesAndSave, setSocialEventsAndSave, setMessagesAndSave, setLineupAndSave])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const value: AppContextType = {
    currentRole,
    matches,
    teams,
    players,
    reviews,
    articles,
    socialEvents,
    messages,
    lineup,
    currentPlayerId,
    unreadCount,
    isTeamMember,
    dataSource,
    setCurrentRole,
    setMatches: setMatchesAndSave,
    setTeams: setTeamsAndSave,
    setPlayers: setPlayersAndSave,
    setReviews: setReviewsAndSave,
    setArticles: setArticlesAndSave,
    setSocialEvents: setSocialEventsAndSave,
    setMessages: setMessagesAndSave,
    setLineup: setLineupAndSave,
    markAllRead,
    addMessage,
    refreshAll,
    currentTeamId,
    switchTeam,
    activeLineupMatchId,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppContext')
  return ctx
}

// 辅助函数：根据球队ID获取球队名
export function getTeamName(teams: ITeam[], teamId: string): string {
  const team = teams.find((t) => t.id === teamId || `t${t.id}` === teamId)
  return team?.name || teamId
}

// 根据球员ID获取球员名
export function getPlayerName(players: IPlayer[], playerId: string): string {
  const player = players.find((item) => item.id === playerId || item.id === playerId.replace(/^p/, ''))
  return player?.name || playerId
}
