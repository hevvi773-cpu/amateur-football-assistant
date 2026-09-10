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

export const MOCK_ARTICLES: IArticle[] = [
  {
    id: '1',
    matchId: '3',
    title: '南宁联队2-1险胜闪电队，小组赛首战告捷',
    content: '北京时间4月15日，小组赛A组首轮比赛在市体育中心打响。南宁联队凭借上半场张伟的头球破门和下半场李明的远射世界波，以2-1的比分战胜闪电队，取得开门红。\n\n开场仅12分钟，南宁联队获得左侧角球机会，10号张伟中路高高跃起头球攻门，皮球直挂死角，1-0！这也是本届赛事的首个进球。\n\n易边再战，第58分钟，闪电队通过反击扳平比分。但仅仅5分钟后，南宁联队8号李明在禁区前沿突施冷箭，打出一记世界波，门将鞭长莫及，2-1！\n\n最终南宁联队守住了胜果，全取三分。下一轮他们将迎战城南FC。',
    status: 'published',
    comments: [
      {
        id: 'c1',
        articleId: '1',
        author: '王强',
        content: '李明那脚远射太精彩了！',
        createdAt: '2024-04-15 21:30'
      },
      {
        id: 'c2',
        articleId: '1',
        author: '赵磊',
        content: '下场对阵城南FC不好打啊',
        createdAt: '2024-04-15 22:10'
      },
      {
        id: 'c3',
        articleId: '1',
        author: '陈涛',
        content: '张伟这赛季状态爆棚',
        createdAt: '2024-04-16 09:15'
      }
    ],
    createdAt: '2024-04-15 20:00'
  },
  {
    id: '2',
    matchId: '4',
    title: '城南FC vs 南宁联队 赛前前瞻',
    content: '本轮小组赛焦点战即将打响，城南FC上轮3-0大胜新军游侠队，状态火热。南宁联队首轮险胜闪电队，士气正旺。\n\n城南FC的锋线组合速度快、冲击力强，南宁联队的后防线将面临严峻考验。中场方面，李明的组织调度是南宁联队的关键。',
    status: 'draft',
    comments: [],
    createdAt: '2024-04-20 14:00'
  }
]