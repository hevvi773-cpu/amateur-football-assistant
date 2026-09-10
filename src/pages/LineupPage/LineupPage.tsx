import { useState, useMemo } from 'react'
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
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Lock, Shield, AlertTriangle, Sparkles, Crown, Plus, X, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useApp, getPlayerName } from '@/context/AppContext'
import { FORMATION_DEFS, ILineupSlot } from '@/data/lineup'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import AssociationPanel from './AssociationPanel'

export default function LineupPage() {
  const { currentRole, lineup, setLineup, players, addMessage } = useApp()
  const isCaptain = currentRole === 'captain'

  const healthLabel: Record<string, string> = {
    healthy: '健康',
    tired: '疲劳',
    minor_injury: '轻伤',
    injured: '伤病',
  }

  // 当前阵型
  const currentFormation = FORMATION_DEFS.find((f) => f.key === lineup.formation) || FORMATION_DEFS[0]

  // 选中要编辑的位置（打开选人弹窗）
  const [editingSlot, setEditingSlot] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiReason, setShowAiReason] = useState(false)
  const [aiReason, setAiReason] = useState('')

  // 可选球员列表（用于选人弹窗）
  const availablePlayers = useMemo(() => {
    const usedInStarting = new Set(lineup.slots.filter((s) => s.playerId).map((s) => s.playerId!))
    return players.filter((p) => !usedInStarting.has(p.id))
  }, [players, lineup.slots])

  // 协会身份 - 显示赛事管理面板（必须在所有hooks之后）
  if (currentRole === 'association') {
    return <AssociationPanel />
  }

  // 切换阵型：保留已有球员，空位按新阵型补
  const handleFormationChange = (newFormation: string) => {
    const def = FORMATION_DEFS.find((f) => f.key === newFormation)
    if (!def) return

    // 收集当前已上场球员
    const usedPlayerIds = lineup.slots.filter((s) => s.playerId).map((s) => s.playerId!)

    // 新阵型按位置顺序填充球员：前锋线先取前锋，中场取中场，后卫取后卫
    const newSlots: ILineupSlot[] = def.slots.map((s, idx) => {
      const slot: ILineupSlot = { ...s, playerId: undefined }
      // 优先复用已上场球员，按索引匹配
      if (usedPlayerIds[idx]) {
        slot.playerId = usedPlayerIds[idx]
      }
      return slot
    })

    // 从替补席补充剩余空位（如果有的话）
    let subIdx = 0
    for (let i = 0; i < newSlots.length; i++) {
      if (!newSlots[i].playerId && subIdx < lineup.substitutes.length) {
        newSlots[i].playerId = lineup.substitutes[subIdx]
        subIdx++
      }
    }

    setLineup({
      ...lineup,
      formation: newFormation,
      slots: newSlots,
      substitutes: lineup.substitutes.slice(subIdx),
    })

    toast.success(`已切换为 ${newFormation} 阵型`)
  }

  // 一键AI推荐阵容
  const handleAIRecommend = async () => {
    setAiLoading(true)
    await new Promise((r) => setTimeout(r, 1500))

    // AI智能分配：按位置类型匹配球员
    const forwards = players.filter((p) => p.position === '前锋' && !p.isSuspended)
    const midfielders = players.filter((p) => p.position === '中场' && !p.isSuspended)
    const defenders = players.filter((p) => p.position === '后卫' && !p.isSuspended)
    const goalkeepers = players.filter((p) => p.position === '门将' && !p.isSuspended)

    const def = currentFormation
    const usedIds = new Set<string>()
    const newSlots: ILineupSlot[] = def.slots.map((slotDef) => {
      const s: ILineupSlot = { ...slotDef, playerId: undefined }
      let pool: typeof players

      if (slotDef.position === 'GK') {
        pool = goalkeepers
      } else if (slotDef.row >= 3) {
        pool = defenders
      } else if (slotDef.row >= 2) {
        pool = midfielders
      } else {
        pool = forwards
      }

      // 选一个健康状态好的
      const healthOrder: Record<string, number> = { healthy: 0, tired: 1, minor_injury: 2, injured: 3 }
      const sorted = pool
        .filter((p) => !usedIds.has(p.id))
        .sort((a, b) => (healthOrder[a.healthStatus] ?? 9) - (healthOrder[b.healthStatus] ?? 9))

      if (sorted.length > 0) {
        s.playerId = sorted[0].id
        usedIds.add(sorted[0].id)
      }

      return s
    })

    setLineup({
      ...lineup,
      slots: newSlots,
      substitutes: players
        .filter((p) => !newSlots.some((s) => s.playerId === p.id) && !p.isSuspended)
        .slice(0, 5)
        .map((p) => p.id),
    })

    // 生成AI推荐理由
    const reasonText = `【AI推荐阵容说明】

阵型选择：${def.label}

一、阵型选择依据

  基于当前对手的战术风格和我方球员特点，推荐使用 ${def.label} 阵型。该阵型攻守平衡，能够充分发挥边路进攻优势，同时保证中场控制力。

二、各位置人选依据

门将：选择身体状态最佳的门将，确保球门稳定。

后卫线：优先选择健康状态良好、比赛经验丰富的后卫球员，注重防守稳定性和出球能力。

中场：选择跑动积极、覆盖面广的中场球员，加强中场逼抢和前后场串联。

前锋线：选择得分能力强、状态火热的前锋球员，确保进攻端威胁。

三、针对性安排

• 边路进攻：利用对方边后卫助攻身后空档，主打右路进攻
• 中场控制：三人中场加强逼抢力度，压缩对方持球空间
• 防守稳固：边后卫内收保护中路，定位球防守盯人为主
• 体能保障：优先选择健康状态良好的球员，确保全场续航

四、替补席策略

  替补席保留5名状态良好的轮换球员，可根据比赛走势进行针对性调整。建议下半场60分钟后考虑换人调整，保持前场冲击力。

五、注意事项

• 已自动排除所有停赛球员，确保阵容合规
• 优先选择健康状态为"健康"的球员首发
• 轻伤球员列入替补，视情况使用
• 疲劳球员适当调整出场时间

* 以上推荐由AI综合分析生成，仅供队长参考，最终排兵布阵请结合实际情况决定。`
    setAiReason(reasonText)
    setShowAiReason(true)

    setAiLoading(false)
    toast.success('AI推荐阵容已应用')
  }

  // 发布阵容
  const handlePublish = async () => {
    const filled = lineup.slots.filter((s) => s.playerId).length
    if (filled < 11) {
      toast.warning('首发阵容未填满，至少需要11人')
      return
    }
    await new Promise((r) => setTimeout(r, 500))
    setLineup({ ...lineup, status: 'published' })
    addMessage({
      type: 'lineup',
      title: '出场阵容已发布',
      content: `队长已发布本场比赛出场阵容（${lineup.formation}），请查收。`,
      relatedId: lineup.matchId,
    })
    toast.success('阵容已发布，已推送通知给队员')
  }

  // 选择球员填入位置
  const handleSelectPlayer = (playerId: string) => {
    if (editingSlot === null) return
    const newSlots = [...lineup.slots]
    const prevPlayerId = newSlots[editingSlot].playerId

    // 如果目标球员已在其他位置，先清除
    const existingIdx = newSlots.findIndex((s) => s.playerId === playerId)
    if (existingIdx !== -1 && existingIdx !== editingSlot) {
      newSlots[existingIdx].playerId = prevPlayerId
    } else {
      // 原球员回替补
      if (prevPlayerId && !lineup.substitutes.includes(prevPlayerId)) {
        setLineup({
          ...lineup,
          slots: newSlots.map((s, i) =>
            i === editingSlot ? { ...s, playerId } : s
          ),
          substitutes: [...lineup.substitutes, prevPlayerId],
        })
        setEditingSlot(null)
        return
      }
    }

    newSlots[editingSlot] = { ...newSlots[editingSlot], playerId }
    setLineup({ ...lineup, slots: newSlots })
    setEditingSlot(null)
  }

  // 移除位置上的球员
  const handleRemovePlayer = () => {
    if (editingSlot === null) return
    const newSlots = [...lineup.slots]
    const removedId = newSlots[editingSlot].playerId
    newSlots[editingSlot].playerId = undefined

    const newSubs = removedId ? [...lineup.substitutes, removedId] : lineup.substitutes
    setLineup({ ...lineup, slots: newSlots, substitutes: newSubs })
    setEditingSlot(null)
  }

  const filledCount = lineup.slots.filter((s) => s.playerId).length
  const suspendedCount = lineup.slots.filter((s) => {
    if (!s.playerId) return false
    const p = players.find((pl) => pl.id === s.playerId)
    return p?.isSuspended
  }).length

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">出场阵容</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isCaptain ? '编排首发阵容，调整替补席' : '查看本场比赛出场安排'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => aiReason && setShowAiReason(!showAiReason)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  aiReason
                    ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer'
                    : 'bg-secondary text-secondary-foreground border-transparent cursor-default'
                )}
                disabled={!aiReason}
              >
                {aiReason ? 'AI推荐阵容' : 'AI推荐阵容'}
              </button>
              {isCaptain && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1"
                    onClick={handleAIRecommend}
                    disabled={aiLoading}
                  >
                    <Sparkles className="size-4" />
                    {aiLoading ? '生成中...' : '一键应用推荐阵容'}
                  </Button>
                  {lineup.status !== 'published' ? (
                    <Button size="sm" onClick={handlePublish}>发布阵容</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setLineup({ ...lineup, status: 'draft' })}>
                      取消发布
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {currentRole === 'visitor' ? (
            <Card className="border-dashed">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <Lock className="size-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">阵容信息仅本队成员可见</p>
                <p className="text-sm text-muted-foreground mt-1">切换为「普通队员」或「队长」身份后查看</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 阵型图 - 左侧主区域 */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-gradient-to-b from-green-700 to-green-800 text-white overflow-hidden">
                  <CardContent className="p-4 md:p-6">
                    {/* 阵型选择 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="size-5 opacity-80" />
                        <span className="font-semibold">阵型选择</span>
                      </div>
                      <Select
                        value={lineup.formation}
                        onValueChange={handleFormationChange}
                        disabled={!isCaptain}
                      >
                        <SelectTrigger className="w-32 h-8 text-sm bg-white/10 border-white/20 text-white [&>span]:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMATION_DEFS.map((f) => (
                            <SelectItem key={f.key} value={f.key}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 阵容统计 */}
                    <div className="flex items-center gap-4 text-sm mb-4 text-white/80">
                      <span>首发：{filledCount}/11</span>
                      {suspendedCount > 0 && (
                        <span className="text-red-300 flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          含停赛：{suspendedCount}人
                        </span>
                      )}
                    </div>

                    {/* 阵型图 */}
                    <div className="relative bg-green-600/40 rounded-xl border border-white/20 aspect-[4/5] md:aspect-[16/10] p-4 md:p-8">
                      {/* 中圈线 */}
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-20 md:size-28 rounded-full border border-white/20" />

                      {/* 禁区线 */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-1/2 h-1/6 border-x border-b border-white/20" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1/2 h-1/6 border-x border-t border-white/20" />

                      {/* 球员位置 */}
                      {currentFormation.slots.map((slotDef, idx) => {
                        const slot = lineup.slots[idx]
                        const player = slot?.playerId ? players.find((p) => p.id === slot.playerId) : null
                        const isSuspended = player?.isSuspended

                        return (
                          <div
                            key={slotDef.position}
                            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: `${(slotDef.col / 4) * 100}%`,
                                top: `${((5 - slotDef.row) / 4.5) * 100 + 5}%`,
                              }}
                          >
                            <button
                              className={cn(
                                'size-10 md:size-12 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                                player
                                  ? isSuspended
                                    ? 'bg-red-500/80 border-red-300 text-white cursor-pointer'
                                    : 'bg-white text-green-800 border-green-400 hover:scale-110 cursor-pointer shadow-lg'
                                  : isCaptain
                                  ? 'bg-white/20 border-white/40 border-dashed hover:bg-white/30 cursor-pointer'
                                  : 'bg-white/10 border-white/20 border-dashed cursor-default'
                              )}
                              onClick={() => isCaptain && setEditingSlot(idx)}
                              disabled={!isCaptain}
                            >
                              {player ? (
                                player.number
                              ) : (
                                <Plus className="size-5" />
                              )}
                            </button>
                            <div className="text-center">
                              <div className="text-[10px] md:text-xs font-medium leading-tight">
                                {player ? player.name : slotDef.posLabel}
                              </div>
                              {player && isSuspended && (
                                <div className="text-[9px] text-red-200">停赛</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* AI推荐理由面板 */}
                {aiReason && showAiReason && (
                  <Card className="border-dashed border-primary/50 bg-primary/[0.03]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="size-4 text-primary" />
                          AI推荐理由
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setShowAiReason(false)}
                        >
                          收起
                          <ChevronUp className="size-3" />
                        </Button>
                      </div>
                      <CardDescription>基于球员状态、位置能力和对手分析的智能推荐说明</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-line text-sm text-foreground/90 bg-card/60 rounded-lg p-4 max-h-[400px] overflow-y-auto leading-relaxed border border-border/50">
                        {aiReason}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 替补席 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">替补席 ({lineup.substitutes.length}人)</CardTitle>
                    <CardDescription>点击球员可替换到场上位置</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {lineup.substitutes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">暂无替补球员</p>
                      ) : (
                        lineup.substitutes.map((pid) => {
                          const p = players.find((pl) => pl.id === pid)
                          if (!p) return null
                          return (
                            <div
                              key={pid}
                              className={cn(
                                'flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm',
                                isCaptain && 'hover:bg-muted cursor-pointer',
                                p.isSuspended && 'opacity-60'
                              )}
                              onClick={() => {
                                if (!isCaptain) return
                                // 找第一个空位放入
                                const emptyIdx = lineup.slots.findIndex((s) => !s.playerId)
                                if (emptyIdx === -1) {
                                  toast.info('首发已满，请先移除一名球员')
                                  return
                                }
                                const newSlots = [...lineup.slots]
                                newSlots[emptyIdx].playerId = pid
                                setLineup({
                                  ...lineup,
                                  slots: newSlots,
                                  substitutes: lineup.substitutes.filter((x) => x !== pid),
                                })
                              }}
                            >
                              <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                {p.number}
                              </span>
                              <span className="font-medium">{p.name}</span>
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">{p.position}</Badge>
                              {p.isSuspended && <Badge variant="destructive" className="text-[10px] h-5">停赛</Badge>}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 球员列表 - 右侧边栏 */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">队员名单</CardTitle>
                    <CardDescription>共 {players.length} 人</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto">
                      {players.map((p) => {
                        const isStarting = lineup.slots.some((s) => s.playerId === p.id)
                        const isSub = lineup.substitutes.includes(p.id)
                        return (
                          <div
                            key={p.id}
                            className={cn(
                              'px-3 py-2 border-b border-border/50 last:border-0 flex items-center gap-2',
                              p.isSuspended && 'opacity-60'
                            )}
                          >
                            <div className="size-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                              {p.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium flex items-center gap-1.5">
                                {p.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {p.position} · {healthLabel[p.healthStatus] || p.healthStatus}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              {p.yellowCards > 0 && (
                                <div className="text-[10px] text-yellow-600 flex items-center gap-0.5">
                                  <span className="size-2 bg-yellow-400 rounded-sm inline-block" />
                                  {p.yellowCards}
                                </div>
                              )}
                              {p.isSuspended && (
                                <Badge variant="destructive" className="text-[10px] h-4 px-1">停赛</Badge>
                              )}
                              {isStarting && (
                                <Badge className="text-[10px] h-4 px-1 bg-green-600">首发</Badge>
                              )}
                              {isSub && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1">替补</Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 选人弹窗 */}
      <Dialog open={editingSlot !== null} onOpenChange={(o) => !o && setEditingSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              选择球员 — {editingSlot !== null && (currentFormation.slots[editingSlot]?.posLabel || '')}
            </DialogTitle>
            <DialogDescription>
              从列表中选择一名球员填入该位置
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6 space-y-1">
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">没有可用球员</p>
            ) : (
              availablePlayers.map((p) => {
                const currentSlot = editingSlot !== null ? lineup.slots[editingSlot] : null
                const isCurrent = currentSlot?.playerId === p.id
                return (
                  <button
                    key={p.id}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors',
                      isCurrent
                        ? 'border-primary bg-primary/5'
                        : p.isSuspended
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onClick={() => {
                      if (!p.isSuspended) handleSelectPlayer(p.id)
                    }}
                    disabled={p.isSuspended}
                  >
                    <div className="size-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {p.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {p.name}
                        {p.isSuspended && <span className="text-xs text-red-500 ml-1">（停赛不可选）</span>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{p.position}</span>
                        <span>·</span>
                        <span>{healthLabel[p.healthStatus] || p.healthStatus}</span>
                        {p.yellowCards > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-yellow-600">{p.yellowCards}黄</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-primary font-medium">当前</div>
                    )}
                  </button>
                )
              })
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingSlot !== null && lineup.slots[editingSlot]?.playerId && (
              <Button variant="destructive" size="sm" onClick={handleRemovePlayer} className="gap-1">
                <X className="size-4" />
                移除该球员
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditingSlot(null)}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
