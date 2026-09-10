import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { User, Heart, HeartPulse, Activity, Ban, Shield, Check, Plus, X, ChevronDown, Crown, Users, Building2, Eye, Trophy, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { useApp, type UserRole } from '@/context/AppContext'
import { IPlayer } from '@/data/players'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Image } from '@/components/ui/image'

const HEALTH_OPTIONS: { value: IPlayer['healthStatus']; label: string; icon: typeof Heart; color: string }[] = [
  { value: 'healthy', label: '健康', icon: Heart, color: 'text-green-600' },
  { value: 'tired', label: '疲劳', icon: Activity, color: 'text-amber-600' },
  { value: 'minor_injury', label: '轻伤', icon: HeartPulse, color: 'text-orange-600' },
  { value: 'injured', label: '伤病', icon: Ban, color: 'text-red-600' },
]

const DEFAULT_TRAITS = ['速度快', '背身拿球', '技术强', '灵活', '强壮']

const ROLE_OPTIONS: { value: UserRole; label: string; icon: typeof User; color: string }[] = [
  { value: 'member', label: '普通队员', icon: Users, color: 'text-slate-600' },
  { value: 'captain', label: '队长', icon: Crown, color: 'text-amber-600' },
  { value: 'association', label: '协会人员', icon: Building2, color: 'text-blue-600' },
  { value: 'visitor', label: '外部访客', icon: Eye, color: 'text-slate-400' },
]

export default function ProfilePage() {
  const { currentRole, players, currentPlayerId, setCurrentRole } = useApp()

  const currentPlayer = players.find((p) => p.id === currentPlayerId)

  const currentRoleOpt = ROLE_OPTIONS.find((r) => r.value === currentRole)
  const RoleIcon = currentRoleOpt?.icon || User

  if (!currentPlayer) {
    return (
      <div className="min-h-screen">
        <main className="space-y-6 py-6">
          <section className="w-full">
            <div className="max-w-3xl mx-auto px-4 md:px-6 flex items-center justify-center min-h-[50vh]">
              <p className="text-muted-foreground">未找到用户信息</p>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="space-y-6 py-6">
        <section className="w-full">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">个人中心</h1>
                <p className="text-muted-foreground text-sm mt-1">管理你的个人信息与身体状态</p>
              </div>

              {/* 身份切换 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="gap-2">
                    <RoleIcon className={cn('size-4', currentRoleOpt?.color)} />
                    <span className="text-sm">{currentRoleOpt?.label}</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isActive = currentRole === opt.value
                    return (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => {
                          setCurrentRole(opt.value)
                          toast.success(`已切换为「${opt.label}」身份`)
                        }}
                        className={cn('gap-2', isActive && 'bg-accent')}
                      >
                        <Icon className={cn('size-4', opt.color)} />
                        <span className="text-sm">{opt.label}</span>
                        {isActive && <Check className="size-3 ml-auto text-primary" />}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 个人信息卡片 */}
            <Card className="mb-6">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="size-16 md:size-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {currentPlayer.imageUrl ? (
                    <Image src={currentPlayer.imageUrl} alt={currentPlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="size-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground">{currentPlayer.name}</h2>
                    <Badge variant="outline">
                      {currentRole === 'captain' ? '队长' : currentRole === 'association' ? '协会人员' : currentRole === 'visitor' ? '外部访客' : '队员'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>{currentPlayer.number}号</span>
                    <span>·</span>
                    <span>{currentPlayer.position}</span>
                    <span>·</span>
                    <span>南宁联队</span>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-xs text-muted-foreground mb-1">个人特点</div>
                  <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
                    {currentPlayer.personalTraits.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentRole === 'association' ? (
              <LeagueOverview />
            ) : currentRole === 'visitor' ? (
              <VisitorNotice />
            ) : (
              <PlayerSettings player={currentPlayer} />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

// 队员个人设置
function PlayerSettings({ player }: { player: IPlayer }) {
  const { setPlayers, players, currentPlayerId } = useApp()
  const [health, setHealth] = useState(player.healthStatus)
  const [traits, setTraits] = useState<string[]>(player.personalTraits)
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggleTrait = (trait: string) => {
    if (traits.includes(trait)) {
      setTraits(traits.filter((t) => t !== trait))
    } else {
      setTraits([...traits, trait])
    }
  }

  const addCustomTrait = () => {
    const val = customInput.trim()
    if (!val) return
    if (traits.includes(val)) {
      toast.info('该特点已存在')
      return
    }
    setTraits([...traits, val])
    setCustomInput('')
    setShowCustomInput(false)
  }

  const removeTrait = (trait: string) => {
    setTraits(traits.filter((t) => t !== trait))
  }

  const save = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    const updated = players.map((p) =>
      p.id === currentPlayerId
        ? { ...p, healthStatus: health, personalTraits: traits }
        : p
    )
    setPlayers(updated)
    setSaving(false)
    toast.success('保存成功')
  }

  const currentHealth = HEALTH_OPTIONS.find((h) => h.value === health)

  return (
    <div className="space-y-6">
      {/* 身体状态 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">身体状态</CardTitle>
          <CardDescription className="text-xs">上报你当前的身体状态，队长将据此安排阵容</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HEALTH_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isActive = health === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setHealth(opt.value)}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-center flex flex-col items-center gap-2',
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <Icon className={cn('size-6', isActive ? opt.color : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                    {opt.label}
                  </span>
                  {isActive && <Check className="size-4 text-primary" />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 个人特点 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">个人特点</CardTitle>
          <CardDescription className="text-xs">选择你的技术特点，可多选，支持自定义添加</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TRAITS.map((trait) => {
              const isActive = traits.includes(trait)
              return (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm border transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  )}
                >
                  {trait}
                </button>
              )
            })}

            {showCustomInput ? (
              <div className="flex items-center gap-1">
                <Input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTrait()}
                  placeholder="输入自定义特点"
                  className="h-8 w-32 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={addCustomTrait}>
                  <Check className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setShowCustomInput(false); setCustomInput('') }}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="px-3 py-1.5 rounded-md text-sm border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center gap-1"
              >
                <Plus className="size-3.5" />
                自定义
              </button>
            )}
          </div>

          {traits.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">已选特点（点击移除）</div>
              <div className="flex flex-wrap gap-2">
                {traits.map((t) => (
                  <button
                    key={t}
                    onClick={() => removeTrait(t)}
                    className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/30 flex items-center gap-1 hover:bg-primary/20 transition-all"
                  >
                    {t}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="min-w-[120px]">
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  )
}

// 协会视角 - 队员状态总览
// 协会视角：全赛区各队总览
function LeagueOverview() {
  const { teams, players } = useApp()

  // 按组排序的球队
  const groupATeams = teams.filter((t) => t.group === 'A组').sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
  const groupBTeams = teams.filter((t) => t.group === 'B组').sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)

  // 计算每队汇总数据（注意：mock球员只有一队有完整数据，其他队做估算展示）
  const getTeamStats = (teamId: string) => {
    const normalizedId = teamId.replace('t', '')
    // 按 teamId 前缀匹配（team-1 等）
    const teamPlayers = players.filter((p) => p.teamId === `team-${normalizedId}` || p.teamId === teamId)
    const total = teamPlayers.length || 18 // 默认估算
    const healthyCount = teamPlayers.filter((p) => p.healthStatus === 'healthy').length
    const yellowTotal = teamPlayers.reduce((sum, p) => sum + p.yellowCards, 0)
    const redTotal = teamPlayers.reduce((sum, p) => sum + p.redCards, 0)
    const suspendedCount = teamPlayers.filter((p) => p.isSuspended).length
    const avgHealth = total > 0 ? Math.round((healthyCount / total) * 100) : 85
    return {
      total,
      healthyCount,
      yellowTotal,
      redTotal,
      suspendedCount,
      avgHealth,
    }
  }

  const renderTeamRow = (t: typeof teams[0], rank: number) => {
    const stats = getTeamStats(t.id)
    return (
      <Card key={t.id} className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              'size-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
              rank === 1 && 'bg-amber-500',
              rank === 2 && 'bg-slate-400',
              rank === 3 && 'bg-orange-400',
              rank > 3 && 'bg-muted text-muted-foreground'
            )}>
              {rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.group}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary tabular-nums">{t.points}</div>
              <div className="text-xs text-muted-foreground">积分</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">队员</span>
              <span className="ml-auto font-medium">{stats.total}人</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-green-500 shrink-0" />
              <span className="text-muted-foreground">健康率</span>
              <span className="ml-auto font-medium text-green-600">{stats.avgHealth}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-4 bg-yellow-400 rounded-sm shrink-0" />
              <span className="text-muted-foreground">黄牌累计</span>
              <span className="ml-auto font-medium tabular-nums">{stats.yellowTotal}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-4 bg-red-500 rounded-sm shrink-0" />
              <span className="text-muted-foreground">红牌累计</span>
              <span className="ml-auto font-medium tabular-nums">{stats.redTotal}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Ban className="size-4 text-red-500 shrink-0" />
              <span className="text-muted-foreground">停赛人数</span>
              <span className={cn(
                'ml-auto font-medium tabular-nums',
                stats.suspendedCount > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {stats.suspendedCount}人
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="text-muted-foreground">场</div>
              <div className="font-medium tabular-nums">{t.played}</div>
            </div>
            <div>
              <div className="text-green-600">胜</div>
              <div className="font-medium tabular-nums text-green-600">{t.won}</div>
            </div>
            <div>
              <div className="text-muted-foreground">平</div>
              <div className="font-medium tabular-nums">{t.drawn}</div>
            </div>
            <div>
              <div className="text-red-500">负</div>
              <div className="font-medium tabular-nums text-red-500">{t.lost}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 总览统计条 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-5 text-blue-600" />
            <span className="font-semibold text-foreground">全赛区总览</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-white/60 rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground tabular-nums">{teams.length}</div>
              <div className="text-xs text-muted-foreground">参赛球队</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground tabular-nums">{teams.reduce((s, t) => s + (t.played || 0), 0)}</div>
              <div className="text-xs text-muted-foreground">总场次</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-600 tabular-nums">
                {players.reduce((s, p) => s + p.yellowCards, 0)}
              </div>
              <div className="text-xs text-muted-foreground">黄牌总数</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-500 tabular-nums">
                {players.filter((p) => p.isSuspended).length}
              </div>
              <div className="text-xs text-muted-foreground">停赛人数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* A组球队 */}
      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-blue-500" />
          A组球队总览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groupATeams.map((t, idx) => renderTeamRow(t, idx + 1))}
        </div>
      </div>

      {/* B组球队 */}
      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-emerald-500" />
          B组球队总览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groupBTeams.map((t, idx) => renderTeamRow(t, idx + 1))}
        </div>
      </div>
    </div>
  )
}

// 外部访客提示
function VisitorNotice() {
  return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center text-center">
        <Eye className="size-10 text-muted-foreground mb-3" />
        <p className="text-foreground font-medium">当前为外部访客身份</p>
        <p className="text-sm text-muted-foreground mt-1">外部访客无需填写个人信息，可查看公开赛程与约球信息</p>
        <p className="text-xs text-muted-foreground mt-3">点击右上角身份切换可切换为其他身份查看更多功能</p>
      </CardContent>
    </Card>
  )
}
