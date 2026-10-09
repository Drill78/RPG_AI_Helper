@echo off
setlocal
title RPG AI Helper
powershell.exe -NoLogo -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0scripts\launch.ps1"
if errorlevel 1 (
  echo.
  echo The workspace could not start. Please read the message above.
  echo You can share the message with Codex for help.
  pause
  exit /b 1
)
exit /b 0
