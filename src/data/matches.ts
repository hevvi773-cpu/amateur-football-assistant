// EXPORTS: IMatch, IGoalRecord, ICardRecord, MOCK_MATCHES
export interface IGoalRecord {
  id: string
  playerId: string
  teamId: string
  minute: number
}

export interface ICardRecord {
  id: string
  playerId: string
  teamId: string
  minute: number
  type: 'yellow' | 'red' | 'second_yellow'
}

export interface IMatch {
  id: string
  stage: 'group' | 'knockout'
  groupName?: string
  homeTeamId: string
  awayTeamId: string
  homeScore?: number
  awayScore?: number
  time: string
  venue: string
  status: 'upcoming' | 'ongoing' | 'finished'
  goals?: IGoalRecord[]
  cards?: ICardRecord[]
  aiPrediction?: string
  aiPreview?: string
  articleId?: string
}

export const MOCK_MATCHES: IMatch[] = [
  {
    id: 'm1',
    stage: 'group',
    groupName: 'A组',
    homeTeamId: 't1',
    awayTeamId: 't2',
    homeScore: 2,
    awayScore: 1,
    time: '2024-06-01 15:00',
    venue: '南宁市体育场',
    status: 'finished',
    goals: [
      { id: 'g1', playerId: 'p1', teamId: 't1', minute: 23 },
      { id: 'g2', playerId: 'p3', teamId: 't1', minute: 67 },
      { id: 'g3', playerId: 'p12', teamId: 't2', minute: 81 },
    ],
    cards: [
      { id: 'c1', playerId: 'p5', teamId: 't1', minute: 35, type: 'yellow' },
      { id: 'c2', playerId: 'p14', teamId: 't2', minute: 58, type: 'yellow' },
    ],
    aiPrediction: '南宁联队胜率 62%，平局 23%，柳州铁骑胜率 15%',
    aiPreview: '南宁联队主场优势明显，前锋线状态火热，建议重点防守对方10号核心球员。',
    articleId: 'a1',
  },
  {
    id: 'm2',
    stage: 'group',
    groupName: 'A组',
    homeTeamId: 't1',
    awayTeamId: 't3',
    time: '2024-06-08 19:30',
    venue: '南宁市体育场',
    status: 'upcoming',
  },
  {
    id: 'm3',
    stage: 'group',
    groupName: 'A组',
    homeTeamId: 't2',
    awayTeamId: 't3',
    homeScore: 0,
    awayScore: 0,
    time: '2024-06-05 16:00',
    venue: '柳州体育中心',
    status: 'ongoing',
    goals: [],
    cards: [
      { id: 'c3', playerId: 'p13', teamId: 't2', minute: 12, type: 'yellow' },
    ],
  },
]