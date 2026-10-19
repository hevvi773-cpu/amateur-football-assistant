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

