@echo off
REM Create airgapped-deployment directory and copy all files

set "DEPLOY_DIR=C:\Users\curtis\Desktop\dev\GustoPOS\airgapped-deployment"
set "SOURCE_DIR=C:\Users\curtis\.copilot\session-state\06d9c329-60ab-4bff-9c40-fcfe675f9eb9\files"

REM Create directory
mkdir "%DEPLOY_DIR%" 2>nul
echo Created: %DEPLOY_DIR%

REM Copy files
echo Copying files...
copy "%SOURCE_DIR%\setup.sh" "%DEPLOY_DIR%\setup.sh" /Y
copy "%SOURCE_DIR%\start.sh" "%DEPLOY_DIR%\start.sh" /Y
copy "%SOURCE_DIR%\stop.sh" "%DEPLOY_DIR%\stop.sh" /Y
copy "%SOURCE_DIR%\create-usb-bundle.sh" "%DEPLOY_DIR%\create-usb-bundle.sh" /Y
copy "%SOURCE_DIR%\SETUP_GUIDE_MACOS.md" "%DEPLOY_DIR%\SETUP_GUIDE_MACOS.md" /Y
copy "%SOURCE_DIR%\DEPLOYMENT_RUNBOOK.md" "%DEPLOY_DIR%\DEPLOYMENT_RUNBOOK.md" /Y
copy "%SOURCE_DIR%\DEPLOYMENT_SUMMARY.md" "%DEPLOY_DIR%\DEPLOYMENT_SUMMARY.md" /Y
copy "%SOURCE_DIR%\POSTGRESQL_UPGRADE_PATH.md" "%DEPLOY_DIR%\POSTGRESQL_UPGRADE_PATH.md" /Y
copy "%SOURCE_DIR%\CONFIG_OVERRIDE_README.md" "%DEPLOY_DIR%\CONFIG_OVERRIDE_README.md" /Y

echo.
echo Files copied successfully!
echo Directory: %DEPLOY_DIR%
echo.
dir "%DEPLOY_DIR%"
