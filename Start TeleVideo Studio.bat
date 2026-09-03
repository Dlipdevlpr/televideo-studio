@echo off
title TeleVideo Studio Launcher
echo ====================================================
echo           🚀 TeleVideo Studio - Version 2
echo ====================================================
echo.
echo Starting development server...
cd /d "c:\Users\Dilee\OneDrive\Pictures\Screenshots 1\video creator version 2"

rem Wait 2 seconds and open browser automatically
timeout /t 2 /nobreak >nul
start http://localhost:5173/

rem Run Vite dev server
npm run dev
