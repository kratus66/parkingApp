@echo off
REM Script de instalación y configuración inicial para Windows
REM Ejecuta este script desde la raíz del proyecto

echo.
echo ========================================
echo   Parking System - Instalacion
echo ========================================
echo.

REM 1. Instalar dependencias raíz
echo [1/8] Instalando dependencias raiz...
call npm install
if errorlevel 1 goto error

REM 2. Instalar dependencias backend
echo.
echo [2/8] Instalando dependencias backend...
cd apps\api
call npm install
if errorlevel 1 goto error

REM 3. Copiar .env backend
echo.
echo [3/8] Configurando variables de entorno backend...
if not exist .env (
    copy .env.example .env
    echo     ✓ Archivo .env creado
) else (
    echo     ! .env ya existe
)

cd ..\..

REM 4. Instalar dependencias frontend
echo.
echo [4/8] Instalando dependencias frontend...
cd apps\web
call npm install
if errorlevel 1 goto error

REM 5. Copiar .env frontend
echo.
echo [5/8] Configurando variables de entorno frontend...
if not exist .env.local (
    copy .env.example .env.local
    echo     ✓ Archivo .env.local creado
) else (
    echo     ! .env.local ya existe
)

cd ..\..

REM 6. Levantar Docker
echo.
echo [6/8] Levantando Docker Compose (PostgreSQL + pgAdmin)...
call npm run docker:up
if errorlevel 1 goto docker_error

REM Esperar a que PostgreSQL esté listo
echo.
echo [7/8] Esperando a que PostgreSQL este listo (15 segundos)...
timeout /t 15 /nobreak > nul

REM 7. Ejecutar migraciones
echo.
echo [8/8] Ejecutando migraciones de base de datos...
cd apps\api
call npm run migration:run
if errorlevel 1 goto migration_error

REM 8. Ejecutar seeds
echo.
echo Ejecutando seeds (datos demo)...
call npm run seed
if errorlevel 1 goto seed_error

cd ..\..

REM Resumen final
echo.
echo ========================================
echo   ✓ Configuracion completada!
echo ========================================
echo.
echo Proximos pasos:
echo.
echo 1. Iniciar el backend:
echo    cd apps\api ^&^& npm run start:dev
echo    o desde raiz: npm run api:dev
echo.
echo 2. En otra terminal, iniciar el frontend:
echo    cd apps\web ^&^& npm run dev
echo    o desde raiz: npm run web:dev
echo.
echo 3. Acceder a las URLs:
echo    • Frontend:  http://localhost:3000
echo    • API:       http://localhost:3001/api/v1
echo    • Swagger:   http://localhost:3001/docs
echo    • pgAdmin:   http://localhost:5050
echo.
echo 4. Credenciales demo:
echo    • Admin:      admin@demo.com / Admin123*
echo    • Supervisor: supervisor@demo.com / Super123*
echo    • Cajero:     cajero@demo.com / Cajero123*
echo.
echo Documentacion:
echo    • README.md          - Informacion general
echo    • QUICKSTART.md      - Guia rapida
echo    • PROJECT_SUMMARY.md - Resumen del proyecto
echo    • docs\ARCHITECTURE.md - Arquitectura tecnica
echo    • docs\SPRINTS.md    - Roadmap de desarrollo
echo.
echo ¡Listo para empezar! 🚀
echo.
goto end

:docker_error
echo.
echo ========================================
echo   ERROR: Docker no pudo iniciarse
echo ========================================
echo.
echo Asegurate de que Docker Desktop este ejecutandose.
echo Luego ejecuta manualmente:
echo    npm run docker:up
echo    cd apps\api ^&^& npm run migration:run
echo    npm run seed
echo.
goto end

:migration_error
echo.
echo ========================================
echo   ERROR: Las migraciones fallaron
echo ========================================
echo.
echo Verifica que PostgreSQL este corriendo.
echo Ejecuta manualmente:
echo    npm run docker:logs
echo    cd apps\api ^&^& npm run migration:run
echo.
goto end

:seed_error
echo.
echo ========================================
echo   ERROR: Los seeds fallaron
echo ========================================
echo.
echo Ejecuta manualmente:
echo    cd apps\api ^&^& npm run seed
echo.
goto end

:error
echo.
echo ========================================
echo   ERROR en la instalacion
echo ========================================
echo.
echo Verifica tu version de Node.js: node --version
echo Debe ser v18 o superior.
echo.
goto end

:end
pause
