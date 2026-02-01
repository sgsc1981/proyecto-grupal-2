# Proyecto Grupal Docker - 3 Servicios con Docker Compose

## Descripción del proyecto

Sistema de 3 servicios independientes implementados con Docker y Docker Compose, que incluye un Backend API (Node.js + Express), una Base de Datos (PostgreSQL), y un Frontend Web (Nginx + HTML/CSS/JS). Este proyecto demuestra la orquestación de múltiples contenedores y la comunicación entre servicios en un entorno Dockerizado.

## Integrantes del grupo

### Santiago Geovanny Sánchez Camacho

Servicio 1: Backend API

Servicio 2: Base de Datos

### Janela Abigail Reyes Sánchez

Servicio 3: Frontend Web	

## Arquitectura del Sistema

```text
┌───────────────┐      ┌───────────────┐      ┌────────────────┐
│   FRONTEND    │ ---> │    BACKEND    │ ---> │    DATABASE    │
│   (Nginx)     │      │   (Node.js)   │      │  (PostgreSQL)  │
│ Puerto: 8080  │      │ Puerto: 3000  │      │ Puerto: 5432   │
└───────────────┘      └───────────────┘      └────────────────┘
```
## Servicios Implementados

### 1. Backend API - Node.js + Express

Puerto: 3000

Tecnología: Node.js 18 + Express.js

Endpoints Implementados:

GET /health - Verifica estado del sistema y conexión a BD

GET /db-test - Prueba de conexión a PostgreSQL

GET /users - Lista todos los usuarios

POST /users - Crea un nuevo usuario

PUT /users/:id - Actualiza un usuario existente

DELETE /users/:id - Elimina un usuario

GET /products - Obtiene lista de productos

GET /stats - Estadísticas del sistema

GET /system-info - Información del servidor

GET /info - Información básica del API

GET /data - Datos de ejemplo

POST /echo - Devuelve datos recibidos

GET /ping - Verifica que el servidor responda

GET /version - Versión del API

### 2. Base de Datos - PostgreSQL

Puerto: 5432

Versión: PostgreSQL 15

Credenciales:

Usuario: postgres

Contraseña: password123

Base de datos: proyecto_db

Características:

Persistencia de datos con volumen Docker

Script de inicialización automática

Tablas: usuarios, productos

Datos de ejemplo pre-cargados

### 3. Frontend Web - Nginx + HTML/CSS/JS

Puerto: 8080

Tecnología: Nginx Alpine + HTML5 + CSS3 + JavaScript

Características:

Interfaz responsive (mobile-first)

Dashboard con sistema de pestañas

Formularios interactivos para CRUD

Visualización de JSON formateado

Consumo de API mediante fetch

Diseño moderno con CSS Grid/Flexbox

### Requisitos Previos

Docker Engine (versión 20.10 o superior)

Docker Compose (versión 2.0 o superior)

Git (para clonar el repositorio)

4GB de RAM mínimo recomendado

## Instalación y ejecución

### Paso 1: Clonar el repositorio

```
git clone https://github.com/sgsc1981/proyecto-grupal-2.git
cd proyecto-grupal-2
```

### Paso 2: Ejecutar con Docker Compose

```
# Construir imágenes y levantar contenedores
docker-compose up --build

# O ejecutar en segundo plano
docker-compose up -d
```

### Paso 3: Acceder a los servicios

```
│  Servicio	        │            URL               │    Puerto  │
│  Frontend Web	    │     http://localhost:8080	   │     8080   │
│  Backend API	    │     http://localhost:3000	   │     3000   │
│  Base de Datos	│     localhost:5432	       │     5432   │
```

## Comandos útiles

### Gestión de Contenedores

```
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Ver estado de los contenedores
docker-compose ps
```

### Monitoreo y Logs

```
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs específicos
docker-compose logs backend
docker-compose logs database
docker-compose logs frontend

# Ver uso de recursos
docker stats
```

### Acceso a Contenedores

```
# Acceder al contenedor del backend
docker exec -it proyecto-backend sh

# Acceder a PostgreSQL
docker exec -it proyecto-db psql -U postgres -d proyecto_db

# Ver logs en tiempo real
docker-compose logs -f --tail=50
```

## Pruebas del Sistema

### Pruebas del Backend API

```
# Verificar salud del sistema
curl http://localhost:3000/health

# Probar conexión a base de datos
curl http://localhost:3000/db-test

# Listar usuarios
curl http://localhost:3000/users

# Crear nuevo usuario
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Pérez", "email": "juan@example.com", "edad": 25}'

# Obtener estadísticas
curl http://localhost:3000/stats
```

### Pruebas de Base de Datos
```

# Acceder directamente a PostgreSQL
docker exec -it proyecto-db psql -U postgres -d proyecto_db

# Consultar usuarios
SELECT * FROM usuarios;

# Consultar productos
SELECT * FROM productos;
```

### Pruebas del Frontend

Abrir navegador en: http://localhost:8080

Navegar por las pestañas:

Dashboard: Vista general del sistema

Usuarios: CRUD completo de usuarios

Productos: Lista de productos

API Tests: Prueba todos los endpoints

Estadísticas: Métricas del sistema

## Estructura del Proyecto
``` text
proyecto-grupal-2/
├── backend/                    # Servicio 1: API Node.js
│   ├── index.js               # Aplicación principal (14 endpoints)
│   ├── package.json           # Dependencias: express, pg, cors
│   ├── package-lock.json      # Lock de dependencias
│   ├── Dockerfile             # Imagen Docker (Node.js 18 Alpine)
│   └── .dockerignore          # Archivos excluidos del build
├── database/                  # Servicio 2: PostgreSQL
│   └── init.sql              # Script de inicialización (tablas + datos)
├── frontend/                  # Servicio 3: Interfaz web
│   └── index.html            # Aplicación web completa
├── docker-compose.yml         # Orquestación de servicios
├── README.md                  # Este archivo
└── .gitignore                 # Archivos ignorados por Git
```
 ## Configuración Docker Compose
 
 ### Archivo docker-compose.yml

```
version: '3.8'

services:
  # Servicio 1: Backend API (Node.js + Express)
  backend:
    build: ./backend
    container_name: proyecto-backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=database
      - DB_USER=postgres
      - DB_PASSWORD=password123
      - DB_NAME=proyecto_db
      - DB_PORT=5432
    depends_on:
      - database
    networks:
      - proyecto-network
    restart: unless-stopped

  # Servicio 2: Base de Datos (PostgreSQL)
  database:
    image: postgres:15-alpine
    container_name: proyecto-database
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password123
      - POSTGRES_DB=proyecto_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - proyecto-network
    restart: unless-stopped

  # Servicio 3: Frontend Web (Nginx)
  frontend:
    image: nginx:alpine
    container_name: proyecto-frontend
    ports:
      - "8080:80"
    volumes:
      - ./frontend:/usr/share/nginx/html
    depends_on:
      - backend
    networks:
      - proyecto-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local

networks:
  proyecto-network:
    driver: bridge
```

### Backend Dockerfile
```
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```
## Funcionalidades Clave
 ###  ✅ Backend API Completo
14 endpoints REST documentados

CRUD completo de usuarios con validación

Pool de conexiones a PostgreSQL optimizado

Middleware de logs para todas las peticiones

Manejo de errores con respuestas apropiadas

CORS habilitado para comunicación con frontend

### ✅ Base de Datos Robusta
Volumen persistente para datos

Backup automático de información

Script de inicialización con datos de prueba

Índices optimizados para consultas rápidas

Credenciales seguras con variables de entorno

### ✅ Frontend Moderno
Diseño responsive (móvil, tablet, desktop)

Consumo de API con fetch y async/await

Formularios interactivos con validación

Visualización de JSON formateado con sintaxis

Sistema de pestañas para organización

Feedback visual para todas las acciones

## Diagnóstico y Solución de Problemas
### Problemas Comunes y Soluciones
#### 1. Error de puertos en uso

```
# Verificar qué proceso usa un puerto
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :8080

# Detener servicios que usan los puertos
sudo kill -9 <PID>
```

#### 2. Error de permisos Docker

```
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```
#### 3. Limpiar recursos Docker

```
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes no usadas
docker image prune

# Eliminar volúmenes no usados
docker volume prune

# Limpiar todo
docker system prune -a
```
#### 4. Reconstruir desde cero

```
# Detener y eliminar todo
docker-compose down -v --rmi all

# Reconstruir
docker-compose up --build
```
## Pruebas de Rendimiento
### Test de carga básico

```
# Probar 100 peticiones al endpoint /health
ab -n 100 -c 10 http://localhost:3000/health

# Probar tiempo de respuesta de la base de datos
docker exec proyecto-backend node -e "
  const { Client } = require('pg');
  const client = new Client({
    host: 'database',
    user: 'postgres',
    password: 'password123',
    database: 'proyecto_db'
  });
  
  (async () => {
    await client.connect();
    const start = Date.now();
    await client.query('SELECT 1');
    console.log('Tiempo de respuesta BD:', Date.now() - start, 'ms');
    await client.end();
  })();
"
```
### Métricas y Monitoreo

#### Endpoints de monitoreo disponibles
GET /health - Salud del sistema

GET /stats - Estadísticas de uso

GET /system-info - Información del servidor

#### Verificar estado manualmente

```
# Verificar que todos los contenedores estén corriendo
docker-compose ps

# Verificar logs de errores
docker-compose logs --tail=100 | grep -i error

# Verificar uso de memoria
docker stats --no-stream
```
## Instrucciones para el Docente
### Para evaluar el proyecto:

```
# 1. Clonar repositorio
git clone https://github.com/sgsc1981/proyecto-grupal-2.git
cd proyecto-grupal-2

# 2. Ejecutar el sistema completo
docker-compose up --build

# 3. Verificar funcionamiento
# Abrir navegador en: http://localhost:8080
# O usar terminal: curl http://localhost:3000/health

# 4. Probar funcionalidades
# - Probar CRUD de usuarios desde la interfaz web
# - Probar conexión a base de datos
# - Verificar persistencia de datos

# 5. Limpiar recursos
docker-compose down -v
```
