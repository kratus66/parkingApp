#!/bin/bash
# Script de instalación y configuración inicial
# Ejecuta este script desde la raíz del proyecto

echo "🚀 Iniciando configuración del proyecto Parking System..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Instalar dependencias raíz
echo -e "\n${BLUE}📦 Instalando dependencias raíz...${NC}"
npm install

# 2. Instalar dependencias backend
echo -e "\n${BLUE}📦 Instalando dependencias backend...${NC}"
cd apps/api
npm install

# 3. Copiar .env backend
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}⚙️  Copiando .env.example a .env (backend)...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Archivo .env creado en apps/api${NC}"
else
    echo -e "\n${YELLOW}⚠️  .env ya existe en apps/api${NC}"
fi

cd ../..

# 4. Instalar dependencias frontend
echo -e "\n${BLUE}📦 Instalando dependencias frontend...${NC}"
cd apps/web
npm install

# 5. Copiar .env frontend
if [ ! -f .env.local ]; then
    echo -e "\n${YELLOW}⚙️  Copiando .env.example a .env.local (frontend)...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✅ Archivo .env.local creado en apps/web${NC}"
else
    echo -e "\n${YELLOW}⚠️  .env.local ya existe en apps/web${NC}"
fi

cd ../..

# 6. Levantar Docker
echo -e "\n${BLUE}🐳 Levantando Docker Compose (PostgreSQL + pgAdmin)...${NC}"
npm run docker:up

# Esperar a que PostgreSQL esté listo
echo -e "\n${YELLOW}⏳ Esperando a que PostgreSQL esté listo (15 segundos)...${NC}"
sleep 15

# 7. Ejecutar migraciones
echo -e "\n${BLUE}🗄️  Ejecutando migraciones de base de datos...${NC}"
cd apps/api
npm run migration:run

# 8. Ejecutar seeds
echo -e "\n${BLUE}🌱 Ejecutando seeds (datos demo)...${NC}"
npm run seed

cd ../..

# Resumen final
echo -e "\n${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ¡Configuración completada exitosamente!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}🎯 Próximos pasos:${NC}"
echo -e "
1. Iniciar el backend:
   ${YELLOW}cd apps/api && npm run start:dev${NC}
   o desde raíz: ${YELLOW}npm run api:dev${NC}

2. En otra terminal, iniciar el frontend:
   ${YELLOW}cd apps/web && npm run dev${NC}
   o desde raíz: ${YELLOW}npm run web:dev${NC}

3. Acceder a las URLs:
   • Frontend:  ${GREEN}http://localhost:3000${NC}
   • API:       ${GREEN}http://localhost:3001/api/v1${NC}
   • Swagger:   ${GREEN}http://localhost:3001/docs${NC}
   • pgAdmin:   ${GREEN}http://localhost:5050${NC}

4. Credenciales demo:
   • Admin:      ${GREEN}admin@demo.com / Admin123*${NC}
   • Supervisor: ${GREEN}supervisor@demo.com / Super123*${NC}
   • Cajero:     ${GREEN}cajero@demo.com / Cajero123*${NC}
"

echo -e "${BLUE}📚 Documentación:${NC}"
echo -e "   • README.md          - Información general"
echo -e "   • QUICKSTART.md      - Guía rápida"
echo -e "   • PROJECT_SUMMARY.md - Resumen del proyecto"
echo -e "   • docs/ARCHITECTURE.md - Arquitectura técnica"
echo -e "   • docs/SPRINTS.md    - Roadmap de desarrollo"

echo -e "\n${GREEN}¡Listo para empezar! 🚀${NC}\n"
