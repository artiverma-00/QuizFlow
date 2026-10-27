@echo off
title QuizFlow Setup
echo ============================================
echo             QuizFlow Setup
echo ============================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 20 or newer from https://nodejs.org/
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
if not exist client\.env copy client\.env.example client\.env >nul
echo Installing project dependencies...
call npm install
if errorlevel 1 (
  echo Dependency installation failed.
  pause
  exit /b 1
)
echo.
echo Setup packages installed.
echo NEXT: Open the root .env file and replace MONGODB_URI with your own MongoDB Atlas URI.
echo Also replace JWT_SECRET with a random secret of 32 or more characters.
echo Then double-click seed-demo-data.bat once, followed by start.bat.
pause
