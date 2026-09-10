import { useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Upload,
  FileText,
  Edit2,
  Trash2,
  Plus,
  X,
  Trophy,
  Sparkles,
  Eye,
  Save,
  AlertCircle,
  Check,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react'
import { useApp, getTeamName } from '@/context/AppContext'
import { IMatch, IGoalRecord, ICardRecord } from '@/data/matches'
import { IArticle } from '@/data/articles'
import { toast } from 'sonner'
import { logger } from '@lark-apaas/client-toolkit-lite'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  upcoming: { label: '未开赛', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ongoing: { label: '进行中', className: 'bg-green-50 text-green-700 border-green-300 animate-pulse' },
  finished: { label: '已结束', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export default function AssociationPanel() {
  const { matches, setMatches, teams, players, articles, setArticles, setPlayers, setTeams, addMessage } = useApp()

  // 文件上传
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([])
  const [parseDialogOpen, setParseDialogOpen] = useState(false)

  // 赛程编辑
  const [editingMatch, setEditingMatch] = useState<IMatch | null>(null)

  // 结果录入
  const [selectedMatchForResult, setSelectedMatchForResult] = useState<IMatch | null>(null)
  const [resultForm, setResultForm] = useState({
    homeScore: '',
    awayScore: '',
    goals: [] as { playerId: string; teamId: string; minute: number }[],
    cards: [] as { playerId: string; teamId: string; minute: number; type: 'yellow' | 'red' | 'second_yellow' }[],
  })

  // 文稿管理
  const [viewingArticle, setViewingArticle] = useState<typeof articles[0] | null>(null)
  const [editingArticle, setEditingArticle] = useState<typeof articles[0] | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [aiGenerating, setAiGenerating] = useState<string | null>(null)

  interface ParsedMatch {
    key: number
    time: string
    venue: string
    homeTeam: string
    awayTeam: string
    stage: string
    stageLabel: string
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.toLowerCase().split('.').pop()
    if (ext !== 'txt' && ext !== 'docx') {
      const reason = ext === 'pdf' ? 'PDF 文件需要人工解析，暂不支持自动导入' :
                     ext === 'doc' ? '.doc 旧版格式请另存为 .docx 后再上传' :
                     ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext!) ? '图片格式不支持文字识别导入' :
                     `不支持 .${ext} 格式`
      toast.error(reason)
      logger.info('文件格式被拒绝:', file.name)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setParsing(true)

    // 模拟AI解析
    setTimeout(() => {
      const mockParsed: ParsedMatch[] = [
        { key: 1, time: '2024-06-15 15:00', venue: '市体育中心主体育场', homeTeam: '南宁联队', awayTeam: '柳州闪电队', stage: 'group', stageLabel: '小组赛A组' },
        { key: 2, time: '2024-06-16 19:30', venue: '青秀足球场', homeTeam: '桂林山水队', awayTeam: '梧州雄狮', stage: 'group', stageLabel: '小组赛B组' },
        { key: 3, time: '2024-06-22 15:00', venue: '市体育中心主体育场', homeTeam: '北海银滩FC', awayTeam: '南宁联队', stage: 'group', stageLabel: '小组赛A组' },
      ]
      setParsedMatches(mockParsed)
      setParsing(false)
      setParseDialogOpen(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, 1800)
  }

  const confirmParsedMatches = () => {
    const newMatches: IMatch[] = parsedMatches.map((pm, idx) => ({
      id: `m_new_${Date.now()}_${idx}`,
      stage: pm.stage as 'group' | 'knockout',
      groupName: pm.stage === 'group' ? 'A组' : undefined,
      homeTeamId: 't1',
      awayTeamId: 't2',
      time: pm.time,
      venue: pm.venue,
      status: 'upcoming',
      homeScore: 0,
      awayScore: 0,
      goals: [],
      cards: [],
    }))
    setMatches([...matches, ...newMatches])
    setParseDialogOpen(false)
    setParsedMatches([])
    toast.success(`已导入 ${newMatches.length} 场比赛`)
  }

  // 赛程编辑保存
  const saveMatchEdit = () => {
    if (!editingMatch) return
    setMatches(matches.map((m) => (m.id === editingMatch.id ? editingMatch : m)))
    setEditingMatch(null)
    toast.success('赛程已更新')
  }

  // 结果录入 - 进球
  const addGoal = () => {
    setResultForm({
      ...resultForm,
      goals: [...resultForm.goals, { playerId: '', teamId: '', minute: 0 }],
    })
  }
  const removeGoal = (idx: number) => {
    setResultForm({ ...resultForm, goals: resultForm.goals.filter((_, i) => i !== idx) })
  }
  const updateGoal = (idx: number, field: string, value: string | number) => {
    const goals = [...resultForm.goals]
    ;(goals[idx] as Record<string, unknown>)[field] = value
    setResultForm({ ...resultForm, goals })
  }

  // 结果录入 - 红黄牌
  const addCard = () => {
    setResultForm({
      ...resultForm,
      cards: [...resultForm.cards, { playerId: '', teamId: '', minute: 0, type: 'yellow' as const }],
    })
  }
  const removeCard = (idx: number) => {
    setResultForm({ ...resultForm, cards: resultForm.cards.filter((_, i) => i !== idx) })
  }
  const updateCard = (idx: number, field: string, value: string | number) => {
    const cards = [...resultForm.cards]
    ;(cards[idx] as Record<string, unknown>)[field] = value
    setResultForm({ ...resultForm, cards })
  }

  // 提交结果
  const submitResult = () => {
    if (!selectedMatchForResult) return
    const homeScore = parseInt(resultForm.homeScore) || 0
    const awayScore = parseInt(resultForm.awayScore) || 0

    // 更新比赛状态和比分
    const goals: IGoalRecord[] = resultForm.goals.map((g, i) => ({
      id: `goal_${Date.now()}_${i}`,
      ...g,
    }))
    const cards: ICardRecord[] = resultForm.cards.map((c, i) => ({
      id: `card_${Date.now()}_${i}`,
      ...c,
    }))

    const updatedMatch: IMatch = {
      ...selectedMatchForResult,
      status: 'finished',
      homeScore,
      awayScore,
      goals,
      cards,
    }
    setMatches(matches.map((m) => (m.id === selectedMatchForResult.id ? updatedMatch : m)))

    // 重算积分榜
    const newTeams = [...teams]
    const homeIdx = newTeams.findIndex((t) => t.id === selectedMatchForResult.homeTeamId.replace('t', ''))
    const awayIdx = newTeams.findIndex((t) => t.id === selectedMatchForResult.awayTeamId.replace('t', ''))
    if (homeIdx !== -1 && awayIdx !== -1) {
      newTeams[homeIdx] = { ...newTeams[homeIdx], played: newTeams[homeIdx].played + 1, goalsFor: newTeams[homeIdx].goalsFor + homeScore, goalsAgainst: newTeams[homeIdx].goalsAgainst + awayScore, goalDifference: newTeams[homeIdx].goalDifference + (homeScore - awayScore) }
      newTeams[awayIdx] = { ...newTeams[awayIdx], played: newTeams[awayIdx].played + 1, goalsFor: newTeams[awayIdx].goalsFor + awayScore, goalsAgainst: newTeams[awayIdx].goalsAgainst + homeScore, goalDifference: newTeams[awayIdx].goalDifference + (awayScore - homeScore) }
      if (homeScore > awayScore) {
        newTeams[homeIdx].won += 1; newTeams[homeIdx].points += 3
        newTeams[awayIdx].lost += 1
      } else if (homeScore < awayScore) {
        newTeams[awayIdx].won += 1; newTeams[awayIdx].points += 3
        newTeams[homeIdx].lost += 1
      } else {
        newTeams[homeIdx].drawn += 1; newTeams[homeIdx].points += 1
        newTeams[awayIdx].drawn += 1; newTeams[awayIdx].points += 1
      }
    }
    setTeams(newTeams)

    // 更新球员红黄牌和停赛
    const newPlayers = [...players]
    cards.forEach((card) => {
      const pIdx = newPlayers.findIndex((p) => p.id === card.playerId || `p${p.id}` === card.playerId)
      if (pIdx === -1) return
      if (card.type === 'yellow' || card.type === 'second_yellow') {
        newPlayers[pIdx] = { ...newPlayers[pIdx], yellowCards: newPlayers[pIdx].yellowCards + 1 }
        if (newPlayers[pIdx].yellowCards >= 3) {
          newPlayers[pIdx] = { ...newPlayers[pIdx], isSuspended: true }
        }
      } else if (card.type === 'red') {
        newPlayers[pIdx] = { ...newPlayers[pIdx], redCards: newPlayers[pIdx].redCards + 1, isSuspended: true }
      }
    })
    setPlayers(newPlayers)

    // 推送消息
    addMessage({
      type: 'system',
      title: '比赛结果已录入',
      content: `${getTeamName(teams, selectedMatchForResult.homeTeamId)} ${homeScore} - ${awayScore} ${getTeamName(teams, selectedMatchForResult.awayTeamId)}`,
      relatedId: selectedMatchForResult.id,
    })

    setSelectedMatchForResult(null)
    setResultForm({ homeScore: '', awayScore: '', goals: [], cards: [] })
    toast.success('比赛结果已录入，积分榜和球员数据已更新')
  }

  const openResultEntry = (match: IMatch) => {
    setSelectedMatchForResult(match)
    setResultForm({
      homeScore: match.homeScore?.toString() || '0',
      awayScore: match.awayScore?.toString() || '0',
      goals: match.goals?.map(({ id: _id, ...g }) => g) || [],
      cards: match.cards?.map(({ id: _id, ...c }) => c) || [],
    })
  }

  // AI生成文稿
  const generateArticle = async (matchId: string) => {
    setAiGenerating(matchId)
    const match = matches.find((m) => m.id === matchId)
    if (!match) return
    const homeName = getTeamName(teams, match.homeTeamId)
    const awayName = getTeamName(teams, match.awayTeamId)

    await new Promise((r) => setTimeout(r, 2000))

    const newArticle: IArticle = {
      id: `article_draft_${Date.now()}`,
      matchId,
      title: `【赛事纪实】${homeName} ${match.homeScore} - ${match.awayScore} ${awayName}`,
      content: `# ${homeName} ${match.homeScore} - ${match.awayScore} ${awayName}\n\n${match.time}，${match.venue}，${match.stage === 'group' ? match.groupName : '淘汰赛'}迎来一场焦点对决。\n\n## 比赛概况\n\n本场比赛双方展开了激烈的较量。${homeName}在主场表现出色，凭借团队配合和个人能力取得了进球。${awayName}也展现了顽强的斗志，给对手制造了不少威胁。\n\n## 精彩瞬间\n\n- 上半场双方你来我往，攻防转换节奏很快\n- 中场休息时教练进行了战术调整\n- 下半场关键换人改变了比赛走势\n- 补时阶段双方均有破门良机\n\n## 赛后点评\n\n整体来看，这是一场高质量的比赛。双方球员都展现出了良好的竞技状态和体育精神。${homeName}的胜利实至名归，${awayName}虽败犹荣。\n\n## 数据统计\n\n- 控球率：${55 + Math.floor(Math.random() * 10)}% : ${40 + Math.floor(Math.random() * 10)}%\n- 射门次数：${12 + Math.floor(Math.random() * 5)} : ${8 + Math.floor(Math.random() * 5)}\n- 角球：${5 + Math.floor(Math.random() * 3)} : ${3 + Math.floor(Math.random() * 3)}\n- 犯规：${10 + Math.floor(Math.random() * 5)} : ${8 + Math.floor(Math.random() * 5)}\n\n*本文稿由AI自动生成，仅供参考，请人工审核后发布。`,
      status: 'draft',
      comments: [],
      createdAt: new Date().toLocaleString('zh-CN'),
    }

    setArticles([newArticle, ...articles])
    setAiGenerating(null)
    setEditingArticle(newArticle)
    setEditTitle(newArticle.title)
    setEditContent(newArticle.content)
    toast.success('AI文稿草稿已生成，请审核后发布')
  }

  // 发布/取消发布文稿
  const togglePublish = (article: typeof articles[0]) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    setArticles(
      articles.map((a) =>
        a.id === article.id
          ? { ...a, status: newStatus, createdAt: newStatus === 'published' ? new Date().toLocaleString('zh-CN') : a.createdAt }
          : a
      )
    )
    toast.success(newStatus === 'published' ? '文稿已发布' : '已取消发布')
  }

  // 保存编辑的文稿
  const saveArticleEdit = () => {
    if (!editingArticle) return
    setArticles(
      articles.map((a) =>
        a.id === editingArticle.id ? { ...a, title: editTitle, content: editContent } : a
      )
    )
    setEditingArticle(null)
    toast.success('文稿已保存')
  }

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => a.time.localeCompare(b.time)),
    [matches]
  )

  // 解析时间字符串：返回 { date, time }
  const parseDateTime = (timeStr: string) => {
    const parts = timeStr.split(' ')
    return { date: parts[0] || timeStr, time: parts[1] || '' }
  }

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
          {/* 标题 */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">赛事管理面板</h1>
            <p className="text-muted-foreground text-sm mt-1">赛程管理 · 结果录入 · 纪实文稿</p>
          </div>

          {/* ========== 一、赛程上传 ========== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="size-5 text-primary" />
                赛程文件上传解析
              </CardTitle>
              <CardDescription>
                支持 .txt、.docx 格式，上传后由AI自动解析赛程信息，人工确认后入库
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">点击上传赛程文件</p>
                <p className="text-xs text-muted-foreground mt-1">支持 .txt、.docx 格式；不支持 PDF、图片、.doc 旧格式</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {parsing && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>AI正在解析赛程文件...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========== 二、赛程列表 ========== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                赛程列表
                <Badge variant="outline" className="text-xs ml-2">{matches.length} 场</Badge>
              </CardTitle>
              <CardDescription>查看和编辑所有赛程</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-left font-medium px-3 py-2.5 w-20">阶段</th>
                    <th className="text-left font-medium px-3 py-2.5 w-[200px]">对阵</th>
                    <th className="text-left font-medium px-3 py-2.5 w-36">时间地点</th>
                    <th className="text-center font-medium px-2 py-2.5 w-16">状态</th>
                    <th className="text-right font-medium px-3 py-2.5 w-64">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMatches.map((m) => {
                    const status = STATUS_LABEL[m.status]
                    const dt = parseDateTime(m.time)
                    const homeScore = m.homeScore ?? 0
                    const awayScore = m.awayScore ?? 0
                    const isFinished = m.status === 'finished'
                    const homeWin = isFinished && homeScore > awayScore
                    const awayWin = isFinished && awayScore > homeScore
                    return (
                      <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2.5 align-middle">
                          <Badge variant="outline" className="text-xs">
                             {m.stage === 'group' ? m.groupName : '淘汰赛'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <div className="space-y-1">
                            {/* 主队行 */}
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'font-medium text-sm min-w-0 truncate flex-1',
                                  isFinished && (homeWin ? 'text-red-600' : awayWin ? 'text-muted-foreground' : '')
                                )}
                              >
                                {getTeamName(teams, m.homeTeamId)}
                              </span>
                              {isFinished ? (
                                <span className="shrink-0 px-2 py-0.5 text-xs font-bold tabular-nums rounded-md bg-gray-100 text-gray-700 min-w-[32px] text-center">
                                  {homeScore}
                                </span>
                              ) : null}
                            </div>
                            {/* 客队行 */}
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'font-medium text-sm min-w-0 truncate flex-1',
                                  isFinished && (awayWin ? 'text-red-600' : homeWin ? 'text-muted-foreground' : '')
                                )}
                              >
                                {getTeamName(teams, m.awayTeamId)}
                              </span>
                              {isFinished ? (
                                <span className="shrink-0 px-2 py-0.5 text-xs font-bold tabular-nums rounded-md bg-gray-100 text-gray-700 min-w-[32px] text-center">
                                  {awayScore}
                                </span>
                              ) : (
                                <span className="shrink-0 text-xs text-muted-foreground font-medium">vs</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <div className="space-y-0.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              <span>{dt.date}</span>
                            </div>
                            {dt.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="size-3" />
                                <span>{dt.time}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-1">
                              <MapPin className="size-3 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{m.venue}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 align-middle text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-medium px-2.5 py-1 rounded-full',
                              status.className
                            )}
                          >
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 flex-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 shrink-0"
                              onClick={() => setEditingMatch(m)}
                            >
                              <Edit2 className="size-3.5" />
                              更改
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => openResultEntry(m)}
                            >
                              <Trophy className="size-3.5" />
                              录入结果
                            </Button>
                            {m.status === 'finished' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-primary"
                                onClick={() => generateArticle(m.id)}
                                disabled={aiGenerating === m.id}
                              >
                                <Sparkles className="size-3.5" />
                                {aiGenerating === m.id ? '生成中...' : '生成文稿'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* ========== 三、结果录入表单 ========== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                比赛结果录入
              </CardTitle>
              <CardDescription>
                录入比分、进球记录和红黄牌信息，提交后自动更新积分榜和球员停赛状态
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedMatchForResult ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">请先在上方赛程列表中选择一场比赛，点击「录入结果」</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div className="font-medium">
                      {getTeamName(teams, selectedMatchForResult.homeTeamId)} vs{' '}
                      {getTeamName(teams, selectedMatchForResult.awayTeamId)}
                    </div>
                    <Badge variant="outline">{selectedMatchForResult.time}</Badge>
                  </div>

                  {/* 比分 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>主队比分</Label>
                      <Input
                        type="number"
                        min="0"
                        value={resultForm.homeScore}
                        onChange={(e) => setResultForm({ ...resultForm, homeScore: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="text-center text-2xl font-bold text-muted-foreground">VS</div>
                    <div className="space-y-2">
                      <Label>客队比分</Label>
                      <Input
                        type="number"
                        min="0"
                        value={resultForm.awayScore}
                        onChange={(e) => setResultForm({ ...resultForm, awayScore: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* 进球记录 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">进球记录</Label>
                      <Button variant="secondary" size="sm" className="gap-1 h-7" onClick={addGoal}>
                        <Plus className="size-3.5" />
                        添加进球
                      </Button>
                    </div>
                    {resultForm.goals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无进球记录</p>
                    ) : (
                      <div className="space-y-2">
                        {resultForm.goals.map((g, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                            <Select
                              value={g.teamId}
                              onValueChange={(v) => updateGoal(idx, 'teamId', v)}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="t1">主队</SelectItem>
                                <SelectItem value="t2">客队</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={g.playerId}
                              onValueChange={(v) => updateGoal(idx, 'playerId', v)}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs">
                                <SelectValue placeholder="选择球员" />
                              </SelectTrigger>
                              <SelectContent>
                                {players.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} ({p.number}号)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 w-20">
                              <Input
                                type="number"
                                min="0"
                                max="120"
                                value={g.minute || ''}
                                onChange={(e) => updateGoal(idx, 'minute', parseInt(e.target.value) || 0)}
                                className="h-8 text-xs"
                                placeholder="分钟"
                              />
                              <span className="text-xs text-muted-foreground">'</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeGoal(idx)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 红黄牌记录 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">红黄牌记录</Label>
                      <Button variant="secondary" size="sm" className="gap-1 h-7" onClick={addCard}>
                        <Plus className="size-3.5" />
                        添加判罚
                      </Button>
                    </div>
                    {resultForm.cards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无红黄牌记录</p>
                    ) : (
                      <div className="space-y-2">
                        {resultForm.cards.map((c, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                            <Select
                              value={c.teamId}
                              onValueChange={(v) => updateCard(idx, 'teamId', v)}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="t1">主队</SelectItem>
                                <SelectItem value="t2">客队</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={c.type}
                              onValueChange={(v) => updateCard(idx, 'type', v)}
                            >
                              <SelectTrigger className="w-20 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yellow">黄牌</SelectItem>
                                <SelectItem value="red">红牌</SelectItem>
                                <SelectItem value="second_yellow">两黄</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={c.playerId}
                              onValueChange={(v) => updateCard(idx, 'playerId', v)}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs">
                                <SelectValue placeholder="选择球员" />
                              </SelectTrigger>
                              <SelectContent>
                                {players.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} ({p.number}号)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 w-20">
                              <Input
                                type="number"
                                min="0"
                                max="120"
                                value={c.minute || ''}
                                onChange={(e) => updateCard(idx, 'minute', parseInt(e.target.value) || 0)}
                                className="h-8 text-xs"
                                placeholder="分钟"
                              />
                              <span className="text-xs text-muted-foreground">'</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeCard(idx)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setSelectedMatchForResult(null)}>
                      取消
                    </Button>
                    <Button onClick={submitResult}>确认提交</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ========== 四、纪实文稿管理 ========== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                纪实文稿管理
                <Badge variant="outline" className="text-xs ml-2">{articles.length} 篇</Badge>
              </CardTitle>
              <CardDescription>
                管理赛事纪实文稿，审核AI生成草稿，发布后全赛区可见
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {articles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无文稿，可在已结束比赛中点击「生成文稿」</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {articles.map((article) => {
                    const match = matches.find((m) => m.id === article.matchId)
                    return (
                      <div key={article.id} className="p-4 hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-foreground">
                                {article.title}
                              </h4>
                              <Badge
                                variant={article.status === 'published' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {article.status === 'published' ? '已发布' : '草稿'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Trophy className="size-3" />
                                绑定：
                                {match
                                  ? `${getTeamName(teams, match.homeTeamId)} vs ${getTeamName(teams, match.awayTeamId)}`
                                  : article.matchId}
                              </span>
                              <span>创建：{article.createdAt}</span>
                              <span>评论：{article.comments?.length || 0}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {article.content.replace(/[#*\-\n`]/g, ' ').slice(0, 120)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => setViewingArticle(article)}
                            >
                              <Eye className="size-3.5" />
                              查看全文
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => {
                                setEditingArticle(article)
                                setEditTitle(article.title)
                                setEditContent(article.content)
                              }}
                            >
                              <Edit2 className="size-3.5" />
                              编辑
                            </Button>
                            <Button
                              variant={article.status === 'published' ? 'secondary' : 'default'}
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => togglePublish(article)}
                            >
                              {article.status === 'published' ? (
                                <><X className="size-3.5" />取消发布</>
                              ) : (
                                <><Check className="size-3.5" />发布</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 解析结果弹窗 */}
      <Dialog open={parseDialogOpen} onOpenChange={setParseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              AI解析结果（草稿）
            </DialogTitle>
            <DialogDescription>
              以下是AI从文件中解析出的赛程信息，请核对修改后确认入库
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {parsedMatches.map((pm, idx) => (
              <Card key={pm.key} className="border-dashed">
                <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">时间</Label>
                      <Input
                        value={pm.time}
                        onChange={(e) => {
                          const updated = [...parsedMatches]
                          updated[idx].time = e.target.value
                          setParsedMatches(updated)
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">主队</Label>
                      <Input
                        value={pm.homeTeam}
                        onChange={(e) => {
                          const updated = [...parsedMatches]
                          updated[idx].homeTeam = e.target.value
                          setParsedMatches(updated)
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">客队</Label>
                      <Input
                        value={pm.awayTeam}
                        onChange={(e) => {
                          const updated = [...parsedMatches]
                          updated[idx].awayTeam = e.target.value
                          setParsedMatches(updated)
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">地点</Label>
                      <Input
                        value={pm.venue}
                        onChange={(e) => {
                          const updated = [...parsedMatches]
                          updated[idx].venue = e.target.value
                          setParsedMatches(updated)
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">阶段</Label>
                      <Select
                        value={pm.stage}
                        onValueChange={(v) => {
                          const updated = [...parsedMatches]
                          updated[idx].stage = v
                          updated[idx].stageLabel = v === 'group' ? '小组赛' : '淘汰赛'
                          setParsedMatches(updated)
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">小组赛</SelectItem>
                          <SelectItem value="knockout">淘汰赛</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setParseDialogOpen(false)}>取消</Button>
            <Button onClick={confirmParsedMatches}>
              <Check className="size-4 mr-1" />
              确认入库 ({parsedMatches.length}场)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 赛程编辑弹窗 */}
      <Dialog open={!!editingMatch} onOpenChange={(o) => !o && setEditingMatch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑赛程</DialogTitle>
            <DialogDescription>修改比赛时间、地点和对阵队伍</DialogDescription>
          </DialogHeader>
          {editingMatch && (
            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>时间</Label>
                                <Input
                                  value={editingMatch.time}
                                  onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>地点</Label>
                <Input
                  value={editingMatch.venue}
                  onChange={(e) => setEditingMatch({ ...editingMatch, venue: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>主队</Label>
                  <Select
                    value={editingMatch.homeTeamId}
                    onValueChange={(v) => setEditingMatch({ ...editingMatch, homeTeamId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={`t${t.id}`}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>客队</Label>
                  <Select
                    value={editingMatch.awayTeamId}
                    onValueChange={(v) => setEditingMatch({ ...editingMatch, awayTeamId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={`t${t.id}`}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMatch(null)}>取消</Button>
            <Button onClick={saveMatchEdit}>
              <Save className="size-4 mr-1" />
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看文稿全文 */}
      <Dialog open={!!viewingArticle} onOpenChange={(o) => !o && setViewingArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingArticle?.title}</DialogTitle>
            <DialogDescription>
              {viewingArticle?.status === 'published' ? `创建时间：${viewingArticle.createdAt}` : '草稿状态'}
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-line text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-lg">
            {viewingArticle?.content}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewingArticle(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑文稿 */}
      <Dialog open={!!editingArticle} onOpenChange={(o) => !o && setEditingArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑文稿</DialogTitle>
            <DialogDescription>修改标题和内容，保存后生效</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>标题</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>内容</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingArticle(null)}>取消</Button>
            <Button onClick={saveArticleEdit}>
              <Save className="size-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
