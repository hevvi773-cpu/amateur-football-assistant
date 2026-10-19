# ⚽ 足球 AI 助手

> 面向业余足球赛事赛区的一体化管理工具——赛程、积分榜、阵容、红黄牌、约球等基础业务之上，叠加 AI 赛前预测、战术攻略、阵容推荐、赛后复盘等高阶能力。

**AI-First，而非 AI-Native**：移除大模型后，基础业务（赛程/积分榜/排阵容/红黄牌/约球）依旧可以完整运行；AI 能力属于高阶赋能层。

---

## 🎯 产品定位

校园/业余足球赛事的信息分散在微信群、QQ 群、纸质表格中，赛程录入、积分榜维护、红黄牌累计、停赛状态更新全靠人工。本项目将这些流程集中到一个平台，并在此之上叠加 AI 能力，降低赛前准备和赛后总结的门槛。

### 三类用户

| 角色 | 典型用户 | 核心诉求 |
|------|---------|---------|
| 普通队员 | 参赛球员 | 查看赛程与积分榜、接收阵容通知、上报身体状态、填写赛后感想、参与约球接龙 |
| 队长 | 球队队长/领队 | 编排出场阵容、查看队员状态与停赛、获取 AI 阵容推荐、撰写赛后复盘 |
| 协会人员 | 赛事组织者/裁判组 | 录入赛程、记录比赛结果、管理红黄牌停赛、发布赛事纪实文稿、查看各队总览 |

一个账号可在多个球队中拥有不同身份，支持身份切换（切换仅改变当前视角，不改变数据归属）。

---

## ✨ 核心功能

### 基础业务层（移除 AI 后仍可完整运行）

- **赛程管理**：赛程录入、比赛结果记录、积分榜自动计算
- **阵容编排**：队长编排出场阵容，队员接收通知
- **红黄牌与停赛**：红黄牌自动累计，停赛状态自动更新，无需人工维护
- **约球接龙**：队内约球、报名接龙、人数统计
- **消息通知**：阵容推送、赛后感想邀请、约球通知、未读红点
- **三角色权限隔离**：普通队员 / 队长 / 协会人员，权限判定统一收口到服务层

### AI 能力层（高阶赋能）

| 能力 | 类型 | 说明 |
|------|------|------|
| 比分预测 | 预测类 | 基于自研 ML 模型（非大模型），14 种方法对比；方向预测 2026 赛季留出准确率 ~80.6%（独立复现 81.0%） |
| 赛前战术攻略 | 生成类 | 基于对阵双方历史数据生成战术建议 |
| 阵容推荐 | 生成类 | 结合队员状态、停赛情况、历史出场推荐首发阵容 |
| 赛后复盘总结 | 生成类 | 自动生成比赛复盘文稿 |
| 赛事纪实文稿 | 生成类 | 协会人员一键生成赛事报道 |
| 赛程文件解析 | 生成类 | 上传赛程文件自动解析录入 |

> **技术决策说明**：比分预测采用自研 ML 模型而非大模型，原因是预测任务需要可复现、可校准、可解释的概率输出，大模型在该场景下存在盲测不可复现、概率校准差等问题（详见 ML 实验报告）。

---

## 🛠 技术栈

### 前端

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2 |
| 语言 | TypeScript | 5.9 |
| 构建 | Vite | 8 |
| 样式 | Tailwind CSS | 4.2 |
| 组件库 | shadcn/ui（Radix UI） | — |
| 路由 | react-router-dom | 7.13 |
| 数据可视化 | ECharts + echarts-for-react | 5.6 |
| 动画 | framer-motion + GSAP | 12.38 / 3.15 |
| 表单 | react-hook-form + zod | 7.72 / 4.3 |
| 图标 | lucide-react | 0.577 |

### 后端（已随仓库交付，FastAPI）

- FastAPI + uvicorn（端口 8000），入口 `backend/run.py`，应用对象 `backend/app/main.py`
- SQLite：`backend/data/football.db`（427 场真实赛事数据，由 `backend/scripts/import_season_records.py` 导入）
- 比分预测：`backend/app/services/prediction.py`，三分类 Softmax 回归（`backend/app/services/softmax_model.py`，纯 Python 零依赖实现），模型文件 `backend/models/prediction_model.pkl` 由 `backend/scripts/train_model.py` 训练产出；文件缺失或推理失败时自动回退启发式（积分 / 净胜球 / 主客场 / 伤停）
- 身份模拟：无登录体系，通过请求头 `X-User-Id` / `X-User-Role` 传递当前身份
- 测试：`backend/tests/`（pytest）
- 大模型配置：`backend/.env`（`AI_MODE` / `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`），未配置时 AI 生成类能力自动降级为内置模板

### 项目结构

```
football-ai-assistant/
├── src/                        # 前端（React 19 + TS + Tailwind 4 + shadcn/ui）
│   ├── app.tsx                 # 路由配置
│   ├── components/             # 公共组件（Header / Layout / ui）
│   ├── pages/                  # 四个主页面
│   │   ├── HomePage/           # 首页（赛程、积分榜、AI 预测）
│   │   ├── LineupPage/         # 阵容页 / 赛事管理（协会身份）
│   │   ├── SocialPage/         # 约球页
│   │   └── ProfilePage/        # 个人中心
│   ├── lib/
│   │   ├── api.ts              # 后端 API 客户端（前端唯一数据出入口）
│   │   └── mappers.ts          # snake_case -> 前端类型映射
│   └── data/                   # 类型定义与兜底数据（运行时数据来自后端）
├── backend/
│   ├── app/
│   │   ├── routers/            # 10 个路由模块（ai / matches / lineup / social ...）
│   │   ├── services/           # 业务服务层（prediction / generators / llm ...）
│   │   ├── models.py           # SQLAlchemy 模型
│   │   └── schemas.py          # Pydantic 出入参
│   ├── scripts/                # 训练与数据导入脚本
│   ├── tests/                  # pytest 冒烟测试
│   ├── data/                   # SQLite 数据库（不纳入版本库）
│   └── models/                 # 训练产物 pkl（不纳入版本库）
├── docs/                       # PRD、ML 实验报告、设计图例
├── football_ml_experiment.ipynb# 可复现 ML 实验 Notebook
├── docker-compose.yml          # Docker 一键部署（前端 8080 / 后端 8000）
├── Dockerfile.frontend         # 前端多阶段镜像（Vite 构建 + nginx 反代）
├── Dockerfile.backend          # 后端镜像
└── nginx.conf                  # nginx 反代与 SPA 路由回退配置
```

---

## 📊 ML 实验亮点

比分预测模型的训练与评估独立成一份严谨的实验报告，核心结论：

| 指标 | 数值（独立复现） |
|------|------|
| 原始赛事数据 | 427 场 |
| 有效入样 | 338 场（双方历史 ≥ 3 场，剔除 89 场，20.8%） |
| 对比方法 | 14 种（逻辑回归、随机森林、平衡权重 LR、规则、基线、泊松 MLE 等） |
| 方向预测留出准确率（主口径） | 81.0%（2026 赛季留出；报告原文 80.6%） |
| 方向预测留出准确率（滚动窗口=5 对照） | 77.8% |
| 泊松 MLE 方向预测（2026 留出） | 75.4% |
| 三分类留出准确率 | 74.6% |
| 概率校准 Brier Score（LR 留出） | 0.146 |
| 概率校准 ECE（LR 留出） | 0.158 |

> 数值均为本仓库 `football_ml_experiment.ipynb` 独立复现结果，与《赛事数据 ML 预测实验报告》原始口径一致（方向预测 80.6%）。报告原文的 76.4%/336 场/Brier 0.138 等为旧口径，以本 Notebook 复现值为准。

**实验方法的严谨性**：
- 混淆矩阵 + McNemar 检验（方法间差异显著性，LR vs 规则 p=0.0077）
- Wilson 置信区间（点估计的不确定性）
- 概率校准评估（Brier / ECE）
- 泊松比分模型（不仅预测方向，还给出预期比分与总进球）
- 样本流失分析（89 场因历史不足被剔除的影响）

**诚实的局限性**（实验报告中明确承认，Notebook 亦复现）：
- 三分类（胜/平/负）学不出平局——平局样本少且特征不明显，模型倾向于预测胜负（三分类留出 74.6%，多数来自胜负正确）
- 小样本不确定性——2026 留出仅 63–65 场，置信区间较宽（方向 81.0% 的 CI≈[69.6, 88.8]），点估计不宜过度解读
- 随机森林在 63 场留出集上达 100% 为小样本 + 强信号下的偶然，并非稳健泛化证据
- 实验导出的部署模型（`score_predictor.pkl`，随机森林查表式）对新赛季 / 未充分交锋的球队泛化有限，因此**线上服务并未采用它**；`backend` 实际使用 `scripts/train_model.py` 从数据库重新训练的 Softmax 回归，两者是不同模型，不要混为一谈
- LLM 盲测不可复现——大模型预测结果在重复测试中不一致，不适合需要可复现的预测场景

---

## 🚀 快速开始

### 前置要求

- Node.js ≥ 18、npm
- Python ≥ 3.11（后端）
- 或直接使用 Docker + Docker Compose

### 方式一：Docker 一键部署（推荐）

```bash
# 0. 配置大模型（可选，不配则 AI 生成类能力走内置模板）
cp .env.example .env   # 编辑 .env 填入 LLM_API_KEY 等

# 1. 构建镜像（compose 引用的是本地已构建的镜像名，首次必须先构建）
docker build -f Dockerfile.backend  -t football-ai-backend:latest  .
docker build -f Dockerfile.frontend -t football-ai-frontend:latest .

# 2. 启动
docker compose up -d
```

访问 <http://localhost:8080>。nginx 将 `/api` 反代到后端容器，前端无需关心后端地址。

> 两个 Dockerfile 的构建上下文都是**仓库根目录**。本仓库前端为扁平结构（`src/`、`public/`、`shared/`、`scripts/` 直接在根目录），不存在 `frontend/` 子目录。

### 方式二：本地前后端分离

```bash
# --- 后端（端口 8000）---
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows；macOS/Linux 用 source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # 可选，配置大模型
python run.py

# --- 前端（端口 8001）---
npm install
npm run dev:win
```

> ⚠️ **已知问题**：`src/lib/api.ts` 中 `API_BASE` 硬编码为 `http://localhost:8010/api`，该值仅在 Docker 构建时被 `Dockerfile.frontend` 替换为相对路径 `/api`。本地分离开发时前端会请求 8010 端口而后端实际监听 8000，需要在 `vite.config.ts` 中补一条 `server.proxy` 把 `/api` 转发到 `http://localhost:8000`，或将 `API_BASE` 改为读取环境变量。此问题尚未修复。

### 环境变量

后端 AI 能力配置（`backend/.env`，可选；未配置时自动降级为 mock / 内置模板）：

```
AI_MODE=auto
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
```

> 未配置 API Key 时，AI 生成类能力返回 mock 数据，不影响基础业务功能。

---

## 📁 相关文档

| 文档 | 说明 |
|------|------|
| [足球AI助手 产品需求文档（PRD）V1.1.docx](docs/足球AI助手%20产品需求文档（PRD）V1.1.docx) | 完整 PRD（To-be 设计稿，628 段，含权限矩阵、功能详述、验收标准） |
| [足球AI助手 产品需求文档（PRD）.pdf](docs/足球AI助手%20产品需求文档（PRD）.pdf) | PRD PDF 版（适合快速浏览与分发） |
| [赛事数据ML预测实验报告.html](docs/赛事数据ML预测实验报告.html) | ML 模型训练与评估的完整实验报告 |
| [football_ml_experiment.ipynb](football_ml_experiment.ipynb) | **可复现实验 Notebook**（14 种方法、Wilson/ McNemar/ Brier/ ECE、泊松 MLE，并导出 score_predictor.pkl） |
| [赛事纪录汇总.xlsx](docs/赛事纪录汇总.xlsx) | 427 场原始赛事数据 |
| [足球助手图例/](docs/足球助手图例/) | 系统架构图、数据库 ER 图、数据流图等设计图（PNG） |

---

## ⚠️ 项目状态说明

本项目为课程设计项目，当前状态：

- ✅ 前端四页面已实现（React 19 + TS，数据经 `lib/api.ts` 全部走后端）
- ✅ 后端 FastAPI 完整交付：10 个路由模块、三角色权限、SQLite 真实赛事数据、pytest 冒烟测试
- ✅ Docker 一键部署（前端 nginx 8080 反代 / 后端 8000）
- ✅ 比分预测使用自研 Softmax 回归（`backend/scripts/train_model.py` 训练），非大模型
- 🚧 AI 生成类能力（战术攻略 / 阵容推荐 / 赛后复盘）在未配置 API Key 时走内置模板，接入真实大模型后可切换
- 🚧 `prediction_model.pkl` 未纳入版本库，克隆后需执行 `cd backend && python scripts/train_model.py` 生成本地模型，否则自动回退启发式
- 🚧 本地分离开发时前端 API 基地址与后端端口不一致（见「快速开始」中的已知问题）

> 本项目的核心价值在于：完整的产品设计思维（PRD + 三角色权限 + AI-First 架构）+ 严谨的 ML 实验方法论（14 种方法对比 + 诚实的局限性分析），而非功能的完整上线。

---

## 📄 License

MIT
