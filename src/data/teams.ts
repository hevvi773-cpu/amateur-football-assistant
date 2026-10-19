// EXPORTS: ITeam, MOCK_TEAMS
export interface ITeam {
  id: string
  name: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  logoUrl: string
}

