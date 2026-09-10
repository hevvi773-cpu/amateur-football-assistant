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

export const MOCK_TEAMS: ITeam[] = [
  {
    id: '1',
    name: '南宁联队',
    group: 'A组',
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalsFor: 7,
    goalsAgainst: 3,
    goalDifference: 4,
    points: 7,
    logoUrl: ''
  },
  {
    id: '2',
    name: '柳州铁骑',
    group: 'A组',
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 6,
    goalsAgainst: 4,
    goalDifference: 2,
    points: 6,
    logoUrl: ''
  },
  {
    id: '3',
    name: '桂林雄鹰',
    group: 'A组',
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 4,
    goalsAgainst: 5,
    goalDifference: -1,
    points: 4,
    logoUrl: ''
  },
  {
    id: '4',
    name: '北海浪花',
    group: 'A组',
    played: 3,
    won: 0,
    drawn: 0,
    lost: 3,
    goalsFor: 2,
    goalsAgainst: 7,
    goalDifference: -5,
    points: 0,
    logoUrl: ''
  },
  {
    id: '5',
    name: '梧州雄狮',
    group: 'B组',
    played: 2,
    won: 2,
    drawn: 0,
    lost: 0,
    goalsFor: 5,
    goalsAgainst: 1,
    goalDifference: 4,
    points: 6,
    logoUrl: ''
  },
  {
    id: '6',
    name: '玉林闪电',
    group: 'B组',
    played: 2,
    won: 1,
    drawn: 0,
    lost: 1,
    goalsFor: 3,
    goalsAgainst: 4,
    goalDifference: -1,
    points: 3,
    logoUrl: ''
  }
]