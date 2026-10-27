@echo off
title QuizFlow Demo Data
if not exist .env (
  echo Missing .env. Run setup.bat first.
  pause
  exit /b 1
)
echo Creating demo users and sample quizzes...
call npm run seed
pause
