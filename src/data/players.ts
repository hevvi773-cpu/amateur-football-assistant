// EXPORTS: IPlayer, MOCK_PLAYERS
export interface IPlayer {
  id: string
  name: string
  number: number
  position: string
  personalTraits: string[]
  healthStatus: 'healthy' | 'tired' | 'minor_injury' | 'injured'
  yellowCards: number
  redCards: number
  isSuspended: boolean
  teamId: string
  imageUrl: string
}

