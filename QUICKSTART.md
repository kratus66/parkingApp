# Guía de Inicio Rápido 🚀

## Requisitos
- Node.js v18+
- Docker y Docker Compose
- Git

## Paso 1: Instalar dependencias

```bash
# Desde la raíz del proyecto
cd c:/Users/Usuario/Desktop/parking_app

# Instalar dependencias raíz
npm install

# Instalar dependencias backend
cd apps/api
npm install

# Instalar dependencias frontend
cd ../web
npm install

# Volver a raíz
cd ../..
```

## Paso 2: Configurar variables de entorno

### Backend
```bash
cd apps/api
cp .env.example .env
```

Edita `apps/api/.env` si necesitas cambiar algo (los valores por defecto funcionan).

### Frontend
```bash
cd apps/web
cp .env.example .env.local
```

## Paso 3: Levantar base de datos

```bash
# Desde la raíz
npm run docker:up

# Espera unos segundos y verifica que esté corriendo
npm run docker:logs
```

## Paso 4: Ejecutar migraciones

```bash
cd apps/api
npm run migration:run
```

## Paso 5: Ejecutar seeds (datos demo)

```bash
npm run seed
```

Esto creará:
- 1 empresa demo
- 1 parqueadero demo
- 3 usuarios:
  - **Admin**: admin@demo.com / Admin123*
  - **Supervisor**: supervisor@demo.com / Super123*
  - **Cajero**: cajero@demo.com / Cajero123*

## Paso 6: Iniciar backend

```bash
# Desde apps/api o desde raíz
npm run api:dev
```

✅ API corriendo en: http://localhost:3001/api/v1
✅ Swagger: http://localhost:3001/docs

## Paso 7: Iniciar frontend

En otra terminal:

```bash
# Desde apps/web o desde raíz
npm run web:dev
```

✅ Frontend: http://localhost:3000

## Paso 8: Probar

1. Ve a http://localhost:3000
2. Click en "Iniciar Sesión"
3. Usa: admin@demo.com / Admin123*
4. ¡Listo! Estás en el dashboard

## URLs importantes

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Swagger**: http://localhost:3001/docs
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:5050
  - Email: admin@parking.com
  - Password: admin123

## Comandos útiles

```bash
# Desde la raíz del proyecto

# Docker
npm run docker:up        # Levantar PostgreSQL
npm run docker:down      # Detener PostgreSQL
npm run docker:logs      # Ver logs

# Backend
npm run api:dev          # Desarrollo
npm run api:build        # Compilar
npm run api:migration:run     # Ejecutar migraciones
npm run api:seed         # Ejecutar seeds

# Frontend
npm run web:dev          # Desarrollo
npm run web:build        # Compilar

# Linting
npm run lint             # Ejecutar linters en todo
npm run format           # Formatear código
```

## Troubleshooting

### Error: "ECONNREFUSED" al conectar a la DB
- Verifica que Docker esté corriendo
- Ejecuta `npm run docker:up` y espera unos segundos

### Error: "relation does not exist"
- Ejecuta las migraciones: `cd apps/api && npm run migration:run`

### Puerto 3000 o 3001 ya en uso
- Cambia el puerto en las variables de entorno
- O detén el proceso que usa ese puerto

### Error al instalar dependencias
- Verifica tu versión de Node: `node --version` (debe ser 18+)
- Limpia caché: `npm cache clean --force`
- Elimina node_modules y vuelve a instalar

## Próximos pasos

Una vez que todo esté funcionando:

1. Lee [ARCHITECTURE.md](docs/ARCHITECTURE.md) para entender la estructura
2. Revisa [SPRINTS.md](docs/SPRINTS.md) para ver el roadmap
3. Explora el código en `apps/api/src` y `apps/web/src`
4. Prueba los endpoints en Swagger: http://localhost:3001/docs
5. ¡Empieza a construir los siguientes sprints!

## Soporte

Si encuentras problemas:
1. Revisa los logs de Docker: `npm run docker:logs`
2. Revisa los logs del backend (en la terminal donde corre)
3. Verifica las variables de entorno

---

¡Disfruta construyendo! 🎉
