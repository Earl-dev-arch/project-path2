@echo off
title Your Path - PostgreSQL Server
echo ====================================================
echo Starting Your Path Server...
echo ====================================================

:: Refresh PATH to include Node.js if newly installed
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"

:: Run server
node server/server.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server stopped or encountered an error.
  pause
)

