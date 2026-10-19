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

