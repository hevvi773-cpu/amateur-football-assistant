import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trophy, Plus, X, AlertCircle } from 'lucide-react'
import { useApp, getTeamName } from '@/context/AppContext'
import { IMatch } from '@/data/matches'
import * as api from '@/lib/api'
import { toast } from 'sonner'

interface GoalFormItem {
  playerId: string
  teamId: string
  minute: number
}

interface CardFormItem {
  playerId: string
  teamId: string
  minute: number
  type: 'yellow' | 'red' | 'second_yellow'
}

interface ResultEntryProps {
  /** 当前录入结果的比赛；null 表示未选择 */
  match: IMatch | null
  /** 关闭/取消录入 */
  onClose: () => void
}

export default function ResultEntry({ match, onClose }: ResultEntryProps) {
  const { teams, players, dataSource, refreshAll } = useApp()
  const [resultForm, setResultForm] = useState<{
    homeScore: string
    awayScore: string
    goals: GoalFormItem[]
    cards: CardFormItem[]
  }>({ homeScore: '', awayScore: '', goals: [], cards: [] })

  // 切换比赛时重置表单
  useEffect(() => {
    if (!match) return
    setResultForm({
      homeScore: match.homeScore?.toString() || '0',
      awayScore: match.awayScore?.toString() || '0',
      goals: match.goals?.map(({ id: _id, ...goal }) => goal) || [],
      cards: match.cards?.map(({ id: _id, ...card }) => card) || [],
    })
  }, [match])

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
    const goals = resultForm.goals.map((goal, i) =>
      i === idx ? ({ ...goal, [field]: value } as GoalFormItem) : goal
    )
    setResultForm({ ...resultForm, goals })
  }

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
    const cards = resultForm.cards.map((card, i) =>
      i === idx ? ({ ...card, [field]: value } as CardFormItem) : card
    )
    setResultForm({ ...resultForm, cards })
  }

  const submitResult = async () => {
    if (!match) return
    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法录入结果')
      return
    }
    const homeScore = parseInt(resultForm.homeScore) || 0
    const awayScore = parseInt(resultForm.awayScore) || 0
    try {
      await api.enterMatchResult(match.id, {
        home_score: homeScore,
        away_score: awayScore,
        goals: resultForm.goals.map((goal) => ({ player_id: goal.playerId, minute: goal.minute })),
        cards: resultForm.cards.map((card) => ({ player_id: card.playerId, minute: card.minute, type: card.type })),
      })
      toast.success('比赛结果已录入，积分榜和球员数据已自动更新')
      refreshAll()
    } catch (err) {
      toast.error(`录入失败：${(err as Error).message}`)
    }
    onClose()
  }

  return (
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
        {!match ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">请先在上方赛程列表中选择一场比赛，点击「录入结果」</p>
          </div>
        ) : (
          <ResultFormView
            match={match}
            resultForm={resultForm}
            setResultForm={setResultForm}
            addGoal={addGoal}
            removeGoal={removeGoal}
            updateGoal={updateGoal}
            addCard={addCard}
            removeCard={removeCard}
            updateCard={updateCard}
            submitResult={submitResult}
            onClose={onClose}
            teamName={getTeamName(teams, match.homeTeamId)}
            awayName={getTeamName(teams, match.awayTeamId)}
            players={players.map((p) => ({ id: p.id, name: p.name, number: p.number }))}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface ResultFormViewProps {
  match: IMatch
  resultForm: {
    homeScore: string
    awayScore: string
    goals: GoalFormItem[]
    cards: CardFormItem[]
  }
  setResultForm: React.Dispatch<React.SetStateAction<{
    homeScore: string
    awayScore: string
    goals: GoalFormItem[]
    cards: CardFormItem[]
  }>>
  addGoal: () => void
  removeGoal: (idx: number) => void
  updateGoal: (idx: number, field: string, value: string | number) => void
  addCard: () => void
  removeCard: (idx: number) => void
  updateCard: (idx: number, field: string, value: string | number) => void
  submitResult: () => void
  onClose: () => void
  teamName: string
  awayName: string
  players: { id: string; name: string; number: number }[]
}

function ResultFormView({
  match, resultForm, setResultForm, addGoal, removeGoal, updateGoal,
  addCard, removeCard, updateCard, submitResult, onClose,
  teamName, awayName, players,
}: ResultFormViewProps) {
  return (
    <>
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="font-medium">
          {teamName} vs {awayName}
        </div>
        <Badge variant="outline">{match.time}</Badge>
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
            {resultForm.goals.map((goal, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                <Select
                  value={goal.teamId}
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
                  value={goal.playerId}
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
                    value={goal.minute || ''}
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
            {resultForm.cards.map((card, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                <Select
                  value={card.teamId}
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
                  value={card.type}
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
                  value={card.playerId}
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
                    value={card.minute || ''}
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
        <Button variant="ghost" onClick={onClose}>
          取消
        </Button>
        <Button onClick={submitResult}>确认提交</Button>
      </div>
    </>
  )
}
