"""JSON 文件数据库服务 - 简单持久化，后续可替换为 SQLite"""
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_DIR = Path(__file__).parent.parent.parent / "data"


class JSONDB:
    def __init__(self, collection: str):
        self.collection = collection
        self.file_path = DATA_DIR / f"{collection}.json"
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def _read(self) -> List[Dict[str, Any]]:
        if not self.file_path.exists():
            return []
        with open(self.file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write(self, data: List[Dict[str, Any]]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def all(self) -> List[Dict[str, Any]]:
        return self._read()

    def get(self, item_id: str) -> Optional[Dict[str, Any]]:
        data = self._read()
        for item in data:
            if item.get("id") == item_id:
                return item
        return None

    def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        data = self._read()
        data.append(item)
        self._write(data)
        return item

    def update(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self._read()
        for i, item in enumerate(data):
            if item.get("id") == item_id:
                data[i].update(updates)
                self._write(data)
                return data[i]
        return None

    def delete(self, item_id: str) -> bool:
        data = self._read()
        new_data = [item for item in data if item.get("id") != item_id]
        if len(new_data) == len(data):
            return False
        self._write(new_data)
        return True

    def filter(self, **kwargs) -> List[Dict[str, Any]]:
        data = self._read()
        result = []
        for item in data:
            match = True
            for key, value in kwargs.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                result.append(item)
        return result


# 初始化各集合的数据库实例
matches_db = JSONDB("matches")
teams_db = JSONDB("teams")
players_db = JSONDB("players")
reviews_db = JSONDB("reviews")
articles_db = JSONDB("articles")
social_db = JSONDB("social")
messages_db = JSONDB("messages")
lineup_db = JSONDB("lineup")
