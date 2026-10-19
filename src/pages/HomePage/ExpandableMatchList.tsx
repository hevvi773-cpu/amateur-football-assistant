import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { IMatch } from '@/data/matches'
import { ITeam } from '@/data/teams'
import MatchCard from './MatchCard'

interface ExpandableMatchListProps {
  /** 已排序的完整比赛列表 */
  matches: IMatch[]
  teams: ITeam[]
  onGenerateAI: (matchId: string, type: 'prediction' | 'preview') => void
  tacticContents: Record<string, string>
  tacticExpanded: Record<string, boolean>
  onToggleTactic: (id: string) => void
  /** 本队ID，用于比赛卡片打"本队"标记 */
  currentTeamId: string
  /** 每批展开的场次，默认5场 */
  batchSize?: number
}

/** 赛程列表：默认只展示前 N 场，点击"展开更多"分批加载 */
export default function ExpandableMatchList({
  matches,
  teams,
  onGenerateAI,
  tacticContents,
  tacticExpanded,
  onToggleTactic,
  currentTeamId,
  batchSize = 5,
}: ExpandableMatchListProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize)

  const visibleMatches = matches.slice(0, visibleCount)
  const hasMore = visibleCount < matches.length

  if (matches.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">暂无比赛</p>
  }

  return (
    <div className="space-y-3">
      {visibleMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          teams={teams}
          onGenerateAI={onGenerateAI}
          tacticContent={tacticContents[match.id]}
          tacticExpanded={tacticExpanded[match.id]}
          onToggleTactic={onToggleTactic}
          isMyTeam={match.homeTeamId === currentTeamId || match.awayTeamId === currentTeamId}
        />
      ))}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + batchSize)}
          className="w-full flex items-center justify-center gap-1.5 py-3 mt-2 rounded-lg border border-dashed text-sm text-primary hover:bg-primary/5 transition-colors"
        >
          <ChevronDown className="size-4" />
          展开更多（已显示 {visibleCount}/{matches.length} 场）
        </button>
      ) : (
        <p className="text-center text-xs text-muted-foreground py-2">已显示全部 {matches.length} 场比赛</p>
      )}
    </div>
  )
}
