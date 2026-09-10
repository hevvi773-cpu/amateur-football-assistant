import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { scopedStorage } from '@lark-apaas/client-toolkit-lite'
import { IMatch, MOCK_MATCHES } from '@/data/matches'
import { ITeam, MOCK_TEAMS } from '@/data/teams'
import { IPlayer, MOCK_PLAYERS } from '@/data/players'
import { IReview, MOCK_REVIEWS } from '@/data/reviews'
import { IArticle, MOCK_ARTICLES } from '@/data/articles'
import { ISocialEvent, MOCK_SOCIAL_EVENTS } from '@/data/social'
import { IMessage, MOCK_MESSAGES } from '@/data/messages'
import { ILineup, MOCK_LINEUP } from '@/data/lineup'

export type UserRole = 'member' | 'captain' | 'association' | 'visitor'

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
}

const AppContext = createContext<AppContextType | null>(null)

const ROLE_KEY = '__football_currentRole'

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
  const [currentRole, setCurrentRoleState] = useState<UserRole>(
    loadFromStorage<UserRole>(ROLE_KEY, 'member')
  )
  const [matches, setMatches] = useState<IMatch[]>(loadFromStorage('__football_matches', MOCK_MATCHES))
  const [teams, setTeams] = useState<ITeam[]>(loadFromStorage('__football_teams', MOCK_TEAMS))
  const [players, setPlayers] = useState<IPlayer[]>(loadFromStorage('__football_players', MOCK_PLAYERS))
  const [reviews, setReviews] = useState<IReview[]>(loadFromStorage('__football_reviews', MOCK_REVIEWS))
  const [articles, setArticles] = useState<IArticle[]>(loadFromStorage('__football_articles', MOCK_ARTICLES))
  const [socialEvents, setSocialEvents] = useState<ISocialEvent[]>(
    loadFromStorage('__football_socialEvents', MOCK_SOCIAL_EVENTS)
  )
  const [messages, setMessages] = useState<IMessage[]>(loadFromStorage('__football_messages', MOCK_MESSAGES))
  const [lineup, setLineup] = useState<ILineup>(loadFromStorage('__football_lineup', MOCK_LINEUP))

  const currentPlayerId = '1' // 当前登录用户 = 张伟 (队长ID，但角色可切换)
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
  }, [messages, setMessagesAndSave])

  const addMessage = useCallback(
    (msg: Omit<IMessage, 'id' | 'userId' | 'isRead' | 'createdAt'>) => {
      const now = new Date()
      const newMsg: IMessage = {
        ...msg,
        id: `msg_${Date.now()}`,
        userId: 'current',
        isRead: false,
        createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      }
      setMessagesAndSave([newMsg, ...messages])
    },
    [messages, setMessagesAndSave]
  )

  // 标记消息已读 - 暴露函数
  useEffect(() => {
    // no-op, placeholder for side effects
  }, [])

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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// 辅助函数：根据球队ID获取球队名
export function getTeamName(teams: ITeam[], teamId: string): string {
  // mock数据中 team id 是 '1','2'... 但 match 里是 't1','t2'...
  const normalizedId = teamId.replace('t', '')
  const team = teams.find((t) => t.id === normalizedId || t.id === teamId)
  return team?.name || teamId
}

// 根据球员ID获取球员名
export function getPlayerName(players: IPlayer[], playerId: string): string {
  const p = players.find((p) => p.id === playerId || `p${p.id}` === playerId)
  return p?.name || playerId
}
