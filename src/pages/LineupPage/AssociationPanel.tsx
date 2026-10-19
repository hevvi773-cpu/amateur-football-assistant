import { useState } from 'react'
import { IMatch } from '@/data/matches'
import ScheduleManager from './panels/ScheduleManager'
import ResultEntry from './panels/ResultEntry'
import ArticleManager from './panels/ArticleManager'

/**
 * 赛事管理面板容器：串联赛程管理 / 结果录入 / 纪实文稿三个子模块。
 * 仅持有跨模块触发的状态（录入结果的比赛、生成文稿的请求），其余状态收敛在子组件内。
 */
export default function AssociationPanel() {
  const [resultMatch, setResultMatch] = useState<IMatch | null>(null)
  const [draftMatchId, setDraftMatchId] = useState<string | null>(null)

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">赛事管理面板</h1>
            <p className="text-muted-foreground text-sm mt-1">赛程管理 · 结果录入 · 纪实文稿</p>
          </div>

          <ScheduleManager
            onEnterResult={setResultMatch}
            onRequestDraft={setDraftMatchId}
          />

          <ResultEntry
            match={resultMatch}
            onClose={() => setResultMatch(null)}
          />

          <ArticleManager
            draftMatchId={draftMatchId}
            onDraftConsumed={() => setDraftMatchId(null)}
          />
        </div>
      </main>
    </div>
  )
}
