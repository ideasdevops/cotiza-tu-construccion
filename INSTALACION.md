# Instrucciones de Instalación - Cotizador de Construcción

## Requisitos Previos

- **Python 3.11+** con pip
- **Node.js 20+** con npm
- **Git** para clonar el repositorio
- **Docker** (opcional, para deploy)

## Instalación Local

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd cotizador_construccion
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus configuraciones
nano .env
```

### 3. Instalar Dependencias de Python

```bash
cd backend-python

# Crear entorno virtual
python3 -m venv .venv

# Activar entorno virtual
# En Linux/Mac:
source .venv/bin/activate
# En Windows:
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Desactivar entorno virtual
deactivate
```

### 4. Instalar Dependencias de Node.js

```bash
cd ../backend-node

# Instalar dependencias
npm install

# Volver al directorio raíz
cd ..
```

## Ejecución Local

### 1. Iniciar Backend Python

```bash
cd backend-python

# Activar entorno virtual
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# El servidor estará disponible en: http://localhost:8000
# Documentación de la API: http://localhost:8000/docs
```

### 2. Iniciar Backend Node.js

```bash
cd backend-node

# Iniciar servidor en modo desarrollo
npm run dev

# El servidor estará disponible en: http://localhost:3000
```

### 3. Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **API Python**: http://localhost:8000
- **API Node.js**: http://localhost:3000/api

## Ejecución con Docker

### 1. Construir y Ejecutar

```bash
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up

# Ejecutar en segundo plano
docker-compose up -d
```

### 2. Verificar Servicios

```bash
# Ver logs
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs python
docker-compose logs node

# Verificar estado
docker-compose ps
```

### 3. Detener Servicios

```bash
# Detener servicios
docker-compose down

# Detener y remover volúmenes
docker-compose down -v
```

## Estructura del Proyecto

```
cotizador_construccion/
├── backend-python/          # API Python (FastAPI)
│   ├── app/
│   │   ├── main.py         # Punto de entrada
│   │   ├── models.py       # Modelos de datos
│   │   ├── calculator.py   # Lógica de cálculo
│   │   └── price_service.py # Servicio de precios
│   └── requirements.txt     # Dependencias Python
├── backend-node/            # API Node.js (Express)
│   ├── src/
│   │   └── index.ts        # Punto de entrada
│   ├── package.json        # Dependencias Node.js
│   └── tsconfig.json       # Configuración TypeScript
├── frontend/                # Frontend (HTML/CSS/JS)
│   ├── index.html          # Página principal
│   ├── css/                # Estilos
│   ├── js/                 # JavaScript
│   └── assets/             # Recursos estáticos
├── docker/                  # Archivos de Docker
├── docker-compose.yml       # Orquestación de servicios
├── Dockerfile              # Imagen Docker
├── README.md               # Documentación principal
├── INSTALACION.md          # Este archivo
└── env.example             # Variables de entorno de ejemplo
```

## Configuración de Desarrollo

### 1. Modo de Desarrollo

```bash
# Backend Python (con recarga automática)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Backend Node.js (con recarga automática)
npm run dev

# Construir TypeScript
npm run build
```

### 2. Logs y Debugging

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f python
docker-compose logs -f node
```

### 3. Base de Datos (Futuro)

```bash
# El proyecto está preparado para futuras implementaciones de base de datos
# Por ahora usa SQLite en memoria para desarrollo
```

## APIs Disponibles

### Backend Python (Puerto 8000)

- `GET /` - Información de la API
- `GET /health` - Estado de salud
- `POST /cotizar` - Crear cotización
- `GET /costos/desglose` - Desglose de costos
- `GET /materiales/precios` - Precios de materiales
- `GET /regiones/multiplicadores` - Multiplicadores regionales
- `GET /tipos-construccion` - Tipos de construcción
- `GET /niveles-terminacion` - Niveles de terminación
- `GET /tipos-uso` - Tipos de uso

### Backend Node.js (Puerto 3000)

- `GET /` - Frontend de la aplicación
- `GET /health` - Estado de salud
- `GET /api/*` - Proxy a APIs de Python
- `GET /api/construccion/tipos` - Tipos de construcción
- `GET /api/materiales/precios` - Precios de materiales
- `POST /api/cotizaciones` - Crear cotización

## Solución de Problemas

### 1. Puerto en Uso

```bash
# Verificar puertos en uso
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000

# Matar proceso en puerto específico
sudo kill -9 <PID>
```

### 2. Dependencias Python

```bash
# Actualizar pip
pip install --upgrade pip

# Limpiar cache
pip cache purge

# Reinstalar dependencias
pip install -r requirements.txt --force-reinstall
```

### 3. Dependencias Node.js

```bash
# Limpiar cache
npm cache clean --force

# Eliminar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

### 4. Problemas de Docker

```bash
# Limpiar Docker
docker system prune -a

# Reconstruir imágenes
docker-compose build --no-cache

# Verificar logs
docker-compose logs
```

## Despliegue en Producción

### 1. Variables de Entorno

```bash
# Cambiar NODE_ENV a production
NODE_ENV=production

# Configurar URLs de producción
PY_SERVICE_URL=https://api.tudominio.com
```

### 2. Seguridad

```bash
# Cambiar JWT_SECRET
JWT_SECRET=tu-super-secreto-seguro

# Configurar CORS
ALLOWED_ORIGINS=https://tudominio.com
```

### 3. Monitoreo

```bash
# Habilitar logging
LOG_LEVEL=info
LOG_FILE=/var/log/cotizador/app.log

# Configurar métricas
ENABLE_METRICS=true
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico o preguntas:

- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación de la API en `/docs`

---

**Nota**: Esta aplicación está diseñada para funcionar en Argentina y utiliza APIs locales para precios de materiales de construcción. Asegúrate de tener acceso a las APIs mencionadas o configura precios base en el código.
