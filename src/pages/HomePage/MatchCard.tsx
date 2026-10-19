import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Clock, MapPin, Swords, ChevronUp, ChevronDown, Zap } from 'lucide-react'
import { IMatch } from '@/data/matches'
import { getTeamName } from '@/context/AppContext'
import { cn } from '@/lib/utils'

export const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  upcoming: { label: '未开赛', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  ongoing: { label: '进行中', className: 'bg-green-100 text-green-700 border-green-200 animate-pulse' },
  finished: { label: '已结束', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-700 border-red-200' },
}

// 生成简短摘要（取内容前几句）
export function extractSummary(full: string, maxLen = 80): string {
  const lines = full
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('【') && !l.startsWith('—') && !l.startsWith('━') && !l.startsWith('一、') && !l.startsWith('二、') && !l.startsWith('三、') && !l.startsWith('四、') && !l.startsWith('五、') && !/^[0-9]+\./.test(l.trim()))
    .slice(0, 2)
  const joined = lines.join(' ').replace(/^[• ]+/, '').trim()
  return joined.length > maxLen ? joined.slice(0, maxLen) + '…' : joined
}

interface MatchCardProps {
  match: IMatch
  teams: { id: string; name: string; group: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number; logoUrl: string }[]
  onGenerateAI: (matchId: string, type: 'prediction' | 'preview') => void
  tacticContent?: string
  tacticExpanded?: boolean
  onToggleTactic: (id: string) => void
  isMyTeam?: boolean
}

export default function MatchCard({
  match,
  teams,
  onGenerateAI,
  tacticContent,
  tacticExpanded,
  onToggleTactic,
  isMyTeam,
}: MatchCardProps) {
  const homeName = getTeamName(teams, match.homeTeamId)
  const awayName = getTeamName(teams, match.awayTeamId)
  const status = STATUS_LABEL[match.status]

  // 解析时间：日期和具体时间分开
  const timeParts = match.time.split(' ')
  const dateStr = timeParts[0] || match.time
  const timeStr = timeParts[1] || ''

  return (
    <Card className={cn('overflow-hidden', isMyTeam && 'border-primary/30 bg-primary/[0.02]')}>
      <CardContent className="p-4 md:p-5">
        {/* 顶部：阶段 + 状态 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {match.stage === 'group' ? match.groupName : '淘汰赛'}
            </Badge>
            <Badge className={cn('text-xs font-normal', status.className)}>
              {status.label}
            </Badge>
            {isMyTeam && (
              <Badge variant="secondary" className="text-xs">本队</Badge>
            )}
          </div>
        </div>

        {/* 主体：对阵信息 + 时间地点（纵向堆叠在右侧） */}
        <div className="flex items-stretch gap-4">
          {/* 对阵双方 - 两行布局 */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1.5">
              {/* 主队行 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8 shrink-0">主队</span>
                <span
                  className={cn(
                    'font-bold text-base md:text-lg flex-1 min-w-0 truncate',
                    match.status === 'finished'
                      ? (match.homeScore ?? 0) > (match.awayScore ?? 0)
                        ? 'text-red-600'
                        : (match.homeScore ?? 0) < (match.awayScore ?? 0)
                        ? 'text-muted-foreground font-medium'
                        : ''
                      : ''
                  )}
                >
                  {homeName}
                </span>
                {match.status === 'finished' ? (
                  <span className="shrink-0 px-2.5 py-0.5 text-sm font-bold tabular-nums rounded-md bg-gray-100 text-gray-700 min-w-[36px] text-center">
                    {match.homeScore}
                  </span>
                ) : null}
              </div>
              {/* 客队行 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8 shrink-0">客队</span>
                <span
                  className={cn(
                    'font-bold text-base md:text-lg flex-1 min-w-0 truncate',
                    match.status === 'finished'
                      ? (match.awayScore ?? 0) > (match.homeScore ?? 0)
                        ? 'text-red-600'
                        : (match.awayScore ?? 0) < (match.homeScore ?? 0)
                        ? 'text-muted-foreground font-medium'
                        : ''
                      : ''
                  )}
                >
                  {awayName}
                </span>
                {match.status === 'finished' ? (
                  <span className="shrink-0 px-2.5 py-0.5 text-sm font-bold tabular-nums rounded-md bg-gray-100 text-gray-700 min-w-[36px] text-center">
                    {match.awayScore}
                  </span>
                ) : (
                  <span className="shrink-0 text-sm text-muted-foreground font-medium w-[36px] text-center">vs</span>
                )}
              </div>
            </div>
          </div>

          {/* 时间地点 - 纵向堆叠 */}
          <div className="w-36 shrink-0 border-l border-border/50 pl-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              <span>{dateStr}</span>
            </div>
            {timeStr && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{timeStr}</span>
              </div>
            )}
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{match.venue}</span>
            </div>
          </div>
        </div>

        {match.status === 'upcoming' && tacticContent && (
          <div className="mt-4 pt-3 border-t border-border/50">
            {/* AI赛前战术攻略 - 内嵌展示 */}
            <div className="border border-dashed border-primary/40 bg-primary/[0.03] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Swords className="size-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">AI赛前战术攻略</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => onToggleTactic(match.id)}
                >
                  {tacticExpanded ? '收起' : '展开详情'}
                  {tacticExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </Button>
              </div>
              <div
                className={cn(
                  'text-sm text-muted-foreground bg-card/60 rounded-md p-2.5 overflow-hidden transition-all leading-relaxed',
                  tacticExpanded ? 'max-h-[420px] overflow-y-auto' : 'max-h-[3.5rem]'
                )}
              >
                {tacticExpanded ? (
                  <div className="whitespace-pre-line text-foreground/90">{tacticContent}</div>
                ) : (
                  <div className="line-clamp-2">{extractSummary(tacticContent, 100)}</div>
                )}
              </div>
            </div>

            {/* 次级 AI 按钮 */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 h-8 text-xs"
                onClick={() => onGenerateAI(match.id, 'prediction')}
              >
                <Zap className="size-3.5 text-amber-500" />
                AI预测
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
