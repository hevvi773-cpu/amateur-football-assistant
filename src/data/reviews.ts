// EXPORTS: IReview, MOCK_REVIEWS
export interface IReview {
  id: string
  matchId: string
  playerId: string
  authorRole: 'member' | 'captain'
  content: string
  aiSummary?: string
  createdAt: string
}

