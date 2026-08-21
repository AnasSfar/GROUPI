@echo off
setlocal
cd /d "%~dp0"

set "API_PORT=3000"
set "WEB_PORT=5173"
set "API_URL=http://localhost:%API_PORT%"
set "WEB_URL=http://localhost:%WEB_PORT%"

echo === GROUPI dev environment ===
echo.

rem Docker Desktop is often installed per-user and not on PATH by default.
rem If `docker` isn't resolvable, add its known install location for this script's session.
where docker >nul 2>nul
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%PATH%"
    )
)

echo Starting Postgres (Docker)...
call npm run db:up
if errorlevel 1 (
    echo.
    echo ERREUR: impossible de demarrer Docker. Verifie que Docker Desktop est lance.
    pause
    exit /b 1
)

echo.
echo Verification des ports de developpement...

call :is_port_listening %API_PORT%
if errorlevel 1 (
    echo Demarrage de l'API sur %API_URL%...
    start "GROUPI API (%API_PORT%)" powershell -NoProfile -NoExit -Command "npm run dev:api"
) else (
    echo API deja detectee sur %API_URL% ; aucun nouveau serveur API ne sera lance.
)

echo Attente de l'API...
call :wait_for_api
if errorlevel 1 (
    echo.
    echo ATTENTION: l'API ne repond pas encore sur %API_URL%.
    echo Regarde la fenetre "GROUPI API (%API_PORT%)" pour l'erreur exacte avant de te connecter.
) else (
    echo API prete sur %API_URL%.
)

call :is_port_listening %WEB_PORT%
if errorlevel 1 (
    echo Demarrage du frontend sur %WEB_URL%...
    start "GROUPI Web (%WEB_PORT%)" powershell -NoProfile -NoExit -Command "npm run dev --workspace apps/web -- --port %WEB_PORT% --strictPort"
) else (
    echo Frontend deja detecte sur %WEB_URL% ; aucun nouveau serveur web ne sera lance.
)

echo Attente du frontend...
call :wait_for_web
if errorlevel 1 (
    echo.
    echo ATTENTION: le frontend ne repond pas encore sur %WEB_URL%.
    echo Regarde la fenetre "GROUPI Web (%WEB_PORT%)" pour l'erreur exacte.
) else (
    echo Frontend pret sur %WEB_URL%.
)

echo.
echo Termine.
echo   API  : %API_URL%
echo   Web  : %WEB_URL%
echo Ferme les fenetres API/Web pour arreter les serveurs. Postgres reste actif (npm run db:down pour l'arreter).
goto :end

:is_port_listening
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %1 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
exit /b %errorlevel%

:wait_for_api
for /l %%i in (1,1,45) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { Invoke-WebRequest -UseBasicParsing '%API_URL%/api/v1/auth/me' -TimeoutSec 2 | Out-Null; exit 0 } catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { exit 0 }; exit 1 }"
    if not errorlevel 1 exit /b 0
    timeout /t 1 >nul
)
exit /b 1

:wait_for_web
for /l %%i in (1,1,30) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { Invoke-WebRequest -UseBasicParsing '%WEB_URL%' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
    if not errorlevel 1 exit /b 0
    timeout /t 1 >nul
)
exit /b 1

:end
endlocal
