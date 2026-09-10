// EXPORTS: ISocialEvent, MOCK_SOCIAL_EVENTS
export interface ISocialEvent {
  id: string
  title: string
  type: 'football' | 'dinner'
  time: string
  venue: string
  minPlayers: number
  currentPlayers: string[]
  deadline: string
  status: 'recruiting' | 'confirmed' | 'cancelled'
  creatorId: string
  creatorName: string
  description?: string
}

export const MOCK_SOCIAL_EVENTS: ISocialEvent[] = [
  {
    id: 's1',
    title: '周末友谊赛 - 南宁联队 vs 城南FC',
    type: 'football',
    time: '2024-06-15 16:00',
    venue: '南宁市体育场',
    minPlayers: 8,
    currentPlayers: ['1', '2', '5', '6', '9', '10'],
    deadline: '2024-06-14 20:00',
    status: 'recruiting',
    creatorId: '1',
    creatorName: '张伟',
    description: '周末约球，7人制，大家踊跃报名！',
  },
  {
    id: 's2',
    title: '赛后聚餐 - 庆祝首胜',
    type: 'dinner',
    time: '2024-06-02 19:00',
    venue: '老南宁饭店',
    minPlayers: 5,
    currentPlayers: ['1', '2', '3', '5', '6', '7', '9', '10'],
    deadline: '2024-06-02 12:00',
    status: 'confirmed',
    creatorId: '1',
    creatorName: '张伟',
    description: '首胜庆祝聚餐，大家一起吃个饭聊聊球。',
  },
  {
    id: 's3',
    title: '夜跑训练 - 体能强化',
    type: 'football',
    time: '2024-06-10 20:00',
    venue: '南湖公园',
    minPlayers: 4,
    currentPlayers: ['7'],
    deadline: '2024-06-09 20:00',
    status: 'cancelled',
    creatorId: '7',
    creatorName: '孙浩',
    description: '加练体能，备战下一场关键战。',
  },
]
