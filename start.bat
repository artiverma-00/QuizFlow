@echo off
title QuizFlow
if not exist .env (
  echo Missing .env. Run setup.bat first.
  pause
  exit /b 1
)
findstr /C:"YOUR-CLUSTER" .env >nul
if not errorlevel 1 (
  echo Please set your real MongoDB URI in the root .env before starting.
  pause
  exit /b 1
)
echo Starting QuizFlow API and frontend...
call npm run dev
pause
