const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// Configuración de la base de datos
// ====================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'proyecto_db',
  port: process.env.DB_PORT || 5432,
  max: 20, // Máximo número de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ====================
// Middleware
// ====================
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ====================
// Funciones auxiliares
// ====================

// Función para verificar conexión a BD con reintentos
async function checkDatabaseConnection(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log(`✅ Conectado a PostgreSQL (intento ${i + 1}/${retries})`);
      client.release();
      return true;
    } catch (error) {
      console.log(`⏳ Esperando PostgreSQL... (intento ${i + 1}/${retries})`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ No se pudo conectar a PostgreSQL después de varios intentos');
  return false;
}

// ====================
// Endpoints
// ====================

// 1. Health check - Mejorado
app.get('/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW() as db_time');
    const dbTime = dbCheck.rows[0].db_time;
    
    res.status(200).json({
      service: 'backend-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        server_time: dbTime,
        latency: `${Date.now() - new Date(dbTime).getTime()}ms`
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      service: 'backend-api',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
});

// 2. Obtener todos los usuarios
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, creado_en FROM usuarios ORDER BY creado_en DESC'
    );
    
    res.json({
      success: true,
      count: result.rowCount,
      users: result.rows
    });
  } catch (error) {
    console.error('Error en GET /users:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. Obtener un usuario por ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error en GET /users/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 4. Crear nuevo usuario (con validación)
app.post('/users', async (req, res) => {
  const { nombre, email } = req.body;
  
  // Validación básica
  if (!nombre || !email) {
    return res.status(400).json({
      success: false,
      error: 'Nombre y email son requeridos'
    });
  }
  
  // Validación de email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email no válido'
    });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING id, nombre, email, creado_en',
      [nombre, email]
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error en POST /users:', error);
    
    // Manejo de errores específicos
    if (error.code === '23505') { // Violación de unique constraint
      res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
});

// 5. Actualizar usuario
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email } = req.body;
  
  if (!nombre || !email) {
    return res.status(400).json({
      success: false,
      error: 'Nombre y email son requeridos'
    });
  }
  
  try {
    const result = await pool.query(
      `UPDATE usuarios 
       SET nombre = $1, email = $2 
       WHERE id = $3 
       RETURNING id, nombre, email, creado_en`,
      [nombre, email, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error en PUT /users/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 6. Eliminar usuario
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error en DELETE /users/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 7. Obtener todos los productos
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, precio, stock, creado_en FROM productos ORDER BY nombre'
    );
    
    res.json({
      success: true,
      count: result.rowCount,
      products: result.rows
    });
  } catch (error) {
    console.error('Error en GET /products:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 8. Endpoint de estadísticas
app.get('/stats', async (req, res) => {
  try {
    // Obtener múltiples estadísticas en paralelo
    const [usersStats, productsStats, dbStats] = await Promise.all([
      pool.query('SELECT COUNT(*) as total_users FROM usuarios'),
      pool.query('SELECT COUNT(*) as total_products, SUM(stock) as total_stock FROM productos'),
      pool.query('SELECT NOW() as server_time, version() as postgres_version')
    ]);
    
    res.json({
      success: true,
      stats: {
        users: {
          total: parseInt(usersStats.rows[0].total_users)
        },
        products: {
          total: parseInt(productsStats.rows[0].total_products),
          total_stock: parseInt(productsStats.rows[0].total_stock) || 0
        },
        database: {
          server_time: dbStats.rows[0].server_time,
          version: dbStats.rows[0].postgres_version.split(' ')[1]
        },
        api: {
          version: '2.0.0',
          uptime: process.uptime()
        }
      }
    });
  } catch (error) {
    console.error('Error en GET /stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 9. Endpoint de información del sistema
app.get('/system-info', (req, res) => {
  res.json({
    service: 'Backend API - Proyecto Docker',
    version: '2.0.0',
    description: 'API REST para el proyecto grupal de Docker',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Estado del servicio y base de datos' },
      { method: 'GET', path: '/users', description: 'Obtener todos los usuarios' },
      { method: 'GET', path: '/users/:id', description: 'Obtener usuario por ID' },
      { method: 'POST', path: '/users', description: 'Crear nuevo usuario' },
      { method: 'PUT', path: '/users/:id', description: 'Actualizar usuario' },
      { method: 'DELETE', path: '/users/:id', description: 'Eliminar usuario' },
      { method: 'GET', path: '/products', description: 'Obtener todos los productos' },
      { method: 'GET', path: '/stats', description: 'Estadísticas del sistema' },
      { method: 'GET', path: '/system-info', description: 'Información del API' }
    ],
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'Ver README.md en el repositorio'
  });
});

// ====================
// Manejo de errores global
// ====================
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    available_routes: [
      '/health',
      '/users',
      '/products',
      '/stats',
      '/system-info'
    ]
  });
});

// ====================
// Inicialización del servidor
// ====================
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Iniciando sin conexión a base de datos');
    }
    
    app.listen(PORT, () => {
      console.log(`
🚀 Backend API v2.0 iniciado correctamente
📍 URL: http://localhost:${PORT}
📅 Hora: ${new Date().toISOString()}
✅ Base de datos: ${dbConnected ? 'CONECTADA' : 'DESCONECTADA'}

📁 Endpoints disponibles:
   GET  /health            - Estado del servicio
   GET  /users             - Listar usuarios
   GET  /users/:id         - Obtener usuario por ID
   POST /users             - Crear usuario
   PUT  /users/:id         - Actualizar usuario
   DELETE /users/:id       - Eliminar usuario
   GET  /products          - Listar productos
   GET  /stats             - Estadísticas del sistema
   GET  /system-info       - Información del API
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
