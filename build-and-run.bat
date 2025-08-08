@echo off
setlocal

set "APPDIR=C:\ESP-Knowledge"
set "PORT=5050"

cd /d "%APPDIR%"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT%[ ]*LISTENING"') do (
  echo Stopping PID %%p on port %PORT%...
  taskkill /PID %%p /F >nul 2>&1
)

echo Building...
call npm run build || goto :build_fail

echo Starting server...
call npm start
goto :eof

:build_fail
echo Build failed. Press any key to exit...
pause >nul
