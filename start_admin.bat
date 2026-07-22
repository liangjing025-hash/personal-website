@echo off
cd /d "%~dp0"
echo ========================================
echo   CMS Admin Server Starting...
echo   Open http://localhost:8766 in browser
echo   Press Ctrl+C to stop
echo ========================================

set PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe

if not exist "%PYTHON%" (
    echo Python not found, trying system python...
    set PYTHON=python
)

echo Using: %PYTHON%
echo.

start "" http://localhost:8766 2>nul

"%PYTHON%" admin_server.py

pause
