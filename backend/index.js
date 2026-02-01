const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const START_TIME = new Date();

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'proyecto_db',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Conectar a la base de datos al iniciar
pool.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error conectando a PostgreSQL:', err.message));

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ==================== ENDPOINTS PRINCIPALES ====================

// 1. ENDPOINT: Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      service: 'backend-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        server_time: new Date().toISOString()
      },
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      service: 'backend-api',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      },
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// 2. ENDPOINT: Prueba de base de datos
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Conexión a PostgreSQL exitosa'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al conectar con PostgreSQL'
    });
  }
});

// 3. ENDPOINT: Información del sistema
app.get('/system-info', (req, res) => {
  const uptime = process.uptime();
  const days = Math.floor(uptime / (3600 * 24));
  const hours = Math.floor((uptime % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  res.json({
    success: true,
    service: 'Backend API - Proyecto Grupal 2',
    version: '3.0.0',
    description: 'API REST con Node.js, Express y PostgreSQL para proyecto Docker',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Estado del sistema y conexión a BD' },
      { method: 'GET', path: '/db-test', description: 'Prueba de conexión a PostgreSQL' },
      { method: 'GET', path: '/users', description: 'Obtener todos los usuarios' },
      { method: 'GET', path: '/users/:id', description: 'Obtener usuario por ID' },
      { method: 'POST', path: '/users', description: 'Crear nuevo usuario' },
      { method: 'PUT', path: '/users/:id', description: 'Actualizar usuario' },
      { method: 'DELETE', path: '/users/:id', description: 'Eliminar usuario' },
      { method: 'GET', path: '/products', description: 'Obtener todos los productos' },
      { method: 'GET', path: '/stats', description: 'Estadísticas del sistema' },
      { method: 'GET', path: '/system-info', description: 'Información completa del API' },
      { method: 'GET', path: '/info', description: 'Información básica' },
      { method: 'GET', path: '/data', description: 'Datos de ejemplo' },
      { method: 'POST', path: '/echo', description: 'Echo endpoint (POST)' }
    ],
    database: {
      type: 'PostgreSQL',
      connected: true,
      host: process.env.DB_HOST || 'database'
    },
    server: {
      start_time: START_TIME.toISOString(),
      uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development',
      memory_usage: process.memoryUsage()
    },
    project: {
      name: 'Proyecto Grupal 2 - Docker',
      members: 3,
      services: ['Backend API', 'PostgreSQL', 'Frontend Nginx']
    }
  });
});

// 4. ENDPOINT: Información básica (compatibilidad con frontend)
app.get('/info', (req, res) => {
  res.json({
    service: 'Backend API',
    version: '3.0.0',
    endpoints: ['/health', '/db-test', '/users', '/products', '/stats', '/system-info', '/info', '/data', '/echo'],
    database: 'PostgreSQL',
    documentation: 'Ver README.md o endpoint /system-info'
  });
});

// 5. ENDPOINT: Datos de ejemplo
app.get('/data', (req, res) => {
  res.json({
    message: "Datos desde el backend",
    items: [
      { id: 1, name: "Item A", value: 100 },
      { id: 2, name: "Item B", value: 200 },
      { id: 3, name: "Item C", value: 300 }
    ],
    total: 3,
    generatedAt: new Date().toISOString()
  });
});

// 6. ENDPOINT: Echo (POST)
app.post('/echo', (req, res) => {
  const receivedData = req.body;
  res.json({
    received: receivedData,
    echoedAt: new Date().toISOString(),
    message: 'Datos recibidos correctamente'
  });
});

// ==================== CRUD DE USUARIOS ====================

// 7. ENDPOINT: Obtener todos los usuarios
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY creado_en DESC');
    res.json({
      success: true,
      count: result.rowCount,
      users: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 8. ENDPOINT: Obtener usuario por ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Usuario con ID ${id} no encontrado`
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 9. ENDPOINT: Crear nuevo usuario
app.post('/users', async (req, res) => {
  const { nombre, email } = req.body;
  
  // Validación básica
  if (!nombre || !email) {
    return res.status(400).json({
      success: false,
      error: 'Nombre y email son campos requeridos'
    });
  }
  
  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Formato de email inválido'
    });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *',
      [nombre, email]
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Violación de unique constraint (email duplicado)
      res.status(409).json({
        success: false,
        error: `El email '${email}' ya está registrado`
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// 10. ENDPOINT: Actualizar usuario
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email } = req.body;
  
  if (!nombre && !email) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere al menos un campo para actualizar (nombre o email)'
    });
  }
  
  try {
    // Verificar si el usuario existe
    const checkResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Usuario con ID ${id} no encontrado`
      });
    }
    
    // Construir la consulta dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (nombre) {
      updates.push(`nombre = $${paramCount}`);
      values.push(nombre);
      paramCount++;
    }
    
    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    
    values.push(id);
    
    const query = `
      UPDATE usuarios 
      SET ${updates.join(', ')}, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Email duplicado
      res.status(409).json({
        success: false,
        error: `El email '${email}' ya está registrado por otro usuario`
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// 11. ENDPOINT: Eliminar usuario
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Usuario con ID ${id} no encontrado`
      });
    }
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      deleted_user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== PRODUCTOS ====================

// 12. ENDPOINT: Obtener todos los productos
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY creado_en DESC');
    res.json({
      success: true,
      count: result.rowCount,
      products: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ESTADÍSTICAS ====================

// 13. ENDPOINT: Estadísticas del sistema
app.get('/stats', async (req, res) => {
  try {
    // Consultas paralelas para mejor rendimiento
    const [usersResult, productsResult, dbResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM usuarios'),
      pool.query('SELECT COUNT(*) as total, SUM(stock) as total_stock FROM productos'),
      pool.query('SELECT version() as version')
    ]);
    
    const uptime = process.uptime();
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    res.json({
      success: true,
      stats: {
        users: {
          total: parseInt(usersResult.rows[0].total) || 0
        },
        products: {
          total: parseInt(productsResult.rows[0].total) || 0,
          total_stock: parseInt(productsResult.rows[0].total_stock) || 0
        },
        database: {
          version: dbResult.rows[0].version,
          connection: 'active'
        },
        api: {
          uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
          start_time: START_TIME.toISOString(),
          environment: process.env.NODE_ENV || 'development',
          memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== MANEJADORES DE ERROR ====================

// Manejador de errores general
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    available_routes: [
      '/health',
      '/db-test',
      '/system-info',
      '/info',
      '/data',
      '/echo',
      '/users',
      '/users/:id',
      '/products',
      '/stats'
    ]
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`
  ============================================
  🚀 BACKEND API - PROYECTO GRUPAL 2 - DOCKER
  ============================================
  ✅ Servidor corriendo en: http://localhost:${PORT}
  ⏰ Iniciado: ${START_TIME.toLocaleString()}
  📁 Endpoints disponibles:
  
  1. 🩺  SALUD
     GET  /health       - Estado del sistema y conexión a BD
  
  2. 🗄️   BASE DE DATOS
     GET  /db-test      - Prueba de conexión a PostgreSQL
  
  3. 👥  USUARIOS (CRUD completo)
     GET    /users      - Obtener todos los usuarios
     GET    /users/:id  - Obtener usuario específico
     POST   /users      - Crear nuevo usuario
     PUT    /users/:id  - Actualizar usuario
     DELETE /users/:id  - Eliminar usuario
  
  4. 📦  PRODUCTOS
     GET  /products     - Obtener todos los productos
  
  5. 📊  ESTADÍSTICAS
     GET  /stats        - Estadísticas del sistema
  
  6. ℹ️   INFORMACIÓN
     GET  /system-info  - Información completa del API
     GET  /info         - Información básica
     GET  /data         - Datos de ejemplo
     POST /echo         - Echo endpoint
  
  ============================================
  🐋 Servicios Docker:
     - Backend:    http://localhost:3000
     - Frontend:   http://localhost:8080
     - PostgreSQL: localhost:5432
  ============================================
  `);
});

// Manejo de cierre elegante
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando conexiones...');
  pool.end(() => {
    console.log('Conexiones a PostgreSQL cerradas');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT, cerrando servidor...');
  pool.end(() => {
    console.log('Conexiones a PostgreSQL cerradas');
    process.exit(0);
  });
});