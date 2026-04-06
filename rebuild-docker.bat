@echo off
REM Rebuild GustoPOS Docker containers with latest code

echo [1/4] Stopping Docker containers...
docker-compose down

echo.
echo [2/4] Pulling latest images from GitHub Container Registry...
docker pull ghcr.io/bangsmackpow/gusto-pos-api:latest
docker pull ghcr.io/bangsmackpow/gusto-pos-frontend:latest

echo.
echo [3/4] Starting Docker containers...
docker-compose up -d

echo.
echo [4/4] Waiting for services to start...
timeout /t 5 /nobreak

echo.
echo ============================================
echo Docker rebuild complete!
echo ============================================
echo.
echo API:      http://localhost:3000
echo Frontend: http://localhost:8080
echo.
echo Checking service health...
docker-compose logs --tail=20

pause
