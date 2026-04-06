@echo off
REM Diagnostic script to check API and authentication flow

echo ============================================
echo GustoPOS Login Loop Diagnostic
echo ============================================
echo.

echo [1] Checking Docker containers...
docker-compose ps

echo.
echo [2] Checking API health...
curl -s http://localhost:3000/api/healthz | findstr /r ".*" && echo. || echo "API not responding!"

echo.
echo [3] Testing login endpoint (with dummy credentials)...
echo Making POST to /api/admin/login...
curl -v -X POST http://localhost:3000/api/admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"curtis@bangsmackpow.qzz.io\", \"password\": \"test123\"}" 2>&1 | findstr /E "HTTP|Set-Cookie|Access-Control"

echo.
echo [4] Checking auth user endpoint...
echo Making GET to /api/auth/user...
curl -v -X GET http://localhost:3000/api/auth/user 2>&1 | findstr /E "HTTP|Cookie"

echo.
echo [5] API Server logs (last 30 lines)...
docker-compose logs --tail=30 api

echo.
echo ============================================
echo Diagnostic complete. Check above for:
echo - HTTP 200 response from login
echo - Set-Cookie header with sid
echo - Access-Control-Allow-Credentials: true
echo ============================================

pause
