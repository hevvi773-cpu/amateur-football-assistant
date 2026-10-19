import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { FileText, Eye, Edit2, X, Check, Trophy } from 'lucide-react'
import { useApp, getTeamName } from '@/context/AppContext'
import { IArticle } from '@/data/articles'
import * as api from '@/lib/api'
import { toast } from 'sonner'

interface ArticleManagerProps {
  /** 赛程列表「生成文稿」请求的比赛ID；非空时自动触发 AI 生成 */
  draftMatchId: string | null
  /** 请求已被消费（容器清空 draftMatchId） */
  onDraftConsumed: () => void
}

export default function ArticleManager({ draftMatchId, onDraftConsumed }: ArticleManagerProps) {
  const { matches, teams, articles, setArticles, dataSource, refreshAll } = useApp()

  const [viewingArticle, setViewingArticle] = useState<IArticle | null>(null)
  const [editingArticle, setEditingArticle] = useState<IArticle | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [aiGenerating, setAiGenerating] = useState<string | null>(null)

  const generateArticle = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return
    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法生成文稿')
      return
    }
    setAiGenerating(matchId)
    try {
      const article = (await api.generateArticle(matchId)) as IArticle
      setArticles([article, ...articles])
      setEditingArticle(article)
      setEditTitle(article.title)
      setEditContent(article.content)
      toast.success('AI文稿草稿已生成，请审核后发布')
    } catch (err) {
      toast.error(`生成失败：${(err as Error).message}`)
    } finally {
      setAiGenerating(null)
    }
  }

  // 响应赛程列表的「生成文稿」请求
  useEffect(() => {
    if (draftMatchId) {
      generateArticle(draftMatchId)
      onDraftConsumed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftMatchId])

  const togglePublish = async (article: IArticle) => {
    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法发布文稿')
      return
    }
    const publish = article.status === 'draft'
    try {
      if (publish) {
        await api.publishArticle(article.id)
      } else {
        await api.unpublishArticle(article.id)
      }
      refreshAll()
      toast.success(publish ? '文稿已发布' : '已取消发布')
    } catch (err) {
      toast.error(`操作失败：${(err as Error).message}`)
    }
  }

  const saveArticleEdit = async () => {
    if (!editingArticle) return
    if (dataSource !== 'api') {
      toast.error('后端服务不可用，无法保存文稿')
      return
    }
    try {
      await api.updateArticle(editingArticle.id, { title: editTitle, content: editContent })
      refreshAll()
      toast.success('文稿已保存')
    } catch (err) {
      toast.error(`保存失败：${(err as Error).message}`)
    }
    setEditingArticle(null)
  }

  return (
    <>
      {/* 纪实文稿管理 */}
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
                          disabled={aiGenerating === article.matchId}
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
              <Check className="size-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
