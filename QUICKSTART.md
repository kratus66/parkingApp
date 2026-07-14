# Guía de Inicio Rápido 🚀

## Requisitos
- Node.js v18+
- Docker y Docker Compose
- Git

## Paso 1: Instalar dependencias

```bash
# Desde la raíz del repo (parkingApp/)
npm install

# Backend
cd apps/api && npm install

# Frontend
cd ../web && npm install

# Volver a raíz
cd ../..
```

## Paso 2: Configurar variables de entorno

### Backend
```bash
cd apps/api
cp .env.example .env
```

Ajusta en `apps/api/.env`:

```env
PORT=3001
DB_PORT=5433        # ¡ojo! el compose publica Postgres en 5433, no 5432
```

### Frontend
```bash
cd apps/web
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Paso 3: Levantar base de datos

```bash
# Desde la raíz
npm run docker:up          # o: docker compose -f infra/docker-compose.yml up -d
npm run docker:logs        # verificar que postgres esté healthy
```

Levanta **PostgreSQL 15** (host `5433`) y **pgAdmin** (`http://localhost:5051`).

## Paso 4: Ejecutar migraciones

```bash
cd apps/api
npm run migration:run
```

## Paso 5: Ejecutar seeds (datos demo)

```bash
npm run seed
```

Esto crea:
- 1 empresa y el parqueadero **"Parqueadero Centro"** con 4 zonas y 50 puestos
  (20 autos, 15 motos, 5 camiones/buses, 10 bicicletas)
- Plan tarifario **"Tarifa Base 2026"** (24 reglas) + config (gracia 15 min, multa $20.000)
- Festivos de Colombia 2026
- 2 clientes demo con vehículos y consentimientos
- 3 usuarios:
  - **Admin**: admin@demo.com / Admin123*
  - **Supervisor**: supervisor@demo.com / Super123*
  - **Cajero**: cajero@demo.com / Cajero123*

## Paso 6: Iniciar backend

```bash
# Desde apps/api o desde raíz
npm run api:dev
```

✅ API: http://localhost:3001/api/v1
✅ Swagger: http://localhost:3001/docs

## Paso 7: Iniciar frontend

En otra terminal:

```bash
cd apps/web
npx next dev -p 3003
```

✅ Frontend: http://localhost:3003

> ⚠️ **El CORS del backend está hardcodeado** (`apps/api/src/main.ts`) a los puertos
> **3000, 3003 y 3005**. Si corres el frontend en otro puerto, las peticiones fallarán por
> CORS. `npm run web:dev` usa 3000 por defecto; si 3000 está ocupado por otro proyecto, usa
> `-p 3003` como arriba.

## Paso 8: Probar el flujo completo

1. Ve a http://localhost:3003/login → `cajero@demo.com` / `Cajero123*`
2. **Caja → Abrir turno** (ingresa una base, p. ej. $50.000) — la política por defecto exige
   turno abierto para operar
3. **Dashboard → Registrar entrada**: escribe una placa; si no existe, el modal crea cliente
   y vehículo y luego hace el check-in → ticket térmico
4. **Operaciones → Checkout**: busca por placa/ticket → preview con el motor de tarifas →
   cobra (efectivo con cambio, tarjeta, etc.) → factura imprimible
5. **Caja → Arqueo** (cuenta por denominaciones) y **Cerrar turno** → esperado vs. contado

El detalle de todas las reglas está en [docs/BUSINESS_LOGIC.md](docs/BUSINESS_LOGIC.md).

## URLs importantes

- **Frontend**: http://localhost:3003 (o 3000/3005 — ver nota de CORS)
- **Backend API**: http://localhost:3001/api/v1
- **Swagger**: http://localhost:3001/docs
- **PostgreSQL**: localhost:**5433** (usuario `parking_user`)
- **pgAdmin**: http://localhost:**5051** — admin@parking.com / admin123

## Comandos útiles

```bash
# Desde la raíz del proyecto

# Docker
npm run docker:up        # Levantar PostgreSQL + pgAdmin
npm run docker:down      # Detener
npm run docker:logs      # Ver logs

# Backend
npm run api:dev          # Desarrollo
npm run api:build        # Compilar

# Frontend
npm run web:dev          # Desarrollo (puerto 3000)
npm run web:build        # Compilar

# Calidad
npm run lint
npm run format
```

## Troubleshooting

### Error: "ECONNREFUSED" al conectar a la DB
- Verifica que Docker esté corriendo y `npm run docker:up` haya terminado
- Confirma `DB_PORT=5433` en `apps/api/.env` (el compose **no** publica en 5432)

### Error: "relation does not exist"
- Ejecuta las migraciones: `cd apps/api && npm run migration:run`

### El frontend carga pero todas las llamadas fallan (CORS / Network Error)
- El frontend debe correr en 3000, 3003 o 3005 (CORS hardcodeado en `main.ts`)
- Verifica `NEXT_PUBLIC_API_URL` en `apps/web/.env.local`
- Nota: las pantallas de **pricing** y el **simulador** tienen la URL del API hardcodeada a
  `localhost:3002` (bug conocido — BUSINESS_LOGIC H16); fallarán aunque el resto funcione

### "Debe abrir un turno de caja antes de registrar vehículos"
- Es la política de caja por defecto: abre turno en **Caja → Abrir Turno** con el usuario
  cajero, o desactívala vía `PATCH /cash/policy` (SUPERVISOR/ADMIN)

### Puerto 3000/3001 ya en uso
- Frontend: usa `-p 3003` o `-p 3005`
- Backend: cambia `PORT` en `.env` (y recuerda actualizar `NEXT_PUBLIC_API_URL`)

## Próximos pasos

1. Lee [docs/BUSINESS_LOGIC.md](docs/BUSINESS_LOGIC.md) — la lógica de negocio de punta a punta
2. Revisa [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — estructura técnica
3. Prueba los endpoints en Swagger: http://localhost:3001/docs

---

¡Disfruta construyendo! 🎉