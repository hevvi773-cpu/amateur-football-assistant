// EXPORTS: IMessage, MOCK_MESSAGES
export interface IMessage {
  id: string
  userId: string
  type: 'lineup' | 'review_invite' | 'social' | 'system'
  title: string
  content: string
  isRead: boolean
  createdAt: string
  relatedId?: string
}

export const MOCK_MESSAGES: IMessage[] = [
  {
    id: 'msg1',
    userId: 'current',
    type: 'lineup',
    title: '阵容发布通知',
    content: '队长已发布对阵桂林雄鹰的首发阵容，请及时查看。',
    isRead: false,
    createdAt: '2024-06-07 10:30',
    relatedId: 'm2',
  },
  {
    id: 'msg2',
    userId: 'current',
    type: 'social',
    title: '约球已成行',
    content: '周末友谊赛报名人数已达标，活动确认举行！',
    isRead: false,
    createdAt: '2024-06-13 18:00',
    relatedId: 's1',
  },
  {
    id: 'msg3',
    userId: 'current',
    type: 'review_invite',
    title: '邀请填写赛后感想',
    content: '南宁联队 vs 柳州铁骑 的比赛已结束，邀请你填写本场赛后感想。',
    isRead: true,
    createdAt: '2024-06-01 21:00',
    relatedId: 'm1',
  },
  {
    id: 'msg4',
    userId: 'current',
    type: 'system',
    title: '赛事纪实新发布',
    content: '协会发布了新的赛事纪实文稿，快来看看吧！',
    isRead: true,
    createdAt: '2024-04-15 20:30',
    relatedId: 'a1',
  },
]
