@echo off
echo.
echo ========================================
echo   Instalando dependencias...
echo ========================================
echo.

echo [1/3] Instalando dependencias raiz...
npm install

echo.
echo [2/3] Instalando dependencias backend (apps/api)...
cd apps\api
npm install

echo.
echo [3/3] Instalando dependencias frontend (apps/web)...
cd ..\web
npm install

cd ..\..

echo.
echo ========================================
echo   ✓ Instalacion completada!
echo ========================================
echo.
echo Proximos pasos:
echo 1. Copia los archivos .env:
echo    - apps\api\.env.example a apps\api\.env
echo    - apps\web\.env.example a apps\web\.env.local
echo.
echo 2. Inicia Docker:
echo    npm run docker:up
echo.
echo 3. Ejecuta migraciones:
echo    cd apps\api ^&^& npm run migration:run ^&^& npm run seed
echo.
pause
