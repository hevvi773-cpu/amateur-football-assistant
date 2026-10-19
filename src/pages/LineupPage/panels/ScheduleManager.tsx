import { useRef, useMemo, useState } from 'react'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, Edit2, Trophy, Sparkles, Calendar, MapPin, Clock, Check, Save, PlusCircle } from 'lucide-react'
import { useApp, getTeamName } from '@/context/AppContext'
import { IMatch } from '@/data/matches'
import * as api from '@/lib/api'
import { toast } from 'sonner'
import { logger } from '@lark-apaas/client-toolkit-lite'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  upcoming: { label: '未开赛', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ongoing: { label: '进行中', className: 'bg-green-50 text-green-700 border-green-300 animate-pulse' },
  finished: { label: '已结束', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

interface ParsedMatch {
  key: number
  time: string
  venue: string
  homeTeam: string
  awayTeam: string
  stage: string
  stageLabel: string
}

interface ScheduleManagerProps {
  /** 赛程列表「录入结果」按钮回调 */
  onEnterResult: (match: IMatch) => void
  /** 已结束比赛「生成文稿」按钮回调 */
  onRequestDraft: (matchId: string) => void
}

export default function ScheduleManager({ onEnterResult, onRequestDraft }: ScheduleManagerProps) {
  const { matches, setMatches, teams, dataSource, refreshAll } = useApp()

  // 文件上传解析
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([])
  const [parseDialogOpen, setParseDialogOpen] = useState(false)

  // 赛程编辑
  const [editingMatch, setEditingMatch] = useState<IMatch | null>(null)

  // 手动新增赛程
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualForm, setManualForm] = useState({
    time: '',
    venue: '',
    homeTeamId: '',
    awayTeamId: '',
    stage: 'group' as 'group' | 'knockout',
  })

  const resetManualForm = () => {
    setManualForm({ time: '', venue: '', homeTeamId: '', awayTeamId: '', stage: 'group' })
  }

  const submitManualMatch = async (keepOpen: boolean) => {
    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法新增赛程')
      return
    }
    if (!manualForm.time.trim()) {
      toast.error('请填写比赛时间')
      return
    }
    if (!manualForm.homeTeamId || !manualForm.awayTeamId) {
      toast.error('请选择主队和客队')
      return
    }
    if (manualForm.homeTeamId === manualForm.awayTeamId) {
      toast.error('主队和客队不能相同')
      return
    }
    const homeTeam = teams.find((t) => t.id === manualForm.homeTeamId)
    const awayTeam = teams.find((t) => t.id === manualForm.awayTeamId)
    if (!homeTeam || !awayTeam) {
      toast.error('球队信息异常，请重新选择')
      return
    }
    setManualSubmitting(true)
    try {
      const created = (await api.createMatches([{
        stage: manualForm.stage,
        group: manualForm.stage === 'group' ? '学院联赛' : undefined,
        time: manualForm.time.trim(),
        venue: manualForm.venue.trim(),
        home: homeTeam.name,
        away: awayTeam.name,
      }])) as unknown[]
      toast.success(`已新增赛程：${homeTeam.name} vs ${awayTeam.name}`)
      refreshAll()
      if (keepOpen) {
        resetManualForm()
      } else {
        setManualDialogOpen(false)
        resetManualForm()
      }
    } catch (err) {
      toast.error(`新增失败：${(err as Error).message}`)
    } finally {
      setManualSubmitting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法解析赛程文件')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setParsing(true)
    try {
      const data = (await api.parseScheduleFile(file)) as {
        matches?: { stage?: string; group?: string; time?: string; venue?: string; home?: string; away?: string }[]
      }
      const items = data.matches ?? []
      if (items.length === 0) {
        toast.warning('未从文件中解析出比赛，请检查文件格式')
        return
      }
      const parsed: ParsedMatch[] = items.map((item, idx) => ({
        key: idx + 1,
        time: item.time ?? '',
        venue: item.venue ?? '',
        homeTeam: item.home ?? '',
        awayTeam: item.away ?? '',
        stage: item.stage ?? 'group',
        stageLabel: (item.stage ?? 'group') === 'group' ? `小组赛${item.group ? ` · ${item.group}` : ''}` : '淘汰赛',
      }))
      setParsedMatches(parsed)
      setParseDialogOpen(true)
      toast.success(`AI解析出 ${parsed.length} 场比赛，请核对后入库`)
    } catch (err) {
      toast.error(`解析失败：${(err as Error).message}`)
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const confirmParsedMatches = async () => {
    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法入库')
      return
    }
    try {
      const items = parsedMatches.map((pm) => ({
        stage: pm.stage,
        group: pm.stage === 'group' ? '学院联赛' : undefined,
        time: pm.time,
        venue: pm.venue,
        home: pm.homeTeam,
        away: pm.awayTeam,
      }))
      const created = (await api.createMatches(items)) as unknown[]
      toast.success(`已导入 ${created.length} 场比赛`)
      refreshAll()
    } catch (err) {
      toast.error(`入库失败：${(err as Error).message}`)
    }
    setParseDialogOpen(false)
    setParsedMatches([])
  }

  const saveMatchEdit = async () => {
    if (!editingMatch) return
    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法保存')
      return
    }
    try {
      await api.updateMatch(editingMatch.id, {
        time: editingMatch.time,
        venue: editingMatch.venue,
        home_team_id: editingMatch.homeTeamId,
        away_team_id: editingMatch.awayTeamId,
      })
      toast.success('赛程已更新')
      refreshAll()
    } catch (err) {
      toast.error(`更新失败：${(err as Error).message}`)
    }
    setEditingMatch(null)
  }

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => a.time.localeCompare(b.time)),
    [matches]
  )

  const parseDateTime = (timeStr: string) => {
    const parts = timeStr.split(' ')
    return { date: parts[0] || timeStr, time: parts[1] || '' }
  }

  return (
    <>
      {/* 一、赛程上传 */}
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
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border/60">
            <div className="flex-1 text-xs text-muted-foreground">
              没有文件？也可以手动一条一条录入赛程
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => { resetManualForm(); setManualDialogOpen(true) }}
            >
              <PlusCircle className="size-4" />
              手动新增赛程
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 二、赛程列表 */}
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
                          onClick={() => onEnterResult(m)}
                        >
                          <Trophy className="size-3.5" />
                          录入结果
                        </Button>
                        {m.status === 'finished' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-primary"
                            onClick={() => onRequestDraft(m.id)}
                          >
                            <Sparkles className="size-3.5" />
                            生成文稿
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
                        <SelectItem key={t.id} value={t.id}>
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
                        <SelectItem key={t.id} value={t.id}>
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

      {/* 手动新增赛程弹窗 */}
      <Dialog open={manualDialogOpen} onOpenChange={(o) => { if (!o) { setManualDialogOpen(false); resetManualForm() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="size-5 text-primary" />
              手动新增赛程
            </DialogTitle>
            <DialogDescription>
              填写比赛信息，提交后立即入库。需切换到「协会」身份才能操作。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>比赛时间</Label>
                <Input
                  placeholder="2026-05-28 15:00"
                  value={manualForm.time}
                  onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>比赛地点</Label>
                <Input
                  placeholder="第二运动场"
                  value={manualForm.venue}
                  onChange={(e) => setManualForm({ ...manualForm, venue: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>主队</Label>
                <Select
                  value={manualForm.homeTeamId}
                  onValueChange={(v) => setManualForm({ ...manualForm, homeTeamId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择主队" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>客队</Label>
                <Select
                  value={manualForm.awayTeamId}
                  onValueChange={(v) => setManualForm({ ...manualForm, awayTeamId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择客队" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>阶段</Label>
              <Select
                value={manualForm.stage}
                onValueChange={(v) => setManualForm({ ...manualForm, stage: v as 'group' | 'knockout' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">小组赛（学院联赛）</SelectItem>
                  <SelectItem value="knockout">淘汰赛</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {manualForm.homeTeamId && manualForm.awayTeamId && manualForm.homeTeamId === manualForm.awayTeamId && (
              <p className="text-xs text-red-500">主队和客队不能相同</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setManualDialogOpen(false); resetManualForm() }}>取消</Button>
            <Button
              variant="outline"
              disabled={manualSubmitting}
              onClick={() => submitManualMatch(true)}
            >
              <PlusCircle className="size-4 mr-1" />
              保存并继续新增
            </Button>
            <Button
              disabled={manualSubmitting}
              onClick={() => submitManualMatch(false)}
            >
              <Check className="size-4 mr-1" />
              {manualSubmitting ? '提交中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
