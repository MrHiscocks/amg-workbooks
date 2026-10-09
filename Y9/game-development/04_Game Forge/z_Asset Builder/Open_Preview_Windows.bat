@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 preview_server.py
) else (
  python preview_server.py
)
pause
