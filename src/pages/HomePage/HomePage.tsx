import { useState, useMemo, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Trophy, Clock, MapPin, Zap, FileText, Crown, User, Lock, Swords, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react'
import { useApp, getTeamName } from '@/context/AppContext'
import { IMatch } from '@/data/matches'
import * as api from '@/lib/api'
import ExpandableMatchList from './ExpandableMatchList'
import { extractSummary } from './MatchCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// 生成AI赛前战术攻略内容
function buildTacticContent(match: IMatch, teams: { id: string; name: string; group: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number; logoUrl: string }[]): string {
  const homeName = getTeamName(teams, match.homeTeamId)
  const awayName = getTeamName(teams, match.awayTeamId)
  return `【AI赛前战术攻略】

对阵：${homeName} vs ${awayName}
比赛场地：${match.venue}

━━━━━━━━━━━━━━━━━━

一、对手分析

1. 整体风格
  ${awayName}近期主打4-2-3-1阵型，以控球进攻为主，边路突破是其主要进攻手段。球队场均控球率56%，场均射门12.3次。

2. 进攻特点
  • 左路进攻占比45%，右边锋速度快、内切射门能力强
  • 定位球威胁大，角球进球率18%
  • 反击效率高，场均反击射门3.2次

3. 防守弱点
  • 两名中后卫转身偏慢，身后球防守薄弱
  • 后腰位置覆盖面积有限，肋部空间可利用
  • 门将出击时机判断偶有失误

━━━━━━━━━━━━━━━━━━

二、战术建议

1. 阵型推荐：4-3-3
  利用边路速度压制对方边后卫助攻，中场三人组加强逼抢力度。

2. 进攻策略
  • 主打右路进攻，针对对方左后卫助攻身后空档
  • 多打地面配合渗透，避免长传冲吊
  • 前场高位逼抢，争取在对方半场断球反击
  • 角球战术可设计战术配合，不要一味找高点

3. 防守策略
  • 中场防线整体前移，压缩对方持球空间
  • 边后卫内收保护中路，边路交给边锋回追
  • 定位球防守盯人为主，重点看防对方5号中后卫

━━━━━━━━━━━━━━━━━━

三、关键球员提醒

我方重点球员：
• 9号 吴磊（中锋）：支点作用明显，需中场更多支援
• 7号 孙浩（前腰）：技术细腻，负责组织进攻串联
• 2号 李强（右后卫）：助攻能力强，可压上参与进攻

对方危险人物：
• 10号 核心前腰：创造力强，需后腰贴身盯防
• 7号 右边锋：速度快，注意协防保护
• 5号 中后卫：定位球进攻威胁大

━━━━━━━━━━━━━━━━━━

四、赛程与体能

• ${awayName}近5场3胜1平1负，状态稳定
• 对方上一场比赛较晚结束，体能可能处于劣势
• 我方主场作战，以逸待劳，建议上半场加强进攻节奏

━━━━━━━━━━━━━━━━━━

五、预案提醒

• 若先丢球：保持冷静，加强中场控球，耐心寻找机会
• 若领先一球：不要回缩防守，持续给对方压力
• 若久攻不下：考虑换人调整，利用替补冲击对方防线

* 本战术攻略由AI生成，仅供教练组参考，实际战术请结合现场情况调整。`
}

// 生成全队AI总结内容
function buildTeamSummary(reviews: { authorRole: string }[]): string {
  const memberCount = reviews.filter((r) => r.authorRole === 'member').length
  const captainCount = reviews.filter((r) => r.authorRole === 'captain').length
  return `【全队赛后感想AI综合提炼】

一、整体评价

本次比赛全队共提交 ${reviews.length} 份赛后感想（队员 ${memberCount} 份、队长 ${captainCount} 份）。整体来看，球队在进攻端表现积极，中场衔接流畅，防守端基本稳定，但体能和细节方面仍有提升空间。

二、亮点总结

1. 进攻端：边路进攻打得很开，传球到位率高，创造了多次得分机会
2. 中场：组织有序，后腰防守覆盖到位，前后场串联效果好
3. 团队配合：整体跑动积极，接应点多，战术执行度较高
4. 防守端：失误控制不错，关键防守到位率高

三、问题反思

1. 体能：下半场后半段体能明显下降，导致防守强度降低
2. 定位球：角球进攻效率偏低，需要加强战术设计
3. 细节：门前把握机会能力有待提高，错失几次必进球
4. 轮换：替补深度不足，主力球员体能消耗过大

四、改进建议

1. 训练方面：加强有氧训练，提升全场续航能力
2. 战术方面：丰富定位球进攻套路，增加变化
3. 人员方面：考虑增加替补轮换，保持阵容厚度
4. 心理方面：领先时保持专注度，避免放松

五、队长关注点

队长特别强调了全队跑动积极性和防守端的表现，鼓励继续保持状态，同时指出需要在细节和体能方面下功夫，争取更好的成绩。

* 以上为AI对全队赛后感想的综合提炼，供教练组参考。`
}

export default function HomePage() {
  const { matches, teams, reviews, players, isTeamMember, currentTeamId } = useApp()
  const [stageFilter, setStageFilter] = useState('all')
  const [aiContent, setAiContent] = useState<{ matchId: string; type: 'prediction' | 'preview'; content: string } | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  // 每场上AI赛前战术攻略 - 优先调后端接口，失败时用本地模板兜底
  const [tacticContents, setTacticContents] = useState<Record<string, string>>({})
  const [tacticExpanded, setTacticExpanded] = useState<Record<string, boolean>>({})

  // 全队AI总结 - 优先调后端 review-summary 接口，失败时本地兜底
  const [teamSummaryContent, setTeamSummaryContent] = useState('')

  useEffect(() => {
    const upcoming = matches.filter((m) => m.status === 'upcoming')
    const contents: Record<string, string> = {}
    upcoming.forEach((m) => {
      contents[m.id] = buildTacticContent(m, teams)
    })
    setTacticContents(contents)

    // 后端可达时，用真实 AI 攻略覆盖本地模板
    if (upcoming.length > 0) {
      Promise.allSettled(
        upcoming.map((m) => api.fetchTactics(m.id))
      ).then((results) => {
        const updated: Record<string, string> = { ...contents }
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            const data = result.value as { summary?: string; sections?: Record<string, string> }
            const sectionText = data.sections ? Object.entries(data.sections).map(([k, v]) => `${k}\n${v}`).join('\n\n') : ''
            updated[upcoming[idx].id] = `${data.summary ?? ''}${sectionText ? `\n\n${sectionText}` : ''}`
          }
        })
        setTacticContents(updated)
      })
    }
  }, [matches, teams])

  // 本队最近一场已结束比赛（感想归属），无则复盘区显示空态
  const myFinishedMatch = useMemo(() => {
    return matches
      .filter((m) => (m.homeTeamId === currentTeamId || m.awayTeamId === currentTeamId) && m.status === 'finished')
      .sort((a, b) => b.time.localeCompare(a.time))[0]
  }, [matches, currentTeamId])

  // 仅展示当前所属球队最近一场已结束比赛的赛后感想
  const myMatchReviews = useMemo(() => {
    if (!myFinishedMatch) return []
    return reviews.filter((r) => r.matchId === myFinishedMatch.id)
  }, [reviews, myFinishedMatch])

  // 全队赛后感想AI总结
  useEffect(() => {
    if (myMatchReviews.length === 0 || !myFinishedMatch) {
      setTeamSummaryContent('')
      return
    }
    setTeamSummaryContent(buildTeamSummary(myMatchReviews))
    api
      .fetchReviewSummary(myFinishedMatch.id)
      .then((data) => {
        const summary = (data as { summary?: string }).summary
        if (summary) setTeamSummaryContent(summary)
      })
      .catch(() => undefined)
  }, [myMatchReviews, myFinishedMatch])

  // 赛程排序：未开赛/进行中在前，已结束按时间倒序（最新在前）
  const sortMatches = (list: IMatch[]) => {
    const statusOrder: Record<string, number> = { upcoming: 0, ongoing: 1, finished: 2 }
    return [...list].sort((a, b) => {
      const sa = statusOrder[a.status] ?? 3
      const sb = statusOrder[b.status] ?? 3
      if (sa !== sb) return sa - sb
      return b.time.localeCompare(a.time)
    })
  }

  const filteredMatches = useMemo(() => {
    return sortMatches(matches.filter((m) => stageFilter === 'all' || m.stage === stageFilter))
  }, [matches, stageFilter])

  const myTeamMatches = useMemo(() => {
    return sortMatches(matches.filter((m) => m.homeTeamId === currentTeamId || m.awayTeamId === currentTeamId))
  }, [matches, currentTeamId])

  const groupA = teams.filter((t) => t.group === 'A组').sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
  const groupB = teams.filter((t) => t.group === 'B组').sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
  const leagueTeams = teams.filter((t) => t.group === '学院联赛').sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)

  const getPlayerNameById = (pid: string) => {
    const player = players.find((item) => item.id === pid || item.id === pid.replace(/^p/, ''))
    return player?.name || pid
  }

  // AI生成（预测/攻略弹窗）- 优先后端，失败本地模板
  const generateAI = async (matchId: string, type: 'prediction' | 'preview') => {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return
    const homeName = getTeamName(teams, match.homeTeamId)
    const awayName = getTeamName(teams, match.awayTeamId)

    if (type === 'prediction') {
      try {
        const data = (await api.fetchPrediction(matchId)) as {
          probabilities?: Record<string, number>
          predicted_score?: Record<string, number>
          model?: string
        }
        const probabilities = data.probabilities ?? {}
        const score = data.predicted_score ?? {}
        const content = `【AI比赛预测】\n\n对阵：${homeName} vs ${awayName}\n\n基于双方近期战绩、球员状态和历史交锋数据，机器学习模型预测结果如下：\n\n• ${homeName} 胜率：${Math.round((probabilities.home_win ?? 0) * 100)}%\n• 平局概率：${Math.round((probabilities.draw ?? 0) * 100)}%\n• ${awayName} 胜率：${Math.round((probabilities.away_win ?? 0) * 100)}%\n\n预测比分：${homeName} ${score.home ?? '-'} : ${score.away ?? '-'} ${awayName}\n\n模型：${data.model === 'ml_model' ? '已训练模型' : '启发式估算'}\n\n* 本预测仅供参考，不构成投注建议。`
        setAiContent({ matchId, type, content })
        return
      } catch {
        // 后端不可达，回落本地模板
      }
    }

    try {
      const data = (await api.fetchTactics(matchId)) as { summary?: string; sections?: Record<string, string> }
      const sectionText = data.sections ? Object.entries(data.sections).map(([k, v]) => `${k}\n${v}`).join('\n\n') : ''
      const content = `【AI赛前攻略】\n\n对阵：${homeName} vs ${awayName}\n\n${data.summary ?? ''}${sectionText ? `\n\n${sectionText}` : ''}`
      setAiContent({ matchId, type, content })
      return
    } catch {
      // 后端不可达，回落本地模板
    }

    setAiContent({
      matchId,
      type,
      content:
        type === 'prediction'
          ? `【AI比赛预测】\n\n对阵：${homeName} vs ${awayName}\n\n基于双方近期战绩、球员状态和历史交锋数据，自研机器学习模型预测结果如下：\n\n• ${homeName} 胜率：58%\n• 平局概率：27%\n• ${awayName} 胜率：15%\n\n总进球数预测：2.3球\n\n* 本预测仅供参考，不构成投注建议。`
          : `【AI赛前攻略】\n\n对阵：${homeName} vs ${awayName}\n\n一、关键对位分析\n1. 中场争夺将是胜负手，${homeName}的中场组织能力占优\n2. ${awayName}边路速度快，需注意防守身后球\n3. 定位球得分概率较高，建议加强训练\n\n二、战术建议\n• 主场作战建议主动控球，掌控比赛节奏\n• 上半场争取先声夺人，建立心理优势\n• 下半场注意体能分配，避免最后15分钟崩盘\n\n三、重点关注球员\n• ${homeName}：9号中锋状态火热，是主要得分点\n• ${awayName}：10号核心球员创造力强，需专人盯防\n\n* 本攻略由AI生成，仅供教练参考。`,
    })
  }

  const submitReview = async () => {
    if (!reviewText.trim() || !myFinishedMatch) return
    setSubmitting(true)
    try {
      await api.submitReview(myFinishedMatch.id, reviewText)
      toast.success('赛后感想已提交')
    } catch (err) {
      toast.error(`提交失败：${(err as Error).message}`)
    }
    setReviewText('')
    setReviewDialogOpen(false)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <main className="space-y-8 md:space-y-12 py-8">
        {/* 赛程区域 */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">赛程总览</h1>
                <p className="text-muted-foreground text-sm mt-1">查看全部赛程、对阵信息与AI分析</p>
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="全部赛事" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部赛事</SelectItem>
                  <SelectItem value="group">小组赛</SelectItem>
                  <SelectItem value="knockout">淘汰赛</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="my" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">全部赛程</TabsTrigger>
                <TabsTrigger value="my">本队赛程</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                <ExpandableMatchList
                  key="all"
                  matches={filteredMatches}
                  teams={teams}
                  onGenerateAI={generateAI}
                  tacticContents={tacticContents}
                  tacticExpanded={tacticExpanded}
                  onToggleTactic={(id) => setTacticExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                  currentTeamId={currentTeamId}
                />
              </TabsContent>

              <TabsContent value="my" className="space-y-3">
                <ExpandableMatchList
                  key={`my-${currentTeamId}`}
                  matches={myTeamMatches}
                  teams={teams}
                  onGenerateAI={generateAI}
                  tacticContents={tacticContents}
                  tacticExpanded={tacticExpanded}
                  onToggleTactic={(id) => setTacticExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                  currentTeamId={currentTeamId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* 积分榜 */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="size-6 text-amber-500" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">积分榜</h2>
            </div>

            <div className="space-y-6">
              {leagueTeams.length > 0 && (
                <GroupTable title="学院联赛积分榜" teams={leagueTeams} highlight />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GroupTable title="A组" teams={groupA} />
                <GroupTable title="B组" teams={groupB} />
              </div>
            </div>
          </div>
        </section>

        {/* 赛后复盘 - 仅本队可见 */}
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="size-6 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">本队赛后复盘</h2>
                {!isTeamMember && <Lock className="size-4 text-muted-foreground" />}
              </div>
              {isTeamMember && (
                <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Sparkles className="size-4" />
                      写感想
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>填写赛后感想</DialogTitle>
                      <DialogDescription>分享你对这场比赛的看法和总结，AI将为全队生成综合总结。</DialogDescription>
                    </DialogHeader>
                    <Textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="说说你对这场比赛的感受..."
                      className="min-h-[120px]"
                    />
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setReviewDialogOpen(false)} disabled={submitting}>
                        取消
                      </Button>
                      <Button onClick={submitReview} disabled={submitting || !reviewText.trim()}>
                        {submitting ? '提交中...' : '提交感想'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {!isTeamMember ? (
              <Card className="border-dashed">
                <CardContent className="py-12 flex flex-col items-center text-center">
                  <Lock className="size-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">本区域为队内私有内容</p>
                  <p className="text-sm text-muted-foreground mt-1">切换为「普通队员」或「队长」身份后可查看</p>
                </CardContent>
              </Card>
            ) : !myFinishedMatch ? (
              <Card className="border-dashed">
                <CardContent className="py-12 flex flex-col items-center text-center">
                  <FileText className="size-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">该队暂无已结束比赛，暂无可复盘内容</p>
                  <p className="text-sm text-muted-foreground mt-1">可在顶栏切换所属球队，查看其他球队的赛后复盘</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* 全队AI总结 - 默认直接展示 */}
                {teamSummaryContent ? (
                  <Card className="border-dashed border-primary/50 bg-primary/[0.03]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 text-primary" />
                          <span className="font-semibold text-sm text-foreground">全队AI综合总结</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setSummaryExpanded(!summaryExpanded)}
                        >
                          {summaryExpanded ? '收起' : '查看详情'}
                          {summaryExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </Button>
                      </div>
                      <div
                        className={cn(
                          'text-sm text-foreground bg-card/60 p-3 rounded-lg border border-border/50 overflow-hidden transition-all',
                          summaryExpanded ? 'max-h-[500px] overflow-y-auto' : 'max-h-[4.5rem]'
                        )}
                      >
                        {summaryExpanded ? (
                          <div className="whitespace-pre-line leading-relaxed">{teamSummaryContent}</div>
                        ) : (
                          <div className="whitespace-pre-line line-clamp-2 text-muted-foreground">
                            {extractSummary(teamSummaryContent, 120)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="size-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">全队AI综合总结</div>
                          <div className="text-xs text-muted-foreground">收集所有队员的赛后感想，AI综合提炼出全队统一的复盘总结</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 队员感想列表 */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span>队员感想</span>
                    <Badge variant="outline" className="text-xs">{myMatchReviews.length} 份</Badge>
                  </div>
                  {myMatchReviews.map((review) => (
                    <Card
                      key={review.id}
                      className={cn(
                        'overflow-hidden transition-all',
                        review.authorRole === 'captain' && 'border-amber-300 bg-amber-50/50'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'size-9 rounded-full flex items-center justify-center shrink-0',
                              review.authorRole === 'captain'
                                ? 'bg-amber-500 text-white'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {review.authorRole === 'captain' ? (
                              <Crown className="size-4" />
                            ) : (
                              <User className="size-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {getPlayerNameById(review.playerId)}
                              </span>
                              {review.authorRole === 'captain' && (
                                <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-100/50">
                                  队长
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">{review.createdAt}</span>
                            </div>
                            <p className="text-sm text-foreground mt-2 leading-relaxed">{review.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* AI内容弹窗（预测等） */}
      <Dialog open={!!aiContent} onOpenChange={(o) => !o && setAiContent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              {aiContent?.type === 'prediction' ? 'AI比赛预测' : 'AI赛前攻略'}
            </DialogTitle>
            <DialogDescription>
              以下内容由AI生成，仅供参考
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-line text-sm text-foreground bg-muted/50 p-4 rounded-lg max-h-[50vh] overflow-y-auto">
            {aiContent?.content}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiContent(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GroupTable({ title, teams, highlight = false }: { title: string; teams: { id: string; name: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number }[]; highlight?: boolean }) {
  return (
    <Card className={cn(highlight && 'border-primary/40 bg-primary/[0.02]')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {highlight && <CardDescription className="text-xs">427 场真实赛事纪录实时计算</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left font-medium px-4 py-2">排名</th>
                <th className="text-left font-medium px-2 py-2">球队</th>
                <th className="text-center font-medium px-2 py-2">场</th>
                <th className="text-center font-medium px-2 py-2">胜</th>
                <th className="text-center font-medium px-2 py-2">平</th>
                <th className="text-center font-medium px-2 py-2">负</th>
                <th className="text-center font-medium px-2 py-2">净胜</th>
                <th className="text-center font-medium px-4 py-2">积分</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, idx) => (
                <tr key={t.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'size-5 rounded-full flex items-center justify-center text-xs font-bold',
                      idx === 0 && 'bg-amber-400 text-white',
                      idx === 1 && 'bg-slate-400 text-white',
                      idx === 2 && 'bg-orange-400 text-white',
                      idx > 2 && 'bg-muted text-muted-foreground'
                    )}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-medium">{t.name}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{t.played}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-green-600">{t.won}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{t.drawn}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-red-500">{t.lost}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums font-bold text-primary">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
