import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PY_SERVICE_URL = process.env.PY_SERVICE_URL || 'http://localhost:8000';

// Configuración de seguridad
app.use(helmet());

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas requests desde esta IP, intenta nuevamente en 15 minutos'
});
app.use('/api/', limiter);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cotizador_construccion_node',
    timestamp: new Date().toISOString(),
    python_service: PY_SERVICE_URL
  });
});

// Proxy para la API de Python
app.use('/api/python/*', async (req, res) => {
  try {
    const pythonPath = req.path.replace('/api/python', '');
    const response = await axios({
      method: req.method as any,
      url: `${PY_SERVICE_URL}${pythonPath}`,
      data: req.body,
      params: req.query,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error proxy to Python service:', error.message);
    res.status(500).json({
      error: 'Error comunicándose con el servicio de Python',
      details: error.message
    });
  }
});

// Endpoint para obtener tipos de construcción
app.get('/api/construccion/tipos', async (req, res) => {
  try {
    const response = await axios.get(`${PY_SERVICE_URL}/tipos-construccion`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error obteniendo tipos de construcción:', error.message);
    res.status(500).json({
      error: 'Error obteniendo tipos de construcción',
      details: error.message
    });
  }
});

// Endpoint para obtener niveles de terminación
app.get('/api/construccion/terminaciones', async (req, res) => {
  try {
    const response = await axios.get(`${PY_SERVICE_URL}/niveles-terminacion`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error obteniendo niveles de terminación:', error.message);
    res.status(500).json({
      error: 'Error obteniendo niveles de terminación',
      details: error.message
    });
  }
});

// Endpoint para obtener tipos de uso
app.get('/api/construccion/usos', async (req, res) => {
  try {
    const response = await axios.get(`${PY_SERVICE_URL}/tipos-uso`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error obteniendo tipos de uso:', error.message);
    res.status(500).json({
      error: 'Error obteniendo tipos de uso',
      details: error.message
    });
  }
});

// Endpoint para obtener precios de materiales
app.get('/api/materiales/precios', async (req, res) => {
  try {
    const response = await axios.get(`${PY_SERVICE_URL}/materiales/precios`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error obteniendo precios de materiales:', error.message);
    res.status(500).json({
      error: 'Error obteniendo precios de materiales',
      details: error.message
    });
  }
});

// Endpoint para obtener multiplicadores regionales
app.get('/api/regiones/multiplicadores', async (req, res) => {
  try {
    const response = await axios.get(`${PY_SERVICE_URL}/regiones/multiplicadores`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error obteniendo multiplicadores regionales:', error.message);
    res.status(500).json({
      error: 'Error obteniendo multiplicadores regionales',
      details: error.message
    });
  }
});

// Endpoint para calcular desglose de costos
app.get('/api/costos/desglose', async (req, res) => {
  try {
    const { metros_cuadrados, tipo_construccion, tipo_uso, nivel_terminacion, provincia } = req.query;
    
    if (!metros_cuadrados || !tipo_construccion || !tipo_uso || !nivel_terminacion) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos',
        required: ['metros_cuadrados', 'tipo_construccion', 'tipo_uso', 'nivel_terminacion']
      });
    }
    
    const response = await axios.get(`${PY_SERVICE_URL}/costos/desglose`, {
      params: {
        metros_cuadrados,
        tipo_construccion,
        tipo_uso,
        nivel_terminacion,
        provincia: provincia || 'buenos_aires'
      }
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error calculando desglose de costos:', error.message);
    res.status(500).json({
      error: 'Error calculando desglose de costos',
      details: error.message
    });
  }
});

// Endpoint para crear cotización
app.post('/api/cotizaciones', async (req, res) => {
  try {
    const response = await axios.post(`${PY_SERVICE_URL}/cotizar`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error creando cotización:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Error creando cotización',
        details: error.message
      });
    }
  }
});

// Endpoint para obtener cotización por ID
app.get('/api/cotizaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // En una implementación real, esto vendría de una base de datos
    res.json({
      message: 'Cotización obtenida',
      id,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error obteniendo cotización:', error.message);
    res.status(500).json({
      error: 'Error obteniendo cotización',
      details: error.message
    });
  }
});

// Ruta para el frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Middleware de manejo de errores
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Node.js iniciado en puerto ${PORT}`);
  console.log(`📊 Servicio Python en: ${PY_SERVICE_URL}`);
  console.log(`🌐 Frontend disponible en: http://localhost:${PORT}`);
  console.log(`📚 API docs en: http://localhost:${PORT}/api/`);
});

export default app;
