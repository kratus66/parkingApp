# Sistema de Gestión de Parqueaderos 🚗

Sistema SaaS multi-empresa para la gestión integral de parqueaderos, construido con **NestJS**, **Next.js**, **PostgreSQL** y **TypeScript**.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecutar el Proyecto](#ejecutar-el-proyecto)
- [Arquitectura](#arquitectura)
- [Sprints y Roadmap](#sprints-y-roadmap)
- [Tecnologías](#tecnologías)

## ✨ Características

- ✅ **Multi-empresa / Multi-parqueadero**: Soporte para múltiples empresas y parqueaderos
- ✅ **Autenticación JWT**: Sistema de autenticación seguro con roles (Admin, Supervisor, Cajero)
- ✅ **Auditoría completa**: Registro automático de todas las operaciones críticas
- ✅ **API REST documentada**: Documentación Swagger automática
- ✅ **TypeScript 100%**: Type-safety en frontend y backend
- ✅ **Base de datos PostgreSQL**: Con migraciones y seeds
- ✅ **Docker**: Entorno de desarrollo containerizado
- ✅ **Linting y formateo**: ESLint + Prettier configurados

## 🔧 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js** v18+ y **npm** v9+
- **Docker** y **Docker Compose**
- **Git**

## 📁 Estructura del Proyecto

```
parking-system/
├── apps/
│   ├── api/              # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/  # Módulos de negocio
│   │   │   ├── common/   # Guards, decorators, filters, etc.
│   │   │   ├── database/ # Configuración DB, migraciones, seeds
│   │   │   └── main.ts
│   │   └── package.json
│   └── web/              # Frontend Next.js
│       ├── src/
│       │   ├── app/      # App Router de Next.js
│       │   ├── components/
│       │   ├── lib/      # Utilidades (API client)
│       │   └── types/
│       └── package.json
├── infra/
│   ├── docker-compose.yml
│   └── db/
├── docs/
│   ├── ARCHITECTURE.md
│   └── SPRINTS.md
├── package.json          # Workspace raíz
└── README.md
```

## 🚀 Instalación

### 1. Clonar el repositorio (si aplica)

```bash
git clone <tu-repositorio>
cd parking-system
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del workspace raíz
npm install

# Instalar dependencias del backend
cd apps/api
npm install

# Instalar dependencias del frontend
cd ../web
npm install

# Volver a la raíz
cd ../..
```

## ⚙️ Configuración

### Backend (API)

Copia el archivo de ejemplo y configura las variables de entorno:

```bash
cd apps/api
cp .env.example .env
```

Edita `apps/api/.env`:

```env
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=parking_user
DB_PASSWORD=parking_pass_2026
DB_DATABASE=parking_system

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2026
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (Web)

```bash
cd apps/web
cp .env.example .env.local
```

Edita `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 🏃 Ejecutar el Proyecto

### Paso 1: Levantar la base de datos con Docker

Desde la raíz del proyecto:

```bash
# Iniciar PostgreSQL y pgAdmin
npm run docker:up

# Ver logs
npm run docker:logs

# Detener contenedores
npm run docker:down
```

**Accesos:**
- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@parking.com`
  - Password: `admin123`

### Paso 2: Ejecutar migraciones

```bash
cd apps/api

# Ejecutar migraciones (crear tablas)
npm run migration:run
```

### Paso 3: Ejecutar seeds (datos demo)

```bash
npm run seed
```

**Credenciales demo creadas:**
- **Admin**: `admin@demo.com` / `Admin123*`
- **Supervisor**: `supervisor@demo.com` / `Super123*`
- **Cajero**: `cajero@demo.com` / `Cajero123*`

### Paso 4: Iniciar el backend

```bash
# Desde apps/api o desde la raíz
npm run api:dev
```

El servidor iniciará en: `http://localhost:3001/api/v1`

**Swagger docs**: `http://localhost:3001/docs`

### Paso 5: Iniciar el frontend

En otra terminal:

```bash
# Desde apps/web o desde la raíz
npm run web:dev
```

La aplicación web estará en: `http://localhost:3000`

## 🧪 Probar la aplicación

1. Abre `http://localhost:3000`
2. Ve a `/login`
3. Usa las credenciales demo: `admin@demo.com` / `Admin123*`
4. Explora el dashboard

## 📚 Arquitectura

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalles completos sobre:
- Módulos backend
- Entidades y relaciones
- Sistema de autenticación y roles
- Sistema de auditoría
- Flujo de datos

## 🗺️ Sprints y Roadmap

Ver [docs/SPRINTS.md](docs/SPRINTS.md) para la planificación detallada de los siguientes sprints:

1. ✅ **Sprint 0**: Infraestructura base (completado)
2. 🔜 **Sprint 1**: Gestión de vehículos y tickets
3. 🔜 **Sprint 2**: Tarifas y facturación
4. 🔜 **Sprint 3**: Reportes y estadísticas
5. ... (10 sprints planificados)

## 🛠️ Tecnologías

### Backend
- **NestJS** v10 - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** v16 - Base de datos
- **Passport JWT** - Autenticación
- **Swagger** - Documentación API
- **Bcrypt** - Hashing de contraseñas
- **Class-validator** - Validación de DTOs

### Frontend
- **Next.js** v14 - Framework React
- **React** v18 - UI Library
- **TypeScript** - Type safety
- **TailwindCSS** - Estilos
- **Axios** - HTTP client
- **React Hook Form** + **Zod** - Validación de formularios
- **TanStack Query** - Data fetching

### Infraestructura
- **Docker** - Containerización
- **PostgreSQL** - Base de datos
- **pgAdmin** - Administración DB

## 📝 Scripts útiles

### Raíz del proyecto

```bash
npm run api:dev           # Iniciar backend en desarrollo
npm run api:build         # Compilar backend
npm run api:start         # Iniciar backend en producción

npm run web:dev           # Iniciar frontend en desarrollo
npm run web:build         # Compilar frontend
npm run web:start         # Iniciar frontend en producción

npm run docker:up         # Levantar Docker Compose
npm run docker:down       # Detener Docker Compose
npm run docker:logs       # Ver logs de Docker

npm run lint              # Ejecutar linters
npm run format            # Formatear código
```

### Backend (apps/api)

```bash
npm run start:dev         # Desarrollo con hot-reload
npm run build             # Compilar
npm run start:prod        # Producción

npm run migration:generate  # Generar migración
npm run migration:run       # Ejecutar migraciones
npm run migration:revert    # Revertir última migración
npm run seed                # Ejecutar seeds

npm run lint              # ESLint
npm run format            # Prettier
npm run test              # Tests unitarios
npm run test:e2e          # Tests e2e
```

### Frontend (apps/web)

```bash
npm run dev               # Desarrollo
npm run build             # Compilar
npm run start             # Producción
npm run lint              # ESLint
npm run format            # Prettier
```

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- JWT con expiración configurable
- CORS configurado
- Helmet para headers de seguridad
- Validación de entrada con class-validator
- Guards de autenticación y roles

## 🤝 Contribuir

1. Crea un branch para tu feature
2. Haz commits con mensajes descriptivos
3. Asegúrate de que pasen los linters
4. Crea un Pull Request

## 📄 Licencia

MIT

---

**¡Listo para empezar a construir! 🚀**

Para más información, consulta:
- [Arquitectura](docs/ARCHITECTURE.md)
- [Sprints](docs/SPRINTS.md)
- [Swagger API](http://localhost:3001/docs) (cuando el backend esté corriendo)
