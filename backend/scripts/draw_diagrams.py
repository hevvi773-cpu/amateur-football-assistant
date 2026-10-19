"""生成足球AI助手项目图例（架构图 / ER图 / 数据流图），输出到桌面"足球助手图例"文件夹。"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle

plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "Arial Unicode MS"]
plt.rcParams["axes.unicode_minus"] = False

OUT = Path(r"C:\Users\34602\Desktop\足球助手图例")
OUT.mkdir(parents=True, exist_ok=True)

# 主题色
C_PRIMARY = "#2563eb"
C_FRONT = "#eff6ff"
C_BACK = "#f0fdf4"
C_DATA = "#fefce8"
C_AI = "#fdf2f8"
C_EXT = "#f5f3ff"
C_LINE = "#475569"
C_TEXT = "#1e293b"
C_SUB = "#64748b"


def _box(ax, x, y, w, h, fc, ec, title, subtitle=None, title_fs=13, text_fs=9.5, lw=1.6):
    p = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02,rounding_size=0.06",
        linewidth=lw, edgecolor=ec, facecolor=fc, zorder=2,
    )
    ax.add_patch(p)
    ax.text(x + w / 2, y + h - 0.16, title, ha="center", va="top",
            fontsize=title_fs, fontweight="bold", color=C_TEXT, zorder=3)
    if subtitle:
        ax.text(x + w / 2, y + 0.10, subtitle, ha="center", va="bottom",
                fontsize=text_fs, color=C_SUB, zorder=3, linespacing=1.5)


def _arrow(ax, x1, y1, x2, y2, color=C_LINE, lw=1.6, style="-|>", ls="-", label=None, label_dx=0.0, label_dy=0.0):
    a = FancyArrowPatch(
        (x1, y1), (x2, y2), arrowstyle=style, mutation_scale=14,
        linewidth=lw, color=color, linestyle=ls, zorder=1,
    )
    ax.add_patch(a)
    if label:
        ax.text((x1 + x2) / 2 + label_dx, (y1 + y2) / 2 + label_dy, label,
                fontsize=8.5, color=C_SUB, ha="center", va="center", zorder=4,
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.9))


# ============================== 1. 系统架构图 ==============================
def draw_architecture():
    fig, ax = plt.subplots(figsize=(15, 9.2))
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 9.2)
    ax.axis("off")
    ax.set_title("足球AI助手 · 系统架构图", fontsize=17, fontweight="bold", color=C_TEXT, pad=14)

    # 用户层
    _box(ax, 0.4, 8.35, 14.2, 0.65, "#f8fafc", "#cbd5e1", "用户层：浏览器（桌面端 / 移动端）", "访问 http://localhost:8001（Vite 开发服务器）", title_fs=12)
    _arrow(ax, 7.5, 8.3, 7.5, 7.95)

    # 前端层
    _box(ax, 0.4, 5.15, 14.2, 2.75, C_FRONT, C_PRIMARY, "前端层 · React 18 + TypeScript + Vite", title_fs=12)
    fe = [
        (0.7, 7.35, "首页 · 赛程总览", "赛程/本队赛程/积分榜\n赛后复盘/协会面板\nAI攻略·预测弹窗"),
        (3.9, 7.35, "阵容管理", "4-3-3 阵型编排\nAI 一键推荐阵容\n替补席管理"),
        (7.1, 7.35, "约球接龙", "发起/报名约球\n截止提醒"),
        (10.3, 7.35, "个人中心", "身体状态上报\n技术特点维护"),
    ]
    for x, y, t, s in fe:
        _box(ax, x, y, 2.9, 1.55, "white", C_PRIMARY, t, s, title_fs=10.5, text_fs=8.8, lw=1.2)
    # 前端基础设施
    _box(ax, 0.7, 5.42, 5.6, 1.15, "white", "#93c5fd", "全局状态 AppContext", "全能账号（身份：队员/队长/协会/访客 + 所属球队）\nPromise.allSettled 9 路并行拉取 · localStorage 持久化", title_fs=10, text_fs=8.6, lw=1.2)
    _box(ax, 6.6, 5.42, 4.4, 1.15, "white", "#93c5fd", "API 客户端 api.ts + mappers.ts", "REST 请求封装 · 字段映射\n「后端已连接/本地模拟」数据源徽章", title_fs=10, text_fs=8.6, lw=1.2)
    _box(ax, 11.3, 5.42, 3.0, 1.15, "white", "#93c5fd", "UI 组件库", "shadcn/ui · Tailwind\nlucide 图标 · sonner 提示", title_fs=10, text_fs=8.6, lw=1.2)
    _arrow(ax, 7.5, 5.1, 7.5, 4.55, label="HTTP / JSON (REST /api)", label_dy=-0.28)

    # 后端层
    _box(ax, 0.4, 1.95, 10.6, 2.6, C_BACK, "#16a34a", "后端层 · FastAPI（uvicorn，端口 8000）", title_fs=12)
    routers = "matches · standings · players · lineup · reviews · articles · social · notifications · ai"
    _box(ax, 0.7, 3.55, 10.0, 0.62, "white", "#4ade80", "路由层 /api（依赖注入 Session · 角色权限 X-User-Role）", routers, title_fs=10, text_fs=8.2, lw=1.2)
    svc = [
        (0.7, 2.16, "prediction.py", "Softmax 三分类\n比分预测"),
        (3.35, 2.16, "llm.py", "LLM 调用封装\n未配 Key 时 mock 降级"),
        (6.0, 2.16, "generators.py", "战术攻略 / 赛程解析"),
        (8.65, 2.16, "cards.py · formations.py", "红黄牌/停赛规则\n默认阵型"),
    ]
    for x, y, t, s in svc:
        _box(ax, x, y, 2.45, 1.12, "white", "#4ade80", t, s, title_fs=9.6, text_fs=8.4, lw=1.2)
    _arrow(ax, 7.5, 1.9, 7.5, 1.35)

    # 外部能力（右侧列）
    _box(ax, 11.3, 2.6, 3.3, 1.95, C_AI, "#db2777", "外部能力", "ML 模型 prediction_model.pkl\n（训练集准确率 76.4%）\nLLM API（可配置 DASHSCOPE_API_KEY）", title_fs=11, text_fs=8.8)
    _arrow(ax, 10.65, 3.2, 11.25, 3.2, color="#db2777", ls="--", label="预测/生成", label_dy=0.22)

    # 数据层
    _box(ax, 0.4, 0.15, 10.6, 1.1, C_DATA, "#ca8a04", "数据层 · SQLite（backend/data/football.db）", "60 支真实学院队 · 427 场真实赛事 · 导入脚本/备份（football.db.bak_*）", title_fs=11, text_fs=8.8)
    _arrow(ax, 11.3, 2.55, 11.3, 1.5, color="#ca8a04", ls="--", label="读写", label_dx=-0.05)

    fig.tight_layout()
    fig.savefig(OUT / "01-系统架构图.png", dpi=170, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("01-系统架构图.png")


# ============================== 2. ER 图 ==============================
def _entity(ax, x, y, w, h, name, fields, fc=C_FRONT, ec=C_PRIMARY, name_fs=11, field_fs=8.2):
    p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.06",
                       linewidth=1.5, edgecolor=ec, facecolor=fc, zorder=2)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h - 0.13, name, ha="center", va="top",
            fontsize=name_fs, fontweight="bold", color="white", zorder=3)
    ax.add_patch(Rectangle((x + 0.02, y + h - 0.34), w - 0.04, 0.34, facecolor=ec, edgecolor=ec, zorder=2.5))
    ax.text(x + 0.13, y + h - 0.52, fields, ha="left", va="top", fontsize=field_fs,
            color=C_TEXT, zorder=3, family="monospace", linespacing=1.55)


def _rel(ax, x1, y1, x2, y2, label, color=C_LINE, lw=1.3):
    a = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=12,
                        linewidth=lw, color=color, zorder=1, shrinkA=0, shrinkB=0)
    ax.add_patch(a)
    ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.06, label, fontsize=7.6, color=C_SUB,
            ha="center", va="center", zorder=4,
            bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none", alpha=0.92))


def draw_er():
    fig, ax = plt.subplots(figsize=(17.5, 11.5))
    ax.set_xlim(0, 17.5)
    ax.set_ylim(0, 11.5)
    ax.axis("off")
    ax.set_title("足球AI助手 · 数据库 ER 图（11 张表）", fontsize=17, fontweight="bold", color=C_TEXT, pad=14)

    # 列布局：5 列 x 3 行
    # 列1
    _entity(ax, 0.3, 7.9, 3.1, 3.1, "Team 球队",
            "id PK\nname\n\"group\"\ncaptain_id FK")
    _entity(ax, 0.3, 4.15, 3.1, 3.25, "Player 球员",
            "id PK\nname\nnumber\nteam_id FK → Team\nposition\npersonal_traits\nhealth_status\nyellow_cards\nred_cards\nis_suspended")
    _entity(ax, 0.3, 0.55, 3.1, 3.1, "SocialEvent 约球",
            "id PK\ntitle\ntype\ntime\nvenue\nmin_players\ncurrent_players\nstatus\ncreator_id FK → Player")
    # 列2
    _entity(ax, 4.0, 7.9, 3.1, 3.1, "Match 比赛",
            "id PK\nstage\ngroup_name\nhome_team_id FK → Team\naway_team_id FK → Team\nhome_score\naway_score\ntime\nvenue\nstatus")
    _entity(ax, 4.0, 4.15, 3.1, 2.6, "Goal 进球",
            "id PK\nmatch_id FK → Match\nplayer_id FK → Player\nminute")
    _entity(ax, 4.0, 0.55, 3.1, 2.6, "Card 红黄牌",
            "id PK\nmatch_id FK → Match\nplayer_id FK → Player\nminute\ntype")
    # 列3
    _entity(ax, 7.7, 7.9, 3.1, 3.1, "Lineup 阵容",
            "id PK\nmatch_id FK → Match\nteam_id FK → Team\nformation\nslots JSON\nsubstitutes JSON\nstatus\npublished_at")
    _entity(ax, 7.7, 4.15, 3.1, 2.6, "Review 赛后感想",
            "id PK\nmatch_id FK → Match\nplayer_id FK → Player\nauthor_role\ncontent\ncreated_at")
    _entity(ax, 7.7, 0.55, 3.1, 2.6, "Notification 消息",
            "id PK\nuser_id FK\nrelated_id\ntype\ntitle\ncontent\nis_read\ncreated_at")
    # 列4
    _entity(ax, 11.4, 7.9, 3.1, 2.6, "Article 文稿",
            "id PK\nmatch_id FK → Match\ntitle\ncontent\nstatus\ncreated_at")
    _entity(ax, 11.4, 4.15, 3.1, 2.6, "Comment 评论",
            "id PK\narticle_id FK → Article\nauthor\ncontent\ncreated_at")

    # 关系
    _rel(ax, 3.4, 9.1, 4.0, 9.1, "1:N 主/客队")
    _rel(ax, 3.4, 5.6, 4.0, 5.6, "1:N")
    _rel(ax, 3.4, 8.2, 4.0, 8.55, "1:N")
    _rel(ax, 3.4, 5.0, 4.0, 5.35, "1:N")
    _rel(ax, 3.4, 2.5, 4.0, 2.5, "1:N 创建")
    _rel(ax, 7.1, 9.0, 7.7, 9.0, "1:N")
    _rel(ax, 7.1, 9.4, 7.7, 9.3, "1:N")
    _rel(ax, 7.1, 5.5, 7.7, 5.5, "1:N")
    _rel(ax, 7.1, 5.9, 7.7, 5.6, "1:N")
    _rel(ax, 7.1, 2.6, 7.7, 2.6, "1:N")
    _rel(ax, 10.8, 8.9, 11.4, 8.9, "1:N")
    _rel(ax, 10.8, 9.2, 11.4, 9.2, "1:N")
    _rel(ax, 12.9, 7.9, 12.9, 6.9, "1:N")

    fig.tight_layout()
    fig.savefig(OUT / "02-数据库ER图.png", dpi=170, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("02-数据库ER图.png")


# ============================== 3. 数据流图 ==============================
def draw_dataflow():
    fig, ax = plt.subplots(figsize=(15, 7.6))
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 7.6)
    ax.axis("off")
    ax.set_title("真实赛事数据流向图（427 场校园足球数据如何进入系统）", fontsize=16, fontweight="bold", color=C_TEXT, pad=14)

    # 源头
    _box(ax, 0.4, 5.3, 3.0, 1.9, C_DATA, "#ca8a04", "赛事纪录 Excel", "26-22赛事纪录汇总.xlsx\n427 场比赛 · 60 支学院队", title_fs=10.5, text_fs=9)
    _box(ax, 0.4, 2.9, 3.0, 1.5, C_DATA, "#ca8a04", "训练数据", "427 场真实赛果\n（训练集准确率 76.4%）", title_fs=10.5, text_fs=9)

    # 导入/训练
    _box(ax, 4.1, 5.3, 3.0, 1.9, C_FRONT, C_PRIMARY, "导入脚本 import_*.py", "TEAM_ALIASES 别名归一化\n（约 40 条别名 → 60 支真实队）", title_fs=10.5, text_fs=9)
    _box(ax, 4.1, 2.9, 3.0, 1.5, C_AI, "#db2777", "训练脚本 train_model.py", "Softmax 三分类模型\nprediction_model.pkl", title_fs=10.5, text_fs=9)

    # 存储
    _box(ax, 7.9, 5.3, 3.0, 1.9, C_BACK, "#16a34a", "SQLite 数据库", "teams 60 · matches 427\n实时计算积分榜", title_fs=10.5, text_fs=9)
    _box(ax, 7.9, 2.9, 3.0, 1.5, "#f8fafc", "#94a3b8", "模型文件", "backend/models/\nprediction_model.pkl", title_fs=10.5, text_fs=9)

    # 消费端
    _box(ax, 11.7, 5.3, 3.0, 1.9, C_FRONT, C_PRIMARY, "前端页面", "赛程总览/本队赛程\n积分榜 · 复盘 · 阵容\n（真实数据实时渲染）", title_fs=10.5, text_fs=9)
    _box(ax, 11.7, 2.9, 3.0, 1.5, C_AI, "#db2777", "AI 比分预测", "/api/ai/predict\n胜平负概率 + 预测比分", title_fs=10.5, text_fs=9)

    # 数据流箭头
    _arrow(ax, 3.45, 6.3, 4.05, 6.3, label="读取+清洗")
    _arrow(ax, 3.45, 3.65, 4.05, 3.65, label="读取")
    _arrow(ax, 7.15, 6.3, 7.85, 6.3, label="批量入库\n（幂等）")
    _arrow(ax, 7.15, 3.65, 7.85, 3.65, label="训练产出")
    _arrow(ax, 10.95, 6.3, 11.65, 6.3, label="REST /api")
    _arrow(ax, 10.95, 3.65, 11.65, 3.65, label="加载模型")
    _arrow(ax, 13.2, 4.6, 13.2, 5.25, color="#94a3b8", ls="--", label="预测结果", label_dx=0.9, label_dy=0.1)

    # 备注
    ax.text(7.5, 1.35, "AI 文字内容（战术攻略 / 感想总结）：配置 LLM Key 后走大模型；未配置时自动降级为本地模板（mock），不影响预测模型与真实数据展示。",
            ha="center", fontsize=9, color=C_SUB,
            bbox=dict(boxstyle="round,pad=0.4", fc="#f8fafc", ec="#cbd5e1"))

    fig.tight_layout()
    fig.savefig(OUT / "03-数据流图.png", dpi=170, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("03-数据流图.png")


if __name__ == "__main__":
    draw_architecture()
    draw_er()
    draw_dataflow()
    print("输出目录:", OUT)
