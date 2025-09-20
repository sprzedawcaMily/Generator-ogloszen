@echo off
REM start-app.bat - double-click to start the application in a console window
REM This calls run-app.ps1 which handles env loading and starts bun
SETLOCAL
IF EXIST "%~dp0run-app.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0run-app.ps1"
    REM If the PowerShell session returns, pause so the window doesn't close immediately
    pause
) ELSE (
    echo run-app.ps1 not found. Please ensure the repository is complete.
    pause
)
ENDLOCAL
