# -*- coding: utf-8 -*-
"""探查 2026 年球员数据：清洗提取 + 跨场次共同队交集推断归属。

仅做可行性验证，不写库。
"""
import re
import collections
from pathlib import Path

import openpyxl

EXCEL = Path(r"C:\Users\34602\OneDrive\Documents\项目2.0\26-22赛事纪录\赛事纪录汇总.xlsx")

# 动作/描述词表：名字遇到这些词即截断（按最长优先排序）
ACTION_WORDS = [
    "凭借个人能力", "在本次进攻中", "在禁区", "罚球", "任意球", "开出角球",
    "边路", "高高跃起", "连续踩单车", "一条龙", "半场远程", "转腾挪连过",
    "小角度", "空位", "持球", "接应队友", "接应", "队员", "送出", "传球找到",
    "往前", "再次", "选择", "迅速", "沉着", "沿", "接", "获", "用", "传", "到",
    "找", "打", "小", "左", "右", "底线", "禁区",
]

# 位置词：号码后紧邻的位置描述（单独处理）
POSITION_WORDS = {"后卫", "前锋", "中场", "门将"}


def split_items(text):
    if not text:
        return []
    return [t.strip() for t in re.split(r"[；;，,]", str(text)) if t.strip()]


def clean_name(fragment):
    """从 '12号赵宇皓开出角球至禁区' 这类片段中提取球员名。"""
    frag = fragment
    # 去掉位置词（如 '19号后卫朱华楠沉着' -> '19号朱华楠沉着'）
    frag = re.sub(r"^(.*?号)(后卫|前锋|中场|门将)", r"\1", frag)
    m = re.match(r"^(\d{1,2})号(.+)$", frag)
    if not m:
        return None, None
    number = int(m.group(1))
    name_part = m.group(2)
    # 名字部分：连续中文/字母/点号，直到遇到动作词
    name = name_part
    for w in sorted(ACTION_WORDS, key=len, reverse=True):
        if w in name_part:
            name = name_part.split(w, 1)[0]
            break
    name = name.strip()
    # 清理残留：去掉 '球员' 等词
    name = name.replace("球员", "").strip()
    # 名字长度过滤（中文名至少 2 字；英文名至少 2 字符）
    if len(name) < 2:
        return None, None
    # 检查名字里是否还有明显描述性残留（以常见动词/名词收尾的多余字）
    return number, name


def main():
    wb = openpyxl.load_workbook(EXCEL, read_only=True, data_only=True)
    ws = wb["赛事汇总"]
    rows = [r for r in ws.iter_rows(min_row=2, values_only=True)
            if r[2] and str(r[2])[:4] == "2026"]
    print("2026 matches:", len(rows))

    # player_id -> {match_key} ; match_key -> (home, away)
    player_matches = collections.defaultdict(set)
    match_pairs = {}
    # player_id -> 出现次数
    player_count = collections.Counter()
    # 收集位置信息
    player_position = {}

    for r in rows:
        home, away = r[4], r[5]
        mk = (home, away, str(r[2]))
        match_pairs[mk] = (home, away)
        for col_idx, col_name in ((12, "进球"), (13, "助攻"), (17, "黄牌"), (21, "红牌")):
            for item in split_items(r[col_idx]):
                number, name = clean_name(item)
                if name is None:
                    continue
                pid = (number, name)
                player_matches[pid].add(mk)
                player_count[pid] += 1
                if col_name == "黄牌":
                    player_position.setdefault(pid, "黄牌")
                if col_name == "红牌":
                    player_position.setdefault(pid, "红牌")
                if col_name == "进球":
                    player_position.setdefault(pid, "进球")
                if col_name == "助攻":
                    player_position.setdefault(pid, "助攻")

    print("unique players (number,name):", len(player_matches))

    # 归属推断：对每个球员，取所有比赛队伍的并集，再找交集
    resolved = {}
    unresolved = []
    for pid, mks in player_matches.items():
        team_sets = []
        for mk in mks:
            home, away = match_pairs[mk]
            team_sets.append({home, away})
        inter = set.intersection(*team_sets) if team_sets else set()
        if len(inter) == 1:
            resolved[pid] = inter.pop()
        else:
            unresolved.append((pid, len(mks), inter))

    print("resolved:", len(resolved))
    print("unresolved:", len(unresolved))

    # 未归属分类
    once = [u for u in unresolved if u[1] == 1]
    multi = [u for u in unresolved if u[1] > 1]
    print("  unresolved appear once:", len(once))
    print("  unresolved appear >1:", len(multi))
    for pid, cnt, inter in multi[:20]:
        print("   multi-unresolved:", pid, "cnt:", cnt, "inter:", inter)

    # 按队统计已归属
    by_team = collections.defaultdict(list)
    for (num, name), team in resolved.items():
        by_team[team].append((num, name))
    print("\n=== resolved by team ===")
    for team, players in sorted(by_team.items(), key=lambda x: -len(x[1])):
        print(f"{team}: {len(players)}")
        print("   ", sorted(players)[:15], "..." if len(players) > 15 else "")

    # 抽样检查未归属一次出现的
    print("\n=== sample unresolved once ===")
    for pid, cnt, inter in once[:40]:
        print(pid, "cnt:", cnt)


if __name__ == "__main__":
    main()
