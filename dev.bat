@echo off
setlocal
cd /d "%~dp0"

echo === GROUPI dev environment ===
echo.
echo Starting Postgres (Docker)...
call npm run db:up
if errorlevel 1 (
    echo.
    echo ERREUR: impossible de demarrer Docker. Verifie que Docker Desktop est lance.
    pause
    exit /b 1
)

echo.
echo Ouverture de l'API et du frontend dans des fenetres separees...
start "GROUPI API (3000)"  powershell -NoExit -Command "npm run dev:api"
timeout /t 2 >nul
start "GROUPI Web (5173)" powershell -NoExit -Command "npm run dev:web"

echo.
echo Termine.
echo   API  : http://localhost:3000
echo   Web  : http://localhost:5173
echo Ferme les fenetres API/Web pour arreter les serveurs. Postgres reste actif (npm run db:down pour l'arreter).
endlocal
