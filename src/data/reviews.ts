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

export const MOCK_REVIEWS: IReview[] = [
  {
    id: '1',
    matchId: '3',
    playerId: '1',
    authorRole: 'captain',
    content: '全队跑动积极，中场衔接流畅，防守端失误控制不错，继续保持！',
    aiSummary: '队长肯定了全队跑动与中场配合，指出防守端失误控制良好，鼓励继续保持状态。',
    createdAt: '2024-05-12 21:30'
  },
  {
    id: '2',
    matchId: '3',
    playerId: '3',
    authorRole: 'member',
    content: '今天左路进攻打得很开，传球到位率高，希望下一场继续首发。',
    aiSummary: '该队员对左路进攻表现满意，认为传球质量高，表达了希望继续首发的愿望。',
    createdAt: '2024-05-12 22:05'
  },
  {
    id: '3',
    matchId: '3',
    playerId: '7',
    authorRole: 'member',
    content: '体能在下半场明显下降，需要加强有氧训练，争取打满全场。',
    aiSummary: '队员反思下半场体能下滑问题，计划加强有氧训练以提升全场续航能力。',
    createdAt: '2024-05-12 22:15'
  }
]