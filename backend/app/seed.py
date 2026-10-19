"""种子数据：演示种子已全部移除（模拟数据已清理）。

真实赛事数据（60 支学院队 + 427 场比赛）通过 scripts/import_*.py 导入，
seed_db 保持空实现，避免新建数据库时重新写入演示内容。
"""
from __future__ import annotations

from sqlalchemy.orm import Session


def seed_db(db: Session) -> None:
    """演示种子已移除：真实数据通过导入脚本写入，此处不产生任何数据。"""
    return None
