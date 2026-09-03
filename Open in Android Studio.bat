@echo off
title Open TeleVideo Studio in Android Studio
echo ====================================================
echo        🚀 TeleVideo Studio - Android Launcher
echo ====================================================
echo.
echo Syncing latest web assets...
call npm run cap:build
echo.
echo Opening native Android project in Android Studio...
call npx cap open android
pause
