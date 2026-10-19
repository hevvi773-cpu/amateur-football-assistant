"""测试配置：使用独立临时数据库，避免污染开发数据。"""
import os
import tempfile
from pathlib import Path

_TEST_DB = Path(tempfile.gettempdir()) / "football_test.db"
os.environ["FOOTBALL_DB_PATH"] = str(_TEST_DB)

if _TEST_DB.exists():
    _TEST_DB.unlink()  # 每次测试从干净库开始
