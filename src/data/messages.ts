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

