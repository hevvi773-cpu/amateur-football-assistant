"""阵型定义与默认站位，与前端原型保持一致。"""
from __future__ import annotations

from app.schemas import LineupSlot

# 各阵型默认站位（不含球员），row/col 用于阵型图布局
FORMATION_SLOTS: dict[str, list[dict]] = {
    "4-3-3": [
        {"position": "GK", "posLabel": "门将", "row": 4, "col": 2},
        {"position": "RB", "posLabel": "右后卫", "row": 3, "col": 0},
        {"position": "CB1", "posLabel": "中后卫", "row": 3, "col": 1},
        {"position": "CB2", "posLabel": "中后卫", "row": 3, "col": 3},
        {"position": "LB", "posLabel": "左后卫", "row": 3, "col": 4},
        {"position": "CDM", "posLabel": "后腰", "row": 2, "col": 2},
        {"position": "CM1", "posLabel": "中前卫", "row": 2, "col": 1},
        {"position": "CM2", "posLabel": "中前卫", "row": 2, "col": 3},
        {"position": "RW", "posLabel": "右边锋", "row": 1, "col": 0},
        {"position": "ST", "posLabel": "中锋", "row": 1, "col": 2},
        {"position": "LW", "posLabel": "左边锋", "row": 1, "col": 4},
    ],
    "4-4-2": [
        {"position": "GK", "posLabel": "门将", "row": 4, "col": 2},
        {"position": "RB", "posLabel": "右后卫", "row": 3, "col": 0},
        {"position": "CB1", "posLabel": "中后卫", "row": 3, "col": 1},
        {"position": "CB2", "posLabel": "中后卫", "row": 3, "col": 3},
        {"position": "LB", "posLabel": "左后卫", "row": 3, "col": 4},
        {"position": "RM", "posLabel": "右中场", "row": 2, "col": 0},
        {"position": "CM1", "posLabel": "中前卫", "row": 2, "col": 1},
        {"position": "CM2", "posLabel": "中前卫", "row": 2, "col": 3},
        {"position": "LM", "posLabel": "左中场", "row": 2, "col": 4},
        {"position": "ST1", "posLabel": "前锋", "row": 1, "col": 1},
        {"position": "ST2", "posLabel": "前锋", "row": 1, "col": 3},
    ],
    "3-5-2": [
        {"position": "GK", "posLabel": "门将", "row": 4, "col": 2},
        {"position": "RCB", "posLabel": "右中卫", "row": 3, "col": 1},
        {"position": "CB", "posLabel": "中后卫", "row": 3, "col": 2},
        {"position": "LCB", "posLabel": "左中卫", "row": 3, "col": 3},
        {"position": "RM", "posLabel": "右翼卫", "row": 2, "col": 0},
        {"position": "CM1", "posLabel": "中前卫", "row": 2, "col": 1},
        {"position": "CM2", "posLabel": "中前卫", "row": 2, "col": 3},
        {"position": "LM", "posLabel": "左翼卫", "row": 2, "col": 4},
        {"position": "AM", "posLabel": "前腰", "row": 2, "col": 2},
        {"position": "ST1", "posLabel": "前锋", "row": 1, "col": 1},
        {"position": "ST2", "posLabel": "前锋", "row": 1, "col": 3},
    ],
    "4-2-3-1": [
        {"position": "GK", "posLabel": "门将", "row": 4, "col": 2},
        {"position": "RB", "posLabel": "右后卫", "row": 3, "col": 0},
        {"position": "CB1", "posLabel": "中后卫", "row": 3, "col": 1},
        {"position": "CB2", "posLabel": "中后卫", "row": 3, "col": 3},
        {"position": "LB", "posLabel": "左后卫", "row": 3, "col": 4},
        {"position": "CDM1", "posLabel": "后腰", "row": 2.5, "col": 1},
        {"position": "CDM2", "posLabel": "后腰", "row": 2.5, "col": 3},
        {"position": "RW", "posLabel": "右边锋", "row": 1.5, "col": 0},
        {"position": "AM", "posLabel": "前腰", "row": 1.5, "col": 2},
        {"position": "LW", "posLabel": "左边锋", "row": 1.5, "col": 4},
        {"position": "ST", "posLabel": "中锋", "row": 1, "col": 2},
    ],
    "5-3-2": [
        {"position": "GK", "posLabel": "门将", "row": 4, "col": 2},
        {"position": "RB", "posLabel": "右后卫", "row": 3, "col": 0},
        {"position": "RCB", "posLabel": "右中卫", "row": 3, "col": 1},
        {"position": "CB", "posLabel": "中后卫", "row": 3, "col": 2},
        {"position": "LCB", "posLabel": "左中卫", "row": 3, "col": 3},
        {"position": "LB", "posLabel": "左后卫", "row": 3, "col": 4},
        {"position": "CM1", "posLabel": "中前卫", "row": 2, "col": 1},
        {"position": "CM2", "posLabel": "中前卫", "row": 2, "col": 2},
        {"position": "CM3", "posLabel": "中前卫", "row": 2, "col": 3},
        {"position": "ST1", "posLabel": "前锋", "row": 1, "col": 1},
        {"position": "ST2", "posLabel": "前锋", "row": 1, "col": 3},
    ],
}

VALID_FORMATIONS = list(FORMATION_SLOTS.keys())

# 位置 → 可匹配的球员擅长位置（用于推荐阵容）
POSITION_COMPAT = {
    "GK": ["门将"],
    "RB": ["后卫", "右后卫"],
    "CB1": ["后卫", "中后卫"],
    "CB2": ["后卫", "中后卫"],
    "LB": ["后卫", "左后卫"],
    "RCB": ["后卫", "中后卫"],
    "CB": ["后卫", "中后卫"],
    "LCB": ["后卫", "中后卫"],
    "CDM": ["中场", "后腰"],
    "CDM1": ["中场", "后腰"],
    "CDM2": ["中场", "后腰"],
    "CM1": ["中场", "中前卫"],
    "CM2": ["中场", "中前卫"],
    "CM3": ["中场", "中前卫"],
    "AM": ["中场", "前锋", "前腰"],
    "RM": ["中场", "边路", "右中场"],
    "LM": ["中场", "边路", "左中场"],
    "RW": ["前锋", "边锋", "右边锋"],
    "LW": ["前锋", "边锋", "左边锋"],
    "ST": ["前锋", "中锋"],
    "ST1": ["前锋", "中锋"],
    "ST2": ["前锋", "中锋"],
}


def build_default_slots(formation: str) -> list[LineupSlot]:
    """按阵型生成空站位（playerId 为空）。"""
    return [LineupSlot(**slot) for slot in FORMATION_SLOTS.get(formation, FORMATION_SLOTS["4-3-3"])]
