// EXPORTS: IArticle, IComment, MOCK_ARTICLES
export interface IComment {
  id: string
  articleId: string
  author: string
  content: string
  createdAt: string
}

export interface IArticle {
  id: string
  matchId: string
  title: string
  content: string
  status: 'draft' | 'published'
  comments: IComment[]
  createdAt: string
}

