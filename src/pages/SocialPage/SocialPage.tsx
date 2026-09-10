import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  UtensilsCrossed,
  Trophy,
  Send,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  ChevronRight,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ISocialEvent } from '@/data/social'
import { IArticle, IComment } from '@/data/articles'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Image } from '@/components/ui/image'

const STATUS_INFO: Record<string, { label: string; className: string; icon: typeof Users }> = {
  recruiting: { label: '招募中', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: Users },
  confirmed: { label: '已成行', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

export default function SocialPage() {
  return (
    <div className="min-h-screen">
      <main className="space-y-6 py-6">
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">约球广场</h1>
              <p className="text-muted-foreground text-sm mt-1">全赛区公开的约球接龙与赛事纪实</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧 - 约球接龙 */}
              <div className="lg:col-span-2 space-y-4">
                <SocialEventList />
              </div>

              {/* 右侧 - 赛事纪实 */}
              <div className="space-y-4">
                <ArticleSideList />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// 约球接龙列表
function SocialEventList() {
  const { socialEvents, setSocialEvents, currentPlayerId, players, addMessage, messages } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [detailEvent, setDetailEvent] = useState<ISocialEvent | null>(null)

  const [form, setForm] = useState({
    title: '',
    type: 'football' as 'football' | 'dinner',
    time: '',
    venue: '',
    minPlayers: '6',
    deadline: '',
    description: '',
  })

  const myName = players.find((p) => p.id === currentPlayerId)?.name || '我'

  const activeEvents = socialEvents.filter((e) => e.status === 'recruiting')
  const otherEvents = socialEvents.filter((e) => e.status !== 'recruiting')

  const handleJoin = (eventId: string) => {
    const ev = socialEvents.find((e) => e.id === eventId)
    if (!ev) return
    if (ev.currentPlayers.includes(currentPlayerId)) return

    const updated = socialEvents.map((e) =>
      e.id === eventId
        ? { ...e, currentPlayers: [...e.currentPlayers, currentPlayerId] }
        : e
    )
    setSocialEvents(updated)
    toast.success('报名成功')

    // 人数达标检测
    const after = updated.find((e) => e.id === eventId)!
    if (after.currentPlayers.length >= after.minPlayers && ev.currentPlayers.length < ev.minPlayers) {
      addMessage({
        type: 'social',
        title: '约球已成行',
        content: `「${ev.title}」报名人数已达标，活动确认举行！`,
        relatedId: eventId,
      })
    }
  }

  const handleLeave = (eventId: string) => {
    const updated = socialEvents.map((e) =>
      e.id === eventId
        ? { ...e, currentPlayers: e.currentPlayers.filter((id) => id !== currentPlayerId) }
        : e
    )
    setSocialEvents(updated)
    toast.success('已取消报名')
  }

  const simulateDeadline = () => {
    // 模拟时间推进：检查招募中的接龙，人数不足的取消
    let cancelledCount = 0
    const updated = socialEvents.map((e) => {
      if (e.status === 'recruiting' && e.currentPlayers.length < e.minPlayers) {
        cancelledCount++
        // 持续推送通知
        addMessage({
          type: 'social',
          title: '约球人数不足',
          content: `「${e.title}」截止时间已到，报名人数不足，活动已取消。`,
          relatedId: e.id,
        })
        return { ...e, status: 'cancelled' as const }
      }
      return e
    })
    setSocialEvents(updated)
    if (cancelledCount > 0) {
      toast.warning(`${cancelledCount}个接龙因人数不足已取消`)
    } else {
      toast.success('所有招募中接龙均已达标')
    }
  }

  const createEvent = () => {
    if (!form.title || !form.time || !form.venue) {
      toast.error('请填写完整信息')
      return
    }
    const newEvent: ISocialEvent = {
      id: `s_${Date.now()}`,
      title: form.title,
      type: form.type,
      time: form.time,
      venue: form.venue,
      minPlayers: parseInt(form.minPlayers) || 6,
      currentPlayers: [currentPlayerId],
      deadline: form.deadline || form.time,
      status: 'recruiting',
      creatorId: currentPlayerId,
      creatorName: myName,
      description: form.description,
    }
    setSocialEvents([newEvent, ...socialEvents])
    setCreateOpen(false)
    setForm({ title: '', type: 'football', time: '', venue: '', minPlayers: '6', deadline: '', description: '' })
    toast.success('接龙已发布')
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          约球接龙
        </h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" className="gap-1" onClick={simulateDeadline}>
            <Play className="size-3.5" />
            模拟截止
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="size-4" />
                发布接龙
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>发布约球接龙</DialogTitle>
                <DialogDescription>填写活动信息，发布后全赛区可见</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">活动类型</Label>
                  <Select value={form.type} onValueChange={(v: 'football' | 'dinner') => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="football">⚽ 约球</SelectItem>
                      <SelectItem value="dinner">🍽️ 约饭</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">标题</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如：周末友谊赛" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">时间</Label>
                    <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="2024-06-15 16:00" />
                  </div>
                  <div>
                    <Label className="text-xs">地点</Label>
                    <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="南宁市体育场" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">最低人数</Label>
                    <Input type="number" value={form.minPlayers} onChange={(e) => setForm({ ...form, minPlayers: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">截止时间</Label>
                    <Input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="2024-06-14 20:00" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">活动说明</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="补充说明..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button>
                <Button onClick={createEvent}>发布</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {activeEvents.length > 0 && (
        <div className="space-y-3">
          {activeEvents.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              onJoin={() => handleJoin(ev.id)}
              onLeave={() => handleLeave(ev.id)}
              onDetail={() => setDetailEvent(ev)}
              isJoined={ev.currentPlayers.includes(currentPlayerId)}
              players={players}
            />
          ))}
        </div>
      )}

      {otherEvents.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-muted-foreground mt-6">历史接龙</h3>
          <div className="space-y-3">
            {otherEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                onJoin={() => {}}
                onLeave={() => {}}
                onDetail={() => setDetailEvent(ev)}
                isJoined={ev.currentPlayers.includes(currentPlayerId)}
                players={players}
                disabled
              />
            ))}
          </div>
        </>
      )}

      {/* 详情弹窗 */}
      <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailEvent?.title}</DialogTitle>
            <DialogDescription>
              {detailEvent && STATUS_INFO[detailEvent.status].label}
            </DialogDescription>
          </DialogHeader>
          {detailEvent && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{detailEvent.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{detailEvent.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span>{detailEvent.currentPlayers.length}/{detailEvent.minPlayers}人</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>截止 {detailEvent.deadline}</span>
                </div>
              </div>
              {detailEvent.description && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {detailEvent.description}
                </p>
              )}
              <div>
                <Label className="text-xs mb-2 block">报名人员 ({detailEvent.currentPlayers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {detailEvent.currentPlayers.map((pid) => {
                    const p = players.find((x) => x.id === pid)
                    return (
                      <Badge key={pid} variant="outline" className="gap-1">
                        {p ? p.name : pid}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailEvent(null)}>关闭</Button>
            {detailEvent?.status === 'recruiting' && (
              detailEvent.currentPlayers.includes(currentPlayerId) ? (
                <Button variant="destructive" onClick={() => { handleLeave(detailEvent.id); setDetailEvent(null) }}>
                  取消报名
                </Button>
              ) : (
                <Button onClick={() => { handleJoin(detailEvent.id); setDetailEvent(null) }}>
                  我要参加
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EventCard({
  event,
  onJoin,
  onLeave,
  onDetail,
  isJoined,
  players,
  disabled = false,
}: {
  event: ISocialEvent
  onJoin: () => void
  onLeave: () => void
  onDetail: () => void
  isJoined: boolean
  players: { id: string; name: string; imageUrl: string }[]
  disabled?: boolean
}) {
  const status = STATUS_INFO[event.status]
  const progress = Math.min(event.currentPlayers.length / event.minPlayers, 1)

  return (
    <Card className={cn('overflow-hidden transition-all', event.status === 'cancelled' && 'opacity-70')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'size-10 rounded-lg flex items-center justify-center shrink-0',
            event.type === 'football' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          )}>
            {event.type === 'football' ? <Trophy className="size-5" /> : <UtensilsCrossed className="size-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-foreground truncate">{event.title}</h3>
              <Badge className={cn('text-xs', status.className)} variant="outline">
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {event.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {event.venue}
              </span>
            </div>

            {/* 进度条 */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {event.currentPlayers.length}/{event.minPlayers} 人
                </span>
                {progress < 1 && event.status === 'recruiting' && (
                  <span className="text-amber-600">还差 {event.minPlayers - event.currentPlayers.length} 人</span>
                )}
                {progress >= 1 && event.status === 'recruiting' && (
                  <span className="text-green-600">已成行</span>
                )}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progress >= 1 ? 'bg-green-500' : event.status === 'cancelled' ? 'bg-red-400' : 'bg-primary'
                  )}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 mt-3">
              {!disabled && (
                isJoined ? (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onLeave}>
                    取消报名
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={onJoin}>
                    <Plus className="size-3" />
                    我要参加
                  </Button>
                )
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-auto" onClick={onDetail}>
                详情
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 右侧赛事纪实文稿列表
function ArticleSideList() {
  const { articles } = useApp()
  const [selectedArticle, setSelectedArticle] = useState<IArticle | null>(null)

  const published = articles.filter((a) => a.status === 'published')

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            赛事纪实
          </CardTitle>
          <CardDescription className="text-xs">协会发布的官方文稿</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {published.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">暂无文稿</p>
          )}
          {published.map((a) => (
            <div
              key={a.id}
              className="p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all"
              onClick={() => setSelectedArticle(a)}
            >
              <h4 className="font-medium text-sm text-foreground line-clamp-2">{a.title}</h4>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{a.createdAt}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3" />
                  {a.comments.length}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 文稿详情 Drawer */}
      <Drawer open={!!selectedArticle} onOpenChange={(o) => !o && setSelectedArticle(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-xl">{selectedArticle?.title}</DrawerTitle>
            <DrawerDescription>
              发布于 {selectedArticle?.createdAt}
            </DrawerDescription>
          </DrawerHeader>
          {selectedArticle && <ArticleDetailContent article={selectedArticle} />}
        </DrawerContent>
      </Drawer>
    </>
  )
}

function ArticleDetailContent({ article }: { article: IArticle }) {
  const { articles, setArticles, currentPlayerId, players } = useApp()
  const [commentText, setCommentText] = useState('')

  const myName = players.find((p) => p.id === currentPlayerId)?.name || '匿名用户'

  const submitComment = () => {
    if (!commentText.trim()) return
    const newComment: IComment = {
      id: `c_${Date.now()}`,
      articleId: article.id,
      author: myName,
      content: commentText,
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    const updated = articles.map((a) =>
      a.id === article.id ? { ...a, comments: [...a.comments, newComment] } : a
    )
    setArticles(updated)
    setCommentText('')
    toast.success('评论成功')
  }

  return (
    <div className="px-4 pb-6 overflow-y-auto">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div className="whitespace-pre-line text-foreground leading-relaxed text-sm">
          {article.content}
        </div>
      </div>

      <div className="border-t border-border mt-6 pt-4">
        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
          <MessageSquare className="size-4" />
          评论 ({article.comments.length})
        </h4>

        <div className="space-y-3 mb-4">
          {article.comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">暂无评论，来抢沙发吧</p>
          )}
          {article.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium shrink-0">
                {c.author.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author}</span>
                  <span className="text-xs text-muted-foreground">{c.createdAt}</span>
                </div>
                <p className="text-sm text-foreground mt-1">{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="发表评论..."
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitComment()
              }
            }}
          />
          <Button size="sm" className="h-9 shrink-0 gap-1" onClick={submitComment} disabled={!commentText.trim()}>
            <Send className="size-3.5" />
            发送
          </Button>
        </div>
      </div>
    </div>
  )
}
