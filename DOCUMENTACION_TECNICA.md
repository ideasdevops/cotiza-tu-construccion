# 📚 Documentación Técnica - Cotizador de Construcción

## 🔧 Arquitectura del Sistema

### **Diagrama de Arquitectura**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Servicios     │
│   (HTML/CSS/JS) │◄──►│   Python        │◄──►│   Externos      │
│                 │    │   (FastAPI)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Servidor      │    │   Base de       │    │   Email         │
│   Node.js       │    │   Datos         │    │   SMTP          │
│   (HTTP)        │    │   Nocodb        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Componentes Principales**

#### **1. Frontend (Cliente)**
- **Tecnología**: HTML5, CSS3, JavaScript ES6+
- **Arquitectura**: Single Page Application (SPA)
- **Estado**: Gestión local con clases ES6
- **Responsive**: Mobile-first design

#### **2. Backend Python (API)**
- **Framework**: FastAPI
- **Python**: 3.8+
- **Arquitectura**: REST API con validación Pydantic
- **Async**: Soporte completo para operaciones asíncronas

#### **3. Servidor Node.js**
- **Propósito**: Servir archivos estáticos y proxy
- **Puerto**: 8000
- **Middleware**: CORS, compresión, logging

## 🗄️ Estructura de Datos

### **Modelos de Datos (Pydantic)**

#### **Cotización**
```python
class CotizacionRequest(BaseModel):
    nombre: str
    email: str
    telefono: Optional[str]
    tipo_construccion: str
    tipo_uso: str
    metros_cuadrados: float
    provincia: str
    ciudad: str
    zona: Optional[str]
    materiales: List[MaterialSeleccionado]
    nivel_terminacion: str
    fecha: datetime = Field(default_factory=datetime.now)
```

#### **Material**
```python
class Material(BaseModel):
    id: int
    nombre: str
    precio_por_m2: float
    unidad: str
    categoria: str
    descripcion: str
    stock_disponible: Optional[int]
```

#### **Cliente**
```python
class Cliente(BaseModel):
    id: Optional[str]
    nombre: str
    email: str
    telefono: Optional[str]
    provincia: str
    ciudad: str
    fecha_registro: datetime
    estado: str = "activo"
```

### **Base de Datos Nocodb**

#### **Tabla: Clientes**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Text | ID único del cliente |
| `nombre` | Text | Nombre completo |
| `email` | Email | Correo electrónico |
| `telefono` | PhoneNumber | Número de teléfono |
| `provincia` | SingleSelect | Provincia de ubicación |
| `ciudad` | Text | Ciudad específica |
| `fecha_registro` | DateTime | Fecha de registro |
| `estado` | SingleSelect | Estado del cliente |

#### **Tabla: Cotizaciones**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Text | ID único de cotización |
| `cliente_id` | LinkToAnotherRecord | Referencia al cliente |
| `tipo_construccion` | SingleSelect | Tipo de construcción |
| `metros_cuadrados` | Number | Metros cuadrados |
| `total_cotizacion` | Currency | Total en USD |
| `fecha_cotizacion` | DateTime | Fecha de cotización |
| `estado` | SingleSelect | Estado de la cotización |

## 🔌 APIs y Endpoints

### **Configuración CORS**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Endpoints Principales**

#### **1. Cotización**
```python
@app.post("/cotizar")
async def calcular_cotizacion(
    request: CotizacionRequest,
    background_tasks: BackgroundTasks
):
    """
    Calcula cotización de construcción
    - Valida datos de entrada
    - Calcula costos por tipo de construcción
    - Aplica multiplicadores regionales
    - Guarda datos del cliente en background
    """
```

#### **2. Materiales**
```python
@app.get("/materiales/precios")
async def obtener_precios_materiales():
    """
    Retorna lista de materiales con precios
    - Precios en USD
    - Categorías organizadas
    - Stock disponible
    """
```

#### **3. PDF**
```python
@app.get("/cotizar/descargar-pdf")
async def descargar_pdf_cotizacion(
    cotizacion_id: str
):
    """
    Genera y descarga PDF de cotización
    - Formato profesional
    - Incluye logo Sumpetrol
    - Detalles técnicos completos
    """
```

## 🎨 Sistema de Estilos

### **Variables CSS Globales**
```css
:root {
  /* Colores principales */
  --primary-color: #990042;      /* Marrón Sumpetrol */
  --primary-dark: #720220;       /* Marrón oscuro */
  --primary-light: #b30052;      /* Marrón claro */
  
  /* Colores secundarios */
  --secondary-color: #4a5568;    /* Gris secundario */
  --accent-color: #38a169;       /* Verde acento */
  
  /* Estados */
  --success: #38a169;            /* Verde éxito */
  --error: #e53e3e;              /* Rojo error */
  --warning: #d69e2e;            /* Amarillo advertencia */
  --info: #3182ce;               /* Azul información */
  
  /* Escala de grises */
  --gray-50: #f7fafc;
  --gray-100: #edf2f7;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e0;
  --gray-400: #a0aec0;
  --gray-500: #718096;
  --gray-600: #4a5568;
  --gray-700: #2d3748;
  --gray-800: #1a202c;
  --gray-900: #171923;
  
  /* Espaciado */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
  --spacing-3xl: 4rem;      /* 64px */
  
  /* Bordes */
  --border-radius-sm: 0.25rem;   /* 4px */
  --border-radius-md: 0.5rem;    /* 8px */
  --border-radius-lg: 0.75rem;   /* 12px */
  --border-radius-xl: 1rem;      /* 16px */
  
  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### **Sistema de Grid Responsive**
```css
/* Grid principal */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

/* Grid de formularios */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

/* Grid de tipos de construcción */
.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

/* Grid de materiales */
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}
```

### **Breakpoints Responsive**
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## 🧮 Lógica de Cálculos

### **Fórmulas de Cotización**

#### **1. Costo Base por Tipo de Construcción**
```python
COSTOS_BASE = {
    "steel_frame": 2200,      # U$D/m²
    "industrial": 1800,        # U$D/m²
    "contenedor": 1800,        # U$D/m²
    "mixto": 2300             # U$D/m²
}
```

#### **2. Multiplicadores por Tipo de Uso**
```python
MULTIPLICADORES_USO = {
    "residencial": 1.0,       # Base
    "comercial": 1.3,         # +30%
    "industrial": 1.4          # +40%
}
```

#### **3. Multiplicadores por Nivel de Terminación**
```python
MULTIPLICADORES_TERMINACION = {
    "basico": 1.0,            # Base
    "estandar": 1.2,          # +20%
    "premium": 1.5             # +50%
}
```

#### **4. Multiplicadores Regionales**
```python
MULTIPLICADORES_REGIONALES = {
    "mendoza": 1.0,           # Base
    "buenos_aires": 1.2,      # +20%
    "otras": 1.1               # +10%
}
```

#### **5. Fórmula Principal**
```python
def calcular_cotizacion(metros_cuadrados, tipo_construccion, tipo_uso, nivel_terminacion, provincia):
    costo_base = COSTOS_BASE[tipo_construccion]
    multiplicador_uso = MULTIPLICADORES_USO[tipo_uso]
    multiplicador_terminacion = MULTIPLICADORES_TERMINACION[nivel_terminacion]
    multiplicador_regional = MULTIPLICADORES_REGIONALES.get(provincia, 1.0)
    
    costo_por_m2 = costo_base * multiplicador_uso * multiplicador_terminacion * multiplicador_regional
    total_base = metros_cuadrados * costo_por_m2
    
    # Aplicar impuestos (21% IVA)
    impuestos = total_base * 0.21
    
    return {
        "costo_base": total_base,
        "impuestos": impuestos,
        "total": total_base + impuestos,
        "costo_por_m2": costo_por_m2
    }
```

## 📧 Servicio de Email

### **Configuración SMTP**
```python
SMTP_CONFIG = {
    "server": "c2630942.ferozo.com",
    "port": 465,
    "username": "novedades@sumpetrol.com.ar",
    "password": "Novedad3s2k24@@",
    "use_tls": True,
    "use_ssl": True
}
```

### **Plantillas de Email**

#### **Cotización**
```html
<h2>Cotización de Construcción - Sumpetrol</h2>
<p><strong>Cliente:</strong> {nombre}</p>
<p><strong>Tipo de Construcción:</strong> {tipo}</p>
<p><strong>Metros Cuadrados:</strong> {m2} m²</p>
<p><strong>Total Estimado:</strong> U$D {total:,.2f}</p>
```

#### **Contacto**
```html
<h2>Nueva Consulta - Sumpetrol</h2>
<p><strong>Nombre:</strong> {nombre}</p>
<p><strong>Email:</strong> {email}</p>
<p><strong>Mensaje:</strong> {mensaje}</p>
```

## 📄 Generación de PDF

### **Configuración ReportLab**
```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table

# Configuración de página
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 0.5 * inch
```

### **Estructura del PDF**
1. **Header**: Logo Sumpetrol + Título
2. **Información del Cliente**: Datos de contacto
3. **Detalles del Proyecto**: Tipo, metros, ubicación
4. **Desglose de Costos**: Materiales, mano de obra, etc.
5. **Total**: Suma final con impuestos
6. **Footer**: Información de contacto Sumpetrol

## 🔒 Seguridad y Validación

### **Validación de Entrada**
```python
from pydantic import BaseModel, validator, Field

class CotizacionRequest(BaseModel):
    metros_cuadrados: float = Field(..., gt=0, le=10000)
    email: str = Field(..., regex=r"^[^@]+@[^@]+\.[^@]+$")
    
    @validator('metros_cuadrados')
    def validate_metros_cuadrados(cls, v):
        if v <= 0:
            raise ValueError('Los metros cuadrados deben ser mayores a 0')
        if v > 10000:
            raise ValueError('Los metros cuadrados no pueden exceder 10,000')
        return v
```

### **Sanitización de Datos**
```python
import html

def sanitize_input(text: str) -> str:
    """Sanitiza entrada de usuario para prevenir XSS"""
    return html.escape(text.strip())

def validate_file_upload(file):
    """Valida archivos subidos"""
    allowed_types = ['image/jpeg', 'image/png', 'application/pdf']
    max_size = 5 * 1024 * 1024  # 5MB
    
    if file.content_type not in allowed_types:
        raise ValueError('Tipo de archivo no permitido')
    
    if file.size > max_size:
        raise ValueError('Archivo demasiado grande')
```

## 📊 Logging y Monitoreo

### **Configuración de Logs**
```python
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('cotizador.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Log de cotizaciones
def log_cotizacion(cliente, tipo, metros, total):
    logger.info(f"Cotización generada: {cliente} - {tipo} - {metros}m² - U$D{total}")
```

### **Métricas de Rendimiento**
```python
import time
from functools import wraps

def measure_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        
        execution_time = end_time - start_time
        logger.info(f"{func.__name__} ejecutado en {execution_time:.2f}s")
        
        return result
    return wrapper
```

## 🧪 Testing

### **Tests Unitarios**
```python
import pytest
from app.calculator import calcular_cotizacion

def test_calculo_steel_frame():
    resultado = calcular_cotizacion(
        metros_cuadrados=100,
        tipo_construccion="steel_frame",
        tipo_uso="residencial",
        nivel_terminacion="estandar",
        provincia="mendoza"
    )
    
    assert resultado["costo_por_m2"] == 2200 * 1.0 * 1.2 * 1.0
    assert resultado["total"] > 0
```

### **Tests de Integración**
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoint_cotizar():
    response = client.post("/cotizar", json={
        "nombre": "Test User",
        "email": "test@example.com",
        "metros_cuadrados": 100,
        "tipo_construccion": "steel_frame"
    })
    
    assert response.status_code == 200
    assert "total" in response.json()
```

## 🚀 Optimización y Performance

### **Caching**
```python
from functools import lru_cache
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

@lru_cache(maxsize=128)
def get_materiales_cache():
    """Cache de materiales en memoria"""
    return load_materiales_from_database()

def get_materiales_redis():
    """Cache de materiales en Redis"""
    cache_key = "materiales:precios"
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    materiales = load_materiales_from_database()
    redis_client.setex(cache_key, 3600, json.dumps(materiales))  # 1 hora
    return materiales
```

### **Compresión de Respuestas**
```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### **Lazy Loading**
```python
class MaterialsManager:
    def __init__(self):
        self._materials = None
    
    @property
    def materials(self):
        if self._materials is None:
            self._materials = self.load_materials()
        return self._materials
```

## 🔄 CI/CD y Despliegue

### **Dockerfile**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Docker Compose**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=false
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### **GitHub Actions**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Easypanel
        run: |
          # Script de despliegue
```

## 📈 Monitoreo y Alertas

### **Health Checks**
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": check_database_connection(),
            "email": check_smtp_connection(),
            "nocodb": check_nocodb_connection()
        }
    }
```

### **Métricas Prometheus**
```python
from prometheus_client import Counter, Histogram, generate_latest

# Contadores
cotizaciones_generadas = Counter('cotizaciones_generadas_total', 'Total de cotizaciones generadas')
errores_api = Counter('errores_api_total', 'Total de errores de API')

# Histogramas
tiempo_respuesta = Histogram('tiempo_respuesta_segundos', 'Tiempo de respuesta de la API')

@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    tiempo_respuesta.observe(duration)
    return response
```

---

**Documentación Técnica v1.0.0 - Sumpetrol**
