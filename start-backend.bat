@echo off
REM 启动后端（端口 8000）
cd /d %~dp0backend
if not exist .venv (
  echo [ERROR] 未找到虚拟环境，请先执行：python -m venv .venv 并安装依赖
  exit /b 1
)
.venv\Scripts\python.exe run.py
