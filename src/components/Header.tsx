import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, Calendar, User, Bell, ChevronDown, Shield, Crown, User as UserIcon, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Card } from '@/components/ui/card'
import { useApp, type UserRole } from '@/context/AppContext'
import { cn } from '@/lib/utils'

function getNavItems(currentRole: string) {
  const lineupLabel = currentRole === 'association' ? '赛事管理' : '阵容'
  return [
    { path: '/', label: '首页', icon: Home },
    { path: '/lineup', label: lineupLabel, icon: Users },
    { path: '/social', label: '约球', icon: Calendar },
    { path: '/profile', label: '我的', icon: User },
  ]
}

const ROLE_OPTIONS: { value: UserRole; label: string; icon: typeof UserIcon; color: string }[] = [
  { value: 'member', label: '普通队员', icon: UserIcon, color: 'text-foreground' },
  { value: 'captain', label: '队长', icon: Crown, color: 'text-amber-600' },
  { value: 'association', label: '协会人员', icon: Shield, color: 'text-blue-600' },
  { value: 'visitor', label: '外部访客', icon: Eye, color: 'text-muted-foreground' },
]

export default function Header() {
  const { currentRole, setCurrentRole, messages, unreadCount, markAllRead } = useApp()
  const [msgOpen, setMsgOpen] = useState(false)

  const navItems = getNavItems(currentRole)
  const currentRoleOption = ROLE_OPTIONS.find((r) => r.value === currentRole) ?? ROLE_OPTIONS[0]

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
        {/* Logo + 导航 */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              ⚽
            </div>
            <span className="font-bold text-foreground hidden sm:inline">足球AI助手</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* 右侧：身份切换 + 消息 */}
        <div className="flex items-center gap-2">
          {/* 身份切换 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 h-9">
                <currentRoleOption.icon className={cn('size-4', currentRoleOption.color)} />
                <span className="hidden sm:inline text-sm">{currentRoleOption.label}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {ROLE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleRoleChange(opt.value)}
                  className="cursor-pointer"
                >
                  <opt.icon className={cn('size-4 mr-2', opt.color)} />
                  {opt.label}
                  {currentRole === opt.value && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      当前
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 消息中心 */}
          <Sheet open={msgOpen} onOpenChange={setMsgOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[380px] sm:w-[420px]">
              <SheetHeader className="flex flex-row items-center justify-between">
                <SheetTitle>消息中心</SheetTitle>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead}>
                    全部已读
                  </Button>
                )}
              </SheetHeader>
              <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12 text-sm">暂无消息</div>
                ) : (
                  messages.map((msg) => (
                    <Card
                      key={msg.id}
                      className={cn(
                        'p-3 cursor-pointer transition-colors',
                        !msg.isRead && 'bg-primary/5 border-primary/20'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!msg.isRead && (
                          <span className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-foreground truncate">{msg.title}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{msg.createdAt}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-4 py-1 text-xs',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="size-5" />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
