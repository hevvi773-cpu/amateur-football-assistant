# 足球AI助手 - 需求拆解文档

## 产品概述

- **产品类型**: 足球赛事管理与球队协作应用（Web 平台）
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 足球球队队员、队长、赛事协会管理人员
- **核心价值**: 集赛程管理、阵容编排、约球接龙、赛事纪实于一体的足球AI协作平台，AI能力作为高阶赋能，基础业务可独立运行
- **界面语言**: 中文
- **主题偏好**: 浅色
- **导航模式**: 路径导航
- **导航布局**: Topbar（面向球队用户/全赛区用户的前台应用，顶部导航为主）

---

## 页面结构总览

> **说明**：本应用共4个一级页面，均出现在顶部导航中。阵容页根据身份（队员/队长/协会）呈现完全不同的视图，属于同一页面内的权限差异化渲染。

| 页面名称 | 文件名 | 路由 | 页面类型 | 入口来源 |
|---------|-------|------|---------|---------|
| 首页 | `HomePage.tsx` | `/` | 一级 | 导航 |
| 阵容页/赛事管理 | `LineupPage.tsx` | `/lineup` | 一级 | 导航 |
| 约球页 | `SocialPage.tsx` | `/social` | 一级 | 导航 |
| 个人中心 | `ProfilePage.tsx` | `/profile` | 一级 | 导航 |

> **身份驱动的页面变体**：
> - 阵容页在「普通队员/队长」身份下展示本队阵容与球员状态
> - 阵容页在「协会人员」身份下整体变为赛事管理面板（赛程上传、结果录入、纪实文稿管理）

---

## 页面布局建议

### 首页（HomePage）
- **布局模式**: 上下分区，主内容流纵向排列
- **视觉重心**: 赛程信息 + 积分榜为上部核心，赛后复盘为下部私有区
- **结果承载区**: AI赛前攻略/预测以内嵌卡片形式展示在对应赛程条目下；赛后复盘以列表形式展示在页面底部
- **初始态**: 直接展示全部种子数据（赛程、积分榜、复盘）

### 阵容页（LineupPage）
- **布局模式**: 左右分栏（球员列表左 + 阵容编排区右）
- **视觉重心**: 阵容编排区（球场阵型图）为视觉核心
- **结果承载区**: AI推荐阵容结果直接填充到阵型图中，带"草稿"标识；AI分析结果以侧栏浮层展示
- **协会身份变体**: 上下分区，上部赛程上传/列表，下部比赛结果录入与文稿管理

### 约球页（SocialPage）
- **布局模式**: 左右分栏（约球接龙列表左 + 赛事纪实文稿列表右）
- **视觉重心**: 约球接龙为核心互动区
- **结果承载区**: 新建接龙弹窗，接龙状态实时更新；文稿详情以抽屉/弹窗展示评论区
- **初始态**: 展示已有接龙和已发布文稿

### 个人中心（ProfilePage）
- **布局模式**: 单栏居中
- **视觉重心**: 个人信息编辑表单
- **结果承载区**: 身体状态上报后即时更新；协会身份下展示队员状态列表

---

## 插件规划

| 插件实例名称 | 基于官方插件 | 业务用途 | 输出模式 | 所属页面 |
|------------|-----------|---------|---------|---------|
| 比赛预测模型 | ai-categorization | 自研机器学习模型：基于球队数据预测比赛结果（胜/平/负及概率） | unary | 首页 |
| 赛前攻略生成 | ai-text-generate | 大模型文本生成：根据对阵双方信息生成AI赛前攻略 | stream | 首页 |
| AI阵容推荐 | ai-text-generate | 大模型文本生成：根据球员状态和位置推荐首发阵容 | unary | 阵容页 |
| 赛后复盘总结 | ai-text-summary | 大模型摘要生成：根据比赛数据和队员感想生成AI复盘总结 | stream | 首页 |
| 赛事纪实文稿生成 | ai-text-generate | 大模型文本生成：根据比赛结果数据生成赛事纪实文稿草稿 | stream | 阵容页（协会面板） |
| 赛程文件解析 | ai-text-to-json | 大模型信息抽取：从txt/docx赛程文件文本中提取比赛时间、地点、主队、客队 | unary | 阵容页（协会面板） |
| 文档内容读取 | ai-doc-parser | 解析上传的txt/docx文件，提取纯文本内容供AI信息抽取使用 | unary | 阵容页（协会面板） |

> **说明**：赛程文件解析为两步链式调用 —— 先用 `ai-doc-parser` 读取文件文本内容，再用 `ai-text-to-json` 从中提取结构化赛程字段。

---

## 导航配置

- **导航布局**: Topbar（顶部固定导航栏）
- **导航项**（一级页面）:

| 导航文字 | 路由 | 图标 |
|---------|------|------|
| 首页 | `/` | Home |
| 阵容 | `/lineup` | Users |
| 约球 | `/social` | Calendar |
| 我的 | `/profile` | User |

- **顶部右侧**: 身份切换器（普通队员 / 队长 / 协会人员 / 外部访客）+ 当前身份标识徽章 + 消息通知铃铛（未读红点）

---

## 数据来源声明

| 数据/操作 | 来源类型 | 实现要求 | mock 兜底 |
|---|---|---|---|
| 赛程数据（小组赛/淘汰赛） | demo-mock | `src/data/matches.ts` 预置种子数据，含未开赛/进行中/已结束三种状态 | ✅ 本身就是 mock |
| 球队与积分榜数据 | demo-mock | `src/data/teams.ts` 预置球队列表与积分数据 | ✅ 本身就是 mock |
| 球员数据（含状态、红黄牌、停赛） | demo-mock | `src/data/players.ts` 预置10+名本队球员 | ✅ 本身就是 mock |
| 赛后复盘数据 | demo-mock | `src/data/reviews.ts` 预置普通队员/队长复盘及AI总结 | ✅ 本身就是 mock |
| 赛事纪实文稿及评论 | demo-mock | `src/data/articles.ts` 预置已发布文稿及评论 | ✅ 本身就是 mock |
| 约球接龙数据 | demo-mock | `src/data/social.ts` 预置接龙数据 | ✅ 本身就是 mock |
| 站内消息数据 | demo-mock | `src/data/messages.ts` 预置消息数据 | ✅ 本身就是 mock |
| 比赛预测 | real-plugin | capabilityClient 调比赛预测模型实例，传入对阵双方球队数据，输出胜平负概率 | 失败提示 (toast "AI预测暂不可用") |
| 赛前攻略生成 | real-plugin | capabilityClient.callStream 调赛前攻略生成实例，传入对阵双方信息，流式输出攻略文本 | 失败提示 (toast "AI生成暂不可用") |
| AI阵容推荐 | real-plugin | capabilityClient 调AI阵容推荐实例，传入球员列表与状态数据，输出推荐阵容结构 | 失败提示 (toast "AI推荐暂不可用") |
| 赛后复盘总结 | real-plugin | capabilityClient.callStream 调赛后复盘总结实例，传入比赛数据与队员感想，流式输出总结文本 | 失败提示 (toast "AI总结暂不可用") |
| 赛事纪实文稿生成 | real-plugin | capabilityClient.callStream 调赛事纪实文稿生成实例，传入比赛结果数据（比分/进球/红黄牌），流式输出文稿草稿 | 失败提示 (toast "AI生成暂不可用") |
| 赛程文件解析 | real-plugin | 先调文档内容读取实例解析上传的txt/docx文件，再调赛程文件解析实例从文本中提取结构化赛程字段（时间/地点/主队/客队） | 失败提示 (toast "AI解析暂不可用") |
| 文件上传（赛程文件） | real-file | `<input type="file">` 限制 accept 为 .txt,.docx，其他格式拦截并提示拒绝原因 | 无 |
| 身份状态切换 | local-persist | localStorage key=`__app_football_currentRole`，保存当前选择的身份 | 无（默认普通队员） |
| 用户操作产生的数据（阵容发布/接龙创建/感想提交等） | local-persist | localStorage 存储用户在原型中的操作变更，刷新后保留 | 无 |
| 约球接龙状态模拟 | demo-mock | 页面内提供"模拟时间推进"按钮，触发状态变更逻辑 | ✅ 本身就是 mock |

---

## 功能列表

### 首页（HomePage）
- **页面目标**: 展示赛程、积分榜及本队赛后复盘，提供AI赛前分析入口
- **功能点**:
  - **赛程展示与筛选**: Tab切换「全部赛程」「本队赛程」，下拉筛选「小组赛/淘汰赛」，赛程卡片展示对阵双方、时间、地点、状态标签（未开赛/进行中/已结束）
  - **AI比赛预测与赛前攻略**: 未开赛赛程卡片附带「AI预测」「赛前攻略」按钮，点击显示加载动画后产出内容草稿，仅展示不影响业务数据
  - **积分榜展示**: 按小组分组展示球队排名、场次、胜平负、积分、净胜球
  - **本队私有赛后复盘（权限受控）**: 页面底部复盘区域仅本队成员（普通队员/队长）可见，外部访客不可见；复盘条目区分普通队员与队长标识，附带AI总结内容
  - **赛后感想填写**: 已结束比赛支持队员填写个人感想，提交后更新复盘列表

### 阵容页（LineupPage）— 普通队员/队长视角
- **页面目标**: 管理和查看球队阵容与球员状态
- **功能点**:
  - **球员列表展示**: 左侧展示全部队员，含号码、位置、身体状态徽章（健康/疲劳/轻伤/伤病）、黄牌累计、停赛状态标识
  - **阵容编排（仅队长）**: 右侧球场阵型图支持拖拽球员到指定位置，停赛球员置灰不可拖拽；支持一键清空、保存草稿
  - **发布阵容（仅队长）**: 队长点击「发布阵容」后，向全队推送站内消息提醒；普通队员视角下阵容只读，不可编辑
  - **AI阵容推荐（仅队长）**: 点击「AI推荐阵容」按钮触发加载，生成推荐阵容草稿填充到阵型图，队长可编辑后确认发布
  - **AI阵容分析**: 点击「AI分析」按钮对当前编排阵容给出评价和建议（流式输出）
  - **停赛校验**: 拖拽或AI推荐时自动过滤停赛球员，给出提示

### 阵容页（LineupPage）— 协会人员视角（赛事管理面板）
- **页面目标**: 管理赛程录入、比赛结果与赛事纪实文稿
- **功能点**:
  - **赛程文件上传与AI解析**: 文件选择器仅接受 .txt/.docx，选择其他格式弹出拒绝原因提示；上传后触发AI解析（加载动画），解析完成弹出可编辑表单（时间/地点/主队/客队），确认后写入赛程列表
  - **赛程列表管理**: 表格展示所有已入库赛程，支持行内编辑时间、地点、对阵队伍
  - **比赛结果录入**: 已结束/进行中赛程可录入结果，表单含比分、进球记录（球员+时间，可增删多条）、红黄牌记录（球员+时间+类型，可增删多条）；提交后自动重算积分榜、累计球员红黄牌、更新停赛状态
  - **赛事纪实文稿生成与管理**: 已录入结果的比赛可一键AI生成文稿草稿，弹窗内可编辑修改，确认发布后出现在约球页文稿列表；文稿列表支持编辑、查看评论
  - **比赛状态变更触发**: 录入结果后比赛状态变更为"已结束"，自动向参赛队员推送填写感想的站内消息

### 约球页（SocialPage）
- **页面目标**: 全赛区公开的约球接龙与赛事纪实阅读
- **功能点**:
  - **约球接龙列表**: 展示全赛区所有约球/约饭接龙，含时间、地点、已报名人数/最低人数、状态（招募中/已成行/已取消）
  - **创建接龙**: 点击「发布接龙」弹出表单（标题、时间、地点、最低参与人数、截止时间），提交后加入列表
  - **接龙报名与取消**: 用户可报名/取消报名，人数实时更新
  - **模拟时间推进**: 提供「模拟截止」按钮，触发后检查人数：达标→状态变已成行+推送一次通知；不足→状态变已取消+持续推送通知（红点+未读数）
  - **消息红点同步**: 未读消息在顶部铃铛显示红点与数量，点击消息中心查看并标记已读
  - **赛事纪实文稿展示**: 右侧列表展示协会发布的文稿，点击打开详情弹窗阅读全文并查看/发表评论（全赛区用户均可评论）

### 个人中心（ProfilePage）
- **页面目标**: 管理个人信息与身体状态
- **功能点**:
  - **身体状态上报**: 单选（健康/疲劳/轻伤/伤病），选择后即时保存同步到阵容页球员列表
  - **擅长位置选择**: 多选（前锋/中场/后卫/门将等），保存后同步
  - **基本信息展示**: 姓名、球衣号码、所属球队
  - **队员状态列表（协会视角）**: 协会人员身份下展示本队所有队员身体状态汇总表格

---

## 数据共享配置

| 存储键名 | 数据说明 | 使用页面 |
|---------|---------|---------|
| `__global_football_currentRole` | 当前用户身份，类型 `'member' | 'captain' | 'association' | 'visitor'` | 全部页面 |
| `__global_football_matches` | 赛程列表，类型 `IMatch[]` | 首页、阵容页（协会） |
| `__global_football_teams` | 球队与积分榜，类型 `ITeam[]` | 首页、阵容页（协会） |
| `__global_football_players` | 球员列表，类型 `IPlayer[]` | 阵容页、个人中心 |
| `__global_football_lineup` | 当前首发阵容，类型 `ILineup` | 阵容页、首页 |
| `__global_football_reviews` | 赛后复盘，类型 `IReview[]` | 首页 |
| `__global_football_articles` | 赛事纪实文稿，类型 `IArticle[]` | 阵容页（协会）、约球页 |
| `__global_football_socialEvents` | 约球接龙，类型 `ISocialEvent[]` | 约球页 |
| `__global_football_messages` | 站内消息，类型 `IMessage[]` | 全部页面（顶部通知） |
| `__global_football_unreadCount` | 未读消息数，类型 `number` | 全部页面（顶部红点） |

```ts
interface IPlayer {
  id: string;
  name: string;
  number: number;
  position: string;           // 场上位置
  preferredPositions: string[]; // 擅长位置
  healthStatus: 'healthy' | 'tired' | 'minor_injury' | 'injured';
  yellowCards: number;        // 黄牌累计
  redCards: number;           // 红牌累计
  isSuspended: boolean;       // 是否停赛
  teamId: string;
}

interface ITeam {
  id: string;
  name: string;
  group: string;              // 小组
  played: number;             // 场次
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface IMatch {
  id: string;
  stage: 'group' | 'knockout'; // 小组赛/淘汰赛
  groupName?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  venue: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  goals?: IGoalRecord[];
  cards?: ICardRecord[];
  aiPrediction?: string;
  aiPreview?: string;
  articleId?: string;
}

interface IGoalRecord {
  id: string;
  playerId: string;
  teamId: string;
  minute: number;
}

interface ICardRecord {
  id: string;
  playerId: string;
  teamId: string;
  minute: number;
  type: 'yellow' | 'red' | 'second_yellow';
}

interface ILineup {
  matchId: string;
  formation: string;          // 如 "4-3-3"
  starters: { position: string; playerId: string }[];
  substitutes: string[];
  status: 'draft' | 'published';
}

interface IReview {
  id: string;
  matchId: string;
  playerId: string;
  authorRole: 'member' | 'captain';
  content: string;
  aiSummary?: string;
  createdAt: string;
}

interface IArticle {
  id: string;
  matchId: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  comments: IComment[];
  createdAt: string;
}

interface IComment {
  id: string;
  articleId: string;
  author: string;
  content: string;
  createdAt: string;
}

interface ISocialEvent {
  id: string;
  title: string;
  type: 'football' | 'dinner';
  time: string;
  venue: string;
  minPlayers: number;
  currentPlayers: string[];   // 报名者ID列表
  deadline: string;
  status: 'recruiting' | 'confirmed' | 'cancelled';
  creatorId: string;
}

interface IMessage {
  id: string;
  userId: string;
  type: 'lineup' | 'review_invite' | 'social' | 'system';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;         // 关联的比赛/接龙ID
}

-------

<scene_type>prototype-app</scene_type>

# UI 设计指南

## 1. 设计推导依据

- **参考意图**: Free Direction —— 无参考材料，从足球赛事与AI助手的产品语义出发自主设计
- **核心情绪 / 应用类型**: 赛场级的精准秩序感 + AI赋能的智能效率感；工具型应用，信息密度高、状态切换频繁
- **独特记忆点**: 草坪绿主色 + 战术板网格底纹的AI草稿态卡片，所有AI产出内容统一用虚线边框 + "草稿"角标 + 确认/取消双按钮，形成"AI提议、人类决策"的视觉契约

## 2. Art Direction

- **方向名**: 战术板科技风
- **Design Style**: Swiss Minimalist + Sport Tech 辅助 —— 足球赛事需要清晰的赛程/积分/阵容数据呈现（瑞士极简的网格秩序），AI能力需要科技感表达（运动科技的锐利与速度）
- **DNA 参数**: 圆角 subtle（`rounded-md`）/ 阴影 subtle（`shadow-sm`）/ 间距 standard（`gap-4` / `p-6`）/ 字体方向 无衬线宽字重跨度 / 装饰手法 战术板细网格底纹、状态色标签、虚线草稿边框
- **应用类型**: Tool —— 顶部Tab导航 + 内容区卡片化布局，信息密度中高

## 3. Color System

**色彩关系**: 草坪绿主色 + 冷灰中性基底 + 暖橙强调（比赛状态/预警）+ 战术板浅灰网格底
**配色设计理由**: 草坪绿承载足球运动语义与主交互CTA，冷灰背景保证数据长时阅读不疲劳，暖橙用于比赛进行中、黄牌、人数不足等动态状态；AI草稿态用浅绿虚线边框区别于正式内容。
**主色推导**: 从足球场草坪提取绿色作为primary，既是足球最核心的视觉符号，也暗示"战术、阵型、赛场"；降低饱和度使其适合后台工具场景，不刺眼。
**使用比例**: 65% 中性 / 25% 辅助（绿灰层次 + 橙状态）/ 10% primary；primary 仅用于主按钮、当前页激活、AI标签、关键状态高亮，不用于边框和链接。

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|---|---|---|---|---|
| bg | `--background` | `bg-background` | hsl(210 20% 97%) | 冷灰底，接近阴天赛场观感 |
| card | `--card` | `bg-card` | hsl(0 0% 100%) | 纯白卡片承载数据与表单 |
| text | `--foreground` | `text-foreground` | hsl(215 25% 15%) | 深墨灰正文，高对比 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(215 15% 45%) | 次级说明、时间、号码 |
| primary | `--primary` | `bg-primary` / `text-primary` | hsl(140 55% 38%) | 草坪绿，主交互/品牌/AI标识 |
| primaryForeground | `--primary-foreground` | `text-primary-foreground` | hsl(0 0% 100%) | 主色上的白色文字 |
| accent | `--accent` | `bg-accent` | hsl(140 30% 94%) | 浅绿，hover/选中/AI草稿底 |
| accentForeground | `--accent-foreground` | `text-accent-foreground` | hsl(140 50% 28%) | accent上的深绿文字 |
| border | `--border` | `border-border` | hsl(214 15% 88%) | 浅灰边界，结构分隔 |

**语义色提示**:
- 进行中/警告（橙）: `bg hsl(30 90% 95%)` / `border hsl(30 85% 70%)` / `text hsl(25 85% 35%)` —— 饱和度与primary对齐，用于比赛进行中、黄牌、人数不足预警
- 成功/已结束（深绿）: `bg hsl(140 40% 94%)` / `border hsl(140 45% 65%)` / `text hsl(140 55% 28%)` —— 同色系衍生，用于已结束、胜利、发布成功
- 错误/红牌（红）: `bg hsl(0 70% 96%)` / `border hsl(0 75% 75%)` / `text hsl(0 70% 38%)` —— 饱和度略高于primary ±10%，用于红牌、停赛、错误提示
- 未开赛（蓝灰）: `bg hsl(210 30% 94%)` / `border hsl(210 20% 78%)` / `text hsl(215 25% 38%)` —— 冷调低饱和，用于待开赛、待确认状态
- AI草稿态: 统一使用 `border-dashed border-primary/50 bg-accent/30` + "草稿"角标，贯穿赛前攻略、预测、阵容推荐、复盘总结、赛事文稿、赛程解析全部AI输出

## 4. 字体与节奏

- **font-display**: Space Grotesk —— 带几何科技感的宽字重无衬线，用于大标题、比分、积分榜数字，呼应运动+AI的双重语义
- **font-body**: Noto Sans SC —— 中文正文清晰易读，适合赛程描述、复盘文字、表单标签
- **字号**: H1 text-3xl ~ text-4xl；H2 text-xl ~ text-2xl；body text-sm ~ text-base；muted text-xs ~ text-sm；比分数字 text-5xl font-bold。
- **圆角**: 中（`rounded-md`）—— 卡片、按钮、输入框统一中等圆角；徽章、状态标签用 `rounded-full`；AI草稿卡片用虚线圆角边框。

## 5. 全局布局契约

- **Reference Layout Use**: 按需求结构推导，四个一级页面（首页/阵容/约球/个人中心）+ 顶部身份切换 + 消息中心入口
- **Page / Section Order**: 首页（赛程Tab+积分榜+赛后复盘）→ 阵容页（队员列表+出场阵型+AI推荐）/ 赛事管理面板（赛程上传+赛程列表+结果录入+文稿管理）→ 约球页（接龙列表+发布+纪实文稿）→ 个人中心（身体状态+位置设置）
- **Standard Content Zone**: `max-w-6xl` + `mx-auto` —— 工具型应用，兼顾赛程表格宽度与可读性
- **Shell / Frame Alignment**: 顶部导航栏全宽，内容区与导航内边距对齐（同宽节奏）
- **Padding & Rhythm**: `px-4 md:px-6 py-6 md:py-8`，垂直方向 section 间距 `gap-8`
- **Full-bleed Zones**: 无全宽Hero；所有内容受 Standard Content Zone 约束
- **Local Narrowing**: 表单弹窗、个人中心设置页收窄至 `max-w-xl`；赛事结果录入表单 `max-w-2xl`
- **Overflow Strategy**: 赛程表、积分榜、队员列表使用 `overflow-x-auto`；拖拽排阵区域固定宽高比
- **Flexibility Boundary**: 允许移动端卡片堆叠、Tab横向滚动；不允许切换主色、圆角或阴影系统

## 6. 视觉与动效

- **装饰**: 战术板细网格底纹（仅用于AI草稿卡背景，极低透明度）、状态色竖条（赛程卡左侧表示比赛状态）
- **阴影/边界**: 轻 —— 卡片用 `shadow-sm`，hover 时 `shadow-md`；边界为主分隔方式
- **动效**: 克制 —— 按钮/卡片 hover 有 150ms 颜色过渡；AI生成时显示点阵加载动画；状态切换（比赛结束、接龙取消）有轻量淡入；拖拽排阵有平滑吸附效果

## 7. 组件原则

- 按钮、表单、菜单、卡片必须有 Default / Hover / Active / Focus / Disabled 五态
- AI功能按钮统一带小图标（星星/魔法棒）+ "AI" 前缀文字，主色或outline样式
- AI草稿卡片统一模式：虚线边框 + 右上角"草稿"徽章 + 底部"确认/发布"与"取消/编辑"双按钮
- 身份切换器使用下拉菜单，当前身份以彩色圆点+文字标识（队员灰/队长绿/协会橙）
- 消息红点使用圆形红底白字，未读数大于99显示"99+"
- 空状态、加载态延续战术板网格底纹风格，不用默认插画

## 8. Image Direction

- **Image Role**: 无强制图片需求，优先通过排版、色彩和战术板图形元素建立视觉记忆点
- **Image Art Direction**: 无强制图片需求
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 避免通用足球运动员素材图、无意义草地背景图、商务风团队合影

## 9. Anti-patterns

- **Split personality**: 四个页面各自用不同的卡片圆角、阴影或间距；全站共享同一套视觉系统
- **AI everywhere**: 把所有按钮都做成AI样式、到处飘渐变光效；AI功能是高阶赋能，视觉上用统一的虚线草稿态和AI前缀标识即可，不抢基础业务的注意力
- **Default SaaS drift**: 回到默认蓝按钮、通用紫渐变；用草坪绿 + 战术板网格塑造足球专属的界面气质
- **Mono-hue tyranny**: 主色铺满按钮、tab、icon、边框、链接；按 65-25-10 把 primary 收回到 CTA、AI标识、当前页激活，其余用 accent / 中性色 / 语义状态色
- **Status color drift**: 红黄牌、停赛、胜负状态色饱和度过高刺眼；所有语义色饱和度与 primary 对齐 ±15%
- **Invisible interaction**: 只有 hover 没有 focus-visible；每个可交互元素都要有键盘可见的 focus 环
- **Draft ambiguity**: AI生成内容直接入库或视觉上与正式内容无区别；所有AI产出必须有明确的虚线边框、草稿角标和确认/取消操作