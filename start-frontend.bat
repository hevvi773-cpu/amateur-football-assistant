@echo off
REM 启动前端原型（端口 8001）
cd /d %~dp0frontend
if not exist node_modules (
  echo [INFO] 首次运行，正在安装依赖...
  call npm install
)
call npm run dev:win
