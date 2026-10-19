# -*- coding: utf-8 -*-
"""从 26赛事纪录.docx 战报解析 2026 年参赛球员并写入 players 表（v2）。

改进点:
  1. 队简称用「最长优先 alternation」匹配，避免 '体育学院研究生队' 被切成 '体育学院'
  2. 球员归属改为「比赛块内最近简称」，避免跨比赛污染
  3. 名字截断：动作词表 + 无命中时取前 4 字兜底；含·长名特殊处理
  4. 冲突归并：同队同号下保留最短名（前缀变体合并）

用法:
  python import_players_2026.py             # dry-run，只写 draft json
  python import_players_2026.py --commit    # 解析并写库（幂等）
  python import_players_2026.py --commit --replace  # 清空 players 后重导
"""
import argparse
import collections
import hashlib
import json
import re
import sqlite3
import zipfile
from pathlib import Path

DOCX = Path(r"C:\Users\34602\OneDrive\Documents\项目2.0\26-22赛事纪录\26赛事纪录.docx")
DB = Path(r"C:\Users\34602\PyCharmProjects\football-ai-assistant\backend\data\football.db")
OUT_JSON = Path(r"C:\Users\34602\PyCharmProjects\football-ai-assistant\backend\data\players_2026_draft.json")

TEAM_ALIASES = {
    "AI学院": "人工智能学院", "人工智能(AI)学院": "人工智能学院",
    "人工智能（AI）学院": "人工智能学院",
    "农学与生物科技院": "农学与生物科技学院",
    "创新创业含弘学院": "创新创业学院",
    "创新创业学院 含弘学院": "创新创业学院",
    "动物医学院": "动物医学学院",
    "动物科学技术学院": "动物科学学院",
    "动物科技学院": "动物科学学院",
    "动科": "动物科学学院",
    "历史与文化学院": "历史文化学院",
    "历史文化学院 民族学院": "历史文化学院",
    "商贸院": "商贸学院",
    "园林园艺学院": "园艺园林学院",
    "心理学部": "心理学院",
    "数学与统计学学院": "数学与统计学院",
    "数学统计学院": "数学与统计学院",
    "新闻与传媒学院": "新闻传媒学院",
    "材料能源学院": "材料与能源学院",
    "桑蚕纺织与生物质学院": "蚕桑纺织与生物质科学学院",
    "蚕桑纺织与生物质学院": "蚕桑纺织与生物质科学学院",
    "蚕桑纺织与生物质科学学院院": "蚕桑纺织与生物质科学学院",
    "蚕生院": "蚕桑纺织与生物质科学学院",
    "物理科学学院": "物理科学与技术学院",
    "物理科学与技术学院院": "物理科学与技术学院",
    "物理科学技术学院": "物理科学与技术学院",
    "电信院": "电子信息工程学院",
    "电子信息学院": "电子信息工程学院",
    "西塔足球队": "西塔学院",
    "计信院": "计算机与信息科学学院",
    "计信学院": "计算机与信息科学学院",
    "计算机与信息技术学院": "计算机与信息科学学院",
    "计算机与信息技术学院 软件学院": "计算机与信息科学学院",
    "计算机与信息科学学院 软件学院": "计算机与信息科学学院",
    "计算机信息科学学院": "计算机与信息科学学院",
    "计算机信息科学学院 软件学院": "计算机与信息科学学院",
    "资源与环境学院": "资源环境学院",
    "植保学院": "植物保护学院",
    "植保院": "植物保护学院",
    "生物科学学院": "生命科学学院",
    "体院研究生": "体育学院研究生队",
    "体院研究生队": "体育学院研究生队",
    "体育学院研究生": "体育学院研究生队",
    "体育研究生": "体育学院研究生队",
    "体育学院研究生联队": "体育学院研究生队",
    # docx 战报补充
    "工院": "工程技术学院",
    "化院": "化学化工学院",
    "地科": "地理科学学院",
    "地科院": "地理科学学院",
    "地科学院": "地理科学学院",
    "新传": "新闻传媒学院",
    "新传院": "新闻传媒学院",
    "美院": "美术学院",
    "资环院": "资源环境学院",
    "马院": "马克思主义学院",
    "国治院": "国家治理学院",
    "动科院": "动物科学学院",
    "经管院": "经济管理学院",
    "数统院": "数学与统计学院",
    "物科院": "物理科学与技术学院",
    "历院": "历史文化学院",
    "历史学院": "历史文化学院",
    "农生院": "农学与生物科技学院",
    "生科院": "生命科学学院",
    "体教": "体育学院体育教育队",
    "体育教育": "体育学院体育教育队",
    # 战报中省略"院"字的简称
    "计信": "计算机与信息科学学院",
    "蚕生": "蚕桑纺织与生物质科学学院",
    "商贸": "商贸学院",
    "材料学院": "材料与能源学院",
    "材料院": "材料与能源学院",
    "计科": "计算机与信息科学学院",
    "生科": "生命科学学院",
    "植保": "植物保护学院",
    "体研": "体育学院研究生队",
    "资环": "资源环境学院",
    "化工": "化学化工学院",
    "数统": "数学与统计学院",
    "物科": "物理科学与技术学院",
    "食品": "食品科学学院",
    "体妍": "体育学院研究生队",  # 战报中"体研"的错别字写法
    "国际": "国际学院",
    "西塔学院": "西塔学院",
    "文学院": "文学院",
    "国际学院": "国际学院",
    "法学院": "法学院",
    "教育学部": "教育学部",
    "外院": "外国语学院",
    "商贸学院": "商贸学院",
    "创新创业学院": "创新创业学院",
    "水产学院": "水产学院",
    "材料与能源学院": "材料与能源学院",
    "人工智能学院": "人工智能学院",
    "心理学院": "心理学院",
    "动物医学学院": "动物医学学院",
    "食品科学学院": "食品科学学院",
    "园艺园林学院": "园艺园林学院",
    "植物保护学院": "植物保护学院",
    "药学院": "药学院",
}

FULL_TEAM_NAMES = {
    "人工智能学院", "农学与生物科技学院", "创新创业学院", "动物医学学院",
    "动物科学学院", "化学化工学院", "历史文化学院", "商贸学院", "园艺园林学院",
    "国家治理学院", "国际学院", "地理科学学院", "外国语学院", "工程技术学院",
    "心理学院", "教育学部", "数学与统计学院", "文学院", "新闻传媒学院",
    "材料与能源学院", "植物保护学院", "水产学院", "法学院", "物理科学与技术学院",
    "生命科学学院", "电子信息工程学院", "经济管理学院", "美术学院",
    "蚕桑纺织与生物质科学学院", "西塔学院", "计算机与信息科学学院",
    "资源环境学院", "食品科学学院", "马克思主义学院", "药学院",
    "体育学院研究生队", "体育学院体育教育队",
}

_ALL_ABBR = sorted(set(TEAM_ALIASES) | FULL_TEAM_NAMES, key=len, reverse=True)
ABBR_RE = re.compile("(" + "|".join(re.escape(a) for a in _ALL_ABBR) + ")")

SCORE_PAT = re.compile(r"\d{1,2}\s*[:：]\s*\d{1,2}")

PAT_ABBR = re.compile(
    ABBR_RE.pattern + r"(\d{1,2})号"
    r"(球员|门将|后卫|前锋|中场|守门员)?([\u4e00-\u9fa5·]{2,14})")
PAT_NUM = re.compile(
    r"(\d{1,2})号(球员|门将|后卫|前锋|中场|守门员)?([\u4e00-\u9fa5·]{2,14})")
PAT_EN = re.compile(r"(\d{1,2})号(?:球员|门将|后卫|前锋|中场)?([A-Za-z][A-Za-z .]{1,29})")
PAT_EN_REV = re.compile(r"(\d{1,2})([A-Za-z][A-Za-z .]{1,29})号")

# 平票重名的跨队归属修正：(号码, 名字) -> 正确队伍
OVERRIDES = {
    (13, "张疆华"): "国家治理学院",   # 两处上下文均为国治院进攻（生科院为对手）
    (88, "Jerry"): "蚕桑纺织与生物质科学学院",  # 战报明确写"蚕生院88号Jerry"
}


def abbr_to_team(abbr):
    if abbr in TEAM_ALIASES:
        return TEAM_ALIASES[abbr]
    if abbr in FULL_TEAM_NAMES:
        return abbr
    # "资环院队""国治院队""植保队" 等带"队"后缀写法 → 去掉"队"再查
    if abbr.endswith("队") and len(abbr) > 2:
        return abbr_to_team(abbr[:-1])
    return None


def docx_text(p):
    with zipfile.ZipFile(p) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="replace")
    xml = xml.replace("</w:p>", "\n")
    return re.sub(r"<[^>]+>", "", xml)


ACTION_WORDS = [
    "一蹴而就", "应声入网", "凭借个人能力", "连停带过", "向前穿插", "用身体卡住",
    "禁区内", "禁区外", "禁区前沿", "前点甩头", "嗅觉灵敏", "灵动挑球", "巧妙化解",
    "站在", "抓住", "抓住空档", "突施冷箭", "获得单刀", "不断冲刺", "连续过人",
    "小角度", "倒地铲射", "凌空抽射", "转身抽射", "突入禁区", "过掉", "过掉防守",
    "接队友传球", "接队友", "接住", "拿球", "得球", "停球", "趟球", "带球",
    "持球", "接球", "传中", "直塞", "传控", "分球", "出球", "回传", "转移",
    "调度", "推进", "加速", "内切", "下底", "变向", "护球", "摆脱", "晃过",
    "拦截", "破坏", "顶出", "挡出", "扑出", "扑救", "扑住", "没收", "抱住",
    "拿住", "控球", "突破", "过人", "抢断", "解围", "卡位", "封堵", "防守",
    "进攻", "反击", "组织", "制造", "造成", "把握", "寻觅", "发起", "发动",
    "形成", "展开", "打出", "完成", "送上", "给出", "找到", "给到", "传给",
    "横敲", "做球", "挑传", "斜传", "长传", "短传", "回敲", "跟进", "接应",
    "配合", "破门", "推射", "抽射", "头球", "捅射", "垫射", "补射", "兜射",
    "搓射", "吊射", "远射", "爆射", "劲射", "射门", "攻门", "打门", "起脚",
    "射偏", "高出", "横梁", "立柱", "挥霍", "错失", "连续", "再次", "随后",
    "随即", "立即", "马上", "最终", "一度", "率先", "成功", "险些", "可惜",
    "稍稍", "稳稳", "冷静", "果断", "精彩", "犀利", "精准", "漂亮", "完美",
    "大力", "高速", "突然", "猛冲", "迅速", "快速", "极速", "及时", "上前",
    "一脚", "一记", "帮助", "扳平", "反超", "绝杀", "制胜", "首开", "扩大",
    "锁定", "半场", "全场", "比分", "改写", "斩获", "收获", "建功", "得手",
    "破网", "中的", "压上", "回防", "追防", "上抢", "紧逼", "盯防", "协防",
    "补防", "站位", "插上", "后插上", "回撤", "前插", "主罚", "罚进", "罚球",
    "犯规", "黄牌", "红牌", "被换下", "换下", "换上", "替补", "登场", "受伤",
    "倒地", "离场", "追逐", "回追", "抢点", "包抄", "斜插", "回做",
    "做墙", "撞墙", "人球分过", "马赛回旋", "踩单车", "油炸丸子", "挑球",
    "垫球", "倒钩", "凌空", "半转身", "转身", "突入", "前点", "后点", "远角",
    "近角", "上角", "下角", "死角", "中柱", "边网", "顶入", "铲射",
    "贴地", "半高球", "脚下", "中路", "前场", "后场", "中圈", "边线", "球门",
    "门线", "再度", "奋力", "奋勇", "选择", "单掌托出", "双拳击出", "争到一点",
    "争到", "反抢", "就地反抢", "前压", "高位逼抢", "禁区", "大禁区",
    "小禁区", "神勇扑出", "神勇", "角旗区", "中场", "将球", "贡献关键", "贡献",
    "舍身", "积极", "跃起", "连过", "铲球", "铲出", "干净", "上演", "展现超强",
    "展现", "超强", "机敏", "横传", "回传", "蹭射", "垫传", "参与", "发起进攻",
    "门前", "任意球", "角球", "点球", "弧顶", "底线", "边路", "单刀", "折射",
    "弹射", "灵活", "声东击西", "高高跃起", "从右", "沿边", "指尖", "身后",
    "光用头", "利用身体", "用指尖", "定位球", "提前", "利用", "在", "与", "的",
    "下地", "强硬", "别光用头", "为",
    "至", "获", "拿", "接", "传", "分",
    "带", "突", "过", "停", "起", "顶", "倒", "吊", "挑", "搓", "捅", "垫",
    "补", "追", "抢", "断", "解", "扑", "挡", "射", "打", "踢", "推", "拉",
    "撞", "靠", "甩", "晃", "扣", "拨", "送", "给", "找", "递", "横",
]

GARBAGE_NAMES = {
    "头球", "上演", "一条龙", "球员", "队友", "对方", "门将", "后卫", "前锋",
    "中场", "替补", "任意球", "角球", "点球", "持球", "接球", "破门", "射门",
    "传中", "直塞", "禁区", "空位", "底线", "边路", "打门", "攻门", "防守",
    "进攻", "反击", "反击得手", "组织", "核心", "队长", "新援", "外援",
    "早上", "下午", "上午", "晚上", "傍晚", "中午", "凌晨",
}


def clean_chinese_name(cand):
    """清洗中文名候选串。返回清洗后名字或 None。"""
    cand = cand.strip().strip("，,。")
    if not cand:
        return None
    # 前缀命中垃圾词（"球员XX""上演一条龙"等）→ 丢弃
    for w in sorted(GARBAGE_NAMES, key=len, reverse=True):
        if cand.startswith(w):
            return None
    for w in sorted(ACTION_WORDS, key=len, reverse=True):
        if cand.startswith(w):
            return None
    cut = len(cand)
    for w in sorted(ACTION_WORDS, key=len, reverse=True):
        idx = cand.find(w, 1)
        if 0 < idx < cut:
            cut = idx
    if cut == len(cand) and "·" not in cand:
        cut = min(4, len(cand))
    name = cand[:cut].strip("，,。")
    if len(name) < 2:
        return None
    if name in GARBAGE_NAMES:
        return None
    if name[-1] in "的得了着过在至接传到找给拿获抢断解扑挡射打踢直还角就身跃连斜定神不与沿动用左":
        return None
    return name


def read_blocks():
    """读取 docx 战报并按『【』切块，返回 (正文, 主队, 客队, 简称命中) 列表。"""
    text = docx_text(DOCX)
    # 归一化中文字符之间的空白（docx 换行残留，如"农生 院""计信\n院"）
    text = re.sub(r"(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])", "", text)
    parts = re.split(r"(?=【)", text)
    blocks = [p for p in parts if p.startswith("【")]
    print("blocks:", len(blocks))

    block_info = []
    for b in blocks:
        end = b.find("】")
        inner = b[1:end] if end > 0 else b[1:]
        body = b[end + 1:] if end > 0 else ""
        home, away = parse_block_header(inner)
        abbr_hits = []
        for am in ABBR_RE.finditer(body):
            abbr_hits.append((am.start(), am.end(), am.group(1)))
        block_info.append((body, home, away, abbr_hits))
    return block_info


def parse_block_header(inner):
    """解析块标题『A vs B 比分』或『A 比分 B』（备注性括号如（3：4）需剔除）。"""
    home, away = None, None
    m = re.match(r"^(.*?)\s*vs\s*(.*)$", inner, re.I)
    if m:
        home, away = m.group(1).strip(), m.group(2).strip()
        sc = SCORE_PAT.search(away)
        if sc:
            away = (away[:sc.start()] + away[sc.end():]).strip()
    else:
        sc = SCORE_PAT.search(inner)
        if sc:
            home = inner[:sc.start()].strip()
            away = inner[sc.end():].strip()
        else:
            home, _, away = inner.partition(" ")
            home, away = home.strip(), away.strip()
    home = SCORE_PAT.sub("", home).strip()
    away = SCORE_PAT.sub("", away).strip()
    return home, away


def block_nearest_team(abbr_hits, pos):
    """块内最近简称（在位置 pos 之前且最近）→ 归属队伍。"""
    best = None
    for s, e, a in abbr_hits:
        if e <= pos and (best is None or pos - e < pos - best[0]):
            best = (s, e, a)
    if best:
        return abbr_to_team(best[2])
    return None


def scan_players(block_info):
    """从比赛块中扫描 4 类球员写法，返回 (players, player_pos, unresolved, unmapped_abbrs)。"""
    players = collections.Counter()  # (team, num, name) -> 加权次数
    player_pos = {}                  # (team, num, name) -> 位置（保留首个非 unknown）
    unresolved = collections.Counter()
    unmapped_abbrs = collections.Counter()

    def add_player(team, num, name, position, weight=1):
        if not name:
            return
        players[(team, num, name)] += weight
        if position and position not in ("unknown", "球员"):
            player_pos.setdefault((team, num, name), position)

    for body, _home, _away, abbr_hits in block_info:
        for m in PAT_ABBR.finditer(body):
            abbr, num, pos, cand = m.groups()
            team = abbr_to_team(abbr)
            if not team:
                unmapped_abbrs[abbr] += 1
                continue
            name = clean_chinese_name(cand)
            add_player(team, int(num), name, pos, weight=3)
        for m in PAT_NUM.finditer(body):
            num, pos, cand = m.groups()
            name = clean_chinese_name(cand)
            if not name:
                continue
            team = block_nearest_team(abbr_hits, m.start())
            if team is None:
                unresolved[name] += 1
                continue
            add_player(team, int(num), name, pos, weight=1)
        for m in PAT_EN.finditer(body):
            num, name = m.groups()
            team = block_nearest_team(abbr_hits, m.start())
            add_player(team, int(num), name.strip(), None, weight=1)
        for m in PAT_EN_REV.finditer(body):
            num, name = m.groups()
            team = block_nearest_team(abbr_hits, m.start())
            add_player(team, int(num), name.strip(), None, weight=1)
    return players, player_pos, unresolved, unmapped_abbrs


def resolve_cross_team(players):
    """跨队同名投票：(num,name) 按加权次数选队伍；平票标记为真实重名。"""
    by_name_num = collections.defaultdict(collections.Counter)  # (num,name)->{team:wt}
    for (team, num, name), cnt in players.items():
        if team is None:
            continue
        by_name_num[(num, name)][team] += cnt

    team_resolution = {}   # (num,name) -> team
    multi_team = set()     # 平票 → 保留两队（真实重名）
    cross_conf = {}
    for (num, name), team_counts in by_name_num.items():
        key = (num, name)
        if key in OVERRIDES:
            team_resolution[key] = OVERRIDES[key]
        elif len(team_counts) == 1:
            team_resolution[(num, name)] = next(iter(team_counts))
        else:
            top = team_counts.most_common()
            if top[0][1] > top[1][1]:
                team_resolution[(num, name)] = top[0][0]
            elif top[0][1] == top[1][1]:
                multi_team.add((num, name))
                cross_conf[(num, name)] = dict(team_counts)
            else:
                team_resolution[(num, name)] = top[0][0]
    return team_resolution, multi_team, cross_conf


def near_variant(a, b):
    """同长且仅 1 个字符不同的中文名 → 视为同一人错别字变体。"""
    if len(a) != len(b) or len(a) < 2:
        return False
    diffs = sum(1 for x, y in zip(a, b) if x != y)
    return diffs <= 1


def merge_variants(players, player_pos, team_resolution, multi_team):
    """冲突归并：同队同号保留最短名；中英文变体合并。返回 {team: [记录]} 与统计。"""
    by_team_num = collections.defaultdict(dict)  # (team,num)->{name:{position,count}}
    for (team, num, name), cnt in players.items():
        if team is None:
            continue
        key = (num, name)
        if key in multi_team:
            resolved_team = team  # 平票重名：按各自原队保留
        else:
            resolved_team = team_resolution.get(key, team)
        k2 = (resolved_team, num)
        pos = player_pos.get((team, num, name), "unknown")
        rec = by_team_num[k2].get(name)
        if rec is None:
            by_team_num[k2][name] = {"position": pos, "count": cnt}
        else:
            rec["count"] += cnt
            if rec["position"] == "unknown" and pos != "unknown":
                rec["position"] = pos

    merged = collections.defaultdict(list)
    merge_stats = collections.Counter()
    for (team, num), names_rec in sorted(by_team_num.items()):
        names = sorted(names_rec.keys(), key=lambda n: (len(n), -names_rec[n]["count"]))
        used = []
        for n in names:
            rec = names_rec[n]
            if any(n == u or u.startswith(n) or n.startswith(u) for u in used):
                merge_stats["merged_variant"] += 1
                continue
            # 中文近形变体（错别字）→ 合并，保留出现次数多的
            if not re.match(r"^[A-Za-z .'-]+$", n):
                hit = None
                for i, u in enumerate(used):
                    if re.match(r"^[A-Za-z .'-]+$", u):
                        continue
                    if near_variant(n, u):
                        hit = i
                        break
                if hit is not None:
                    if rec["count"] > names_rec[used[hit]]["count"]:
                        used[hit] = n
                    merge_stats["merged_near_variant"] += 1
                    continue
            # 英文名：大小写归一化，前缀/后缀包含 → 合并，保留长名
            if re.match(r"^[A-Za-z .'-]+$", n):
                nu = n.upper()
                hit = None
                for i, u in enumerate(used):
                    uu = u.upper()
                    if nu in uu or uu in nu:
                        hit = i
                        break
                if hit is not None:
                    if len(n) > len(used[hit]):
                        used[hit] = n  # 新名字更长 → 替换
                    merge_stats["merged_english"] += 1
                    continue
            used.append(n)
        for n in used:
            merged[team].append({
                "number": num,
                "name": n,
                "position": names_rec[n]["position"],
            })
    return merged, merge_stats


def print_summary(merged, merge_stats, cross_conf, unresolved):
    """打印解析统计（工具脚本的输出即结果）。"""
    total = sum(len(v) for v in merged.values())
    print("resolved players (after merge):", total)
    print("merge_stats:", dict(merge_stats))
    print("\nplayers by team:")
    for t, v in sorted(merged.items(), key=lambda x: -len(x[1])):
        print(f"  {t}: {len(v)}")

    print("\ncross-team conflicts (vote tie):", len(cross_conf))
    for (num, name), team_counts in sorted(cross_conf.items())[:30]:
        print("   ", num, name, "->", team_counts)

    if unresolved:
        print("\nunresolved (no team) unique:", len(unresolved), "top:")
        for n, c in unresolved.most_common(15):
            print("   ", n, c)


def dump_draft(merged):
    """写 draft json 供人工核对。"""
    payload = {"source": str(DOCX), "teams": {}}
    for t, v in sorted(merged.items()):
        payload["teams"][t] = sorted(v, key=lambda x: (x["number"], x["name"]))
    OUT_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print("\ndraft json ->", OUT_JSON)


def commit_to_db(merged, replace):
    """写库：INSERT OR IGNORE；--replace 时先清空 players 表。"""
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    if replace:
        cur.execute("DELETE FROM players")
        print("[replace] 已清空 players 表")
    team_id_map = {r[1]: r[0] for r in cur.execute("SELECT id, name FROM teams").fetchall()}
    inserted = 0
    missing_teams = []
    for team, plist in merged.items():
        tid = team_id_map.get(team)
        if tid is None:
            missing_teams.append(team)
            continue
        for p in plist:
            pid = "p_" + hashlib.md5(
                f"{tid}|{p['number']}|{p['name']}".encode()).hexdigest()[:10]
            cur.execute(
                """INSERT OR IGNORE INTO players
                   (id, name, number, team_id, position, personal_traits,
                    health_status, yellow_cards, red_cards, is_suspended)
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (pid, p["name"], p["number"], tid, p["position"], "[]",
                 "healthy", 0, 0, 0))
            inserted += cur.rowcount
    conn.commit()
    total_db = cur.execute("SELECT COUNT(*) FROM players").fetchone()[0]
    conn.close()
    print(f"\n[commit] 新增 {inserted} 名球员；players 表现有 {total_db} 行。")
    if missing_teams:
        print("!! 未找到 team_id:", missing_teams)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--replace", action="store_true",
                        help="写库前清空 players 表（重导用）")
    args = parser.parse_args()

    block_info = read_blocks()
    players, player_pos, unresolved, unmapped_abbrs = scan_players(block_info)
    if unmapped_abbrs:
        print("!! 未映射简称:", dict(unmapped_abbrs.most_common(10)))

    team_resolution, multi_team, cross_conf = resolve_cross_team(players)
    merged, merge_stats = merge_variants(
        players, player_pos, team_resolution, multi_team)
    print_summary(merged, merge_stats, cross_conf, unresolved)
    dump_draft(merged)

    if not args.commit:
        print("\n[dry-run] 未写库。确认后加 --commit 导入。")
        return
    commit_to_db(merged, args.replace)


if __name__ == "__main__":
    main()
