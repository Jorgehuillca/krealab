# 🏷️ KreaLab – Sistema de Ventas | Impresiones 3D

Sistema web full-stack de gestión de ventas para tienda de impresiones 3D.  
Stack: **React + Vite · Node.js + Express · MySQL · JWT · TailwindCSS**

---

## 📁 Estructura del Proyecto

```
krelab/
├── backend/               # API REST (Node.js + Express MVC)
│   ├── src/
│   │   ├── config/        # Conexión MySQL
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── middlewares/   # Auth JWT + Error handler
│   │   ├── routes/        # Endpoints REST
│   │   └── database/      # Script SQL
│   ├── .env
│   └── server.js
└── frontend/              # UI (React + Vite + TailwindCSS)
    └── src/
        ├── api/           # Axios instance
        ├── context/       # Auth Context
        ├── layouts/       # Sidebar layout
        └── pages/         # Login, Dashboard, Ventas...
```

---

## ⚙️ Requisitos

- **Node.js** v18 o superior
- **MySQL** 8.0 o superior
- **npm** v9+

---

## 🗄️ 1. Base de Datos

1. Abre **MySQL Workbench** (o cualquier cliente MySQL)
2. Ejecuta el script completo:

```sql
-- Ruta: backend/src/database/krelab.sql
```

3. Verifica que la base de datos `KreaLab_Final` se creó con sus tablas y datos semilla.

---

## 🔧 2. Backend

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales MySQL:
#   DB_USER=root
#   DB_PASSWORD=tu_password

# 3. Iniciar servidor
npm run dev       # desarrollo (nodemon)
npm start         # producción
```

El API estará disponible en: **http://localhost:4000**

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/dashboard` | Stats y KPIs |
| GET/POST/PUT/DELETE | `/api/products` | CRUD productos |
| GET/POST/PUT/DELETE | `/api/clients` | CRUD clientes |
| GET/POST | `/api/sales` | Ventas y comprobantes |
| GET | `/api/sales/:id` | Detalle de venta |
| GET/POST/PUT/DELETE | `/api/users` | CRUD usuarios (admin) |

---

## 🎨 3. Frontend

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Build para producción
npm run build
```

El frontend estará en: **http://localhost:5173**

---

## 🔑 Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `maria.quispe` | `admin` | Administrador |
| `ana.torres` | `ana123` | Vendedor |
| `luis.paredes` | `luis456` | Vendedor |

---

## 🚀 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| 🔐 Login | Autenticación JWT con roles |
| 📊 Dashboard | KPIs, gráfico de ventas, top figuras, alertas stock |
| 🛒 Nueva Venta | Registrar Boleta/Factura con base personalizada opcional |
| 🧾 Comprobante | Vista e impresión del comprobante con desglose IGV |
| 📦 Productos | CRUD de figuras 3D (Resina/Filamento, stock, precios) |
| 👥 Clientes | CRUD con búsqueda por DNI o RUC |
| 📋 Historial | Todas las ventas con filtros por tipo y fecha |
| 👤 Usuarios | CRUD de empleados y accesos (solo Administrador) |

---

## 💡 Reglas de Negocio

- **Figuras** → material **Resina**, precio **sin IGV**
- **Base Personalizada** → material **Filamento**, S/.20 sin IGV, **opcional**
- **IGV = 18%** sobre el precio base (Opción B: se agrega encima)
- **Boleta** → clientes con DNI (8 dígitos)
- **Factura** → empresas con RUC (11 dígitos)
- El stock se descuenta automáticamente al registrar una venta

---

## 🗂️ Variables de Entorno (.env)

```env
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=KreaLab_Final
JWT_SECRET=krelab_super_secret_key_2025
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
```

---

## 🐳 Docker (opcional)

```bash
# Crear imagen del backend
docker build -t krelab-api ./backend

# Ejecutar
docker run -p 4000:4000 --env-file ./backend/.env krelab-api
```

---

## 📄 Licencia

Proyecto educativo – SENATI · Ingeniería de Software con IA  
KreaLab Studio E.I.R.L. · Tienda de Impresiones 3D
