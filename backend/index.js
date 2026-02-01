const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'database', // En Docker, el servicio se llama 'database'
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'proyecto_db',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint 1: Health check (ahora verifica la conexión a la BD)
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({
            service: 'backend-api',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        console.error('Error de base de datos:', error);
        res.status(500).json({
            service: 'backend-api',
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// Endpoint 2: Data endpoint
app.get('/data', (req, res) => {
    const sampleData = {
        message: "Datos desde el backend",
        items: [
            { id: 1, name: "Item A", value: 100 },
            { id: 2, name: "Item B", value: 200 },
            { id: 3, name: "Item C", value: 300 }
        ],
        total: 3,
        generatedAt: new Date().toISOString()
    };
    res.json(sampleData);
});

// Endpoint 3: Echo endpoint (POST)
app.post('/echo', (req, res) => {
    const receivedData = req.body;
    res.json({
        received: receivedData,
        echoedAt: new Date().toISOString()
    });
});

// Endpoint 4: Info
app.get('/info', (req, res) => {
    res.json({
        service: 'Backend API',
        version: '1.0.0',
        endpoints: ['/health', '/data', '/echo', '/info', '/db-test'],
        documentation: 'Ver README.md'
    });
});

// Endpoint 5: Prueba de base de datos
app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Conexión a la base de datos exitosa'
        });
    } catch (error) {
        console.error('Error de base de datos:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error al conectar con la base de datos'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Backend API corriendo en http://localhost:${PORT}`);
    console.log(`📁 Endpoints disponibles:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /data`);
    console.log(`   POST /echo`);
    console.log(`   GET  /info`);
    console.log(`   GET  /db-test`);
});