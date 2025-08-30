# 🚀 Configuración Easypanel - Cotizador de Construcción

## 📋 Información del Repositorio

- **URL del Repositorio**: `https://github.com/franspont/cotizador_construccion.git`
- **Rama**: `main`
- **Token de Acceso**: `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`
- **Usuario**: `franspont`

## 🔧 Configuración en Easypanel

### 1️⃣ **Crear Nuevo Proyecto**

1. **Acceder a Easypanel**
   - Abre tu navegador y ve a `http://tu-servidor:3000`
   - Inicia sesión con tus credenciales

2. **Crear Proyecto**
   - Haz clic en **"New Project"**
   - Nombre: `cotizador-construccion`
   - Descripción: `Cotizador online de construcción Steel Frame & Industrial`
   - Framework: `Docker Compose`

### 2️⃣ **Configurar Repositorio Git**

1. **Conectar Repositorio**
   - En la pestaña **"Source"**
   - Selecciona **"Git Repository"**
   - URL: `https://github.com/franspont/cotizador_construccion.git`
   - Branch: `main`
   - Build Command: `git pull origin main`

2. **Configurar Credenciales**
   - Usuario: `franspont`
   - Contraseña/Token: `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`

3. **Configurar Webhook** (Opcional)
   - Activa **"Auto Deploy"**
   - Configura el webhook en GitHub para despliegue automático

### 3️⃣ **Configurar Servicios**

#### 🐍 **Servicio Python (Backend)**

```yaml
Service Name: python-backend
Image: python:3.11-slim
Port: 8000
Environment Variables:
  - PYTHONPATH=/app/backend-python
  - PYTHONUNBUFFERED=1
  - NODE_ENV=production
Working Directory: /app/backend-python
Command: >
  bash -lc "
  pip install --no-cache-dir -r requirements.txt &&
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
  "
```

#### 🟢 **Servicio Node.js (Backend)**

```yaml
Service Name: node-backend
Image: node:20-alpine
Port: 8005
Environment Variables:
  - PY_SERVICE_URL=http://python-backend:8000
  - PORT=8005
  - NODE_ENV=production
Working Directory: /app/backend-node
Command: >
  bash -lc "
  npm ci --only=production &&
  npm run build &&
  npm start
  "
Dependencies: python-backend
```

#### 🌐 **Servicio Nginx (Frontend + Proxy)**

```yaml
Service Name: nginx
Image: nginx:alpine
Port: 80 (HTTP), 443 (HTTPS)
Volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
  - ./frontend:/usr/share/nginx/html:ro
Dependencies: node-backend
```

### 4️⃣ **Configurar Volúmenes**

1. **Volumen de Datos**
   - Nombre: `app-data`
   - Driver: `local`
   - Path: `/var/lib/docker/volumes/cotizador_construccion_app-data`

2. **Volúmenes de Código**
   - `./backend-python:/app/backend-python`
   - `./backend-node:/app/backend-node`
   - `./frontend:/usr/share/nginx/html`

### 5️⃣ **Configurar Redes**

1. **Red Principal**
   - Nombre: `default`
   - Driver: `bridge`
   - Subnet: `172.20.0.0/16`

## 🚀 **Proceso de Despliegue**

### **Paso 1: Verificar Código en GitHub**

✅ **Repositorio creado**: `https://github.com/franspont/cotizador_construccion`  
✅ **Código subido**: 38 objetos, 54.03 KiB  
✅ **Rama configurada**: `main`  

### **Paso 2: Desplegar en Easypanel**

1. **Build del Proyecto**
   - Haz clic en **"Build"**
   - Easypanel clonará el repositorio automáticamente
   - Espera a que se complete la construcción
   - Verifica que no hay errores en los logs

2. **Iniciar Servicios**
   - Haz clic en **"Start"** para cada servicio
   - Orden recomendado: `python-backend` → `node-backend` → `nginx`

3. **Verificar Estado**
   - Todos los servicios deben mostrar estado **"Running"**
   - Verifica los health checks en cada servicio

### **Paso 3: Configurar Dominio (Opcional)**

1. **Configurar DNS**
   - Añade un registro A apuntando a tu servidor
   - Ejemplo: `cotizador.tudominio.com` → `IP_DEL_SERVIDOR`

2. **Configurar SSL en Easypanel**
   - Ve a **"Settings"** → **"SSL"**
   - Selecciona **"Let's Encrypt"**
   - Dominio: `cotizador.tudominio.com`
   - Email: `franspont@gmail.com`

## 🔍 **Verificación del Despliegue**

### **Endpoints de Verificación**

```bash
# Health Check Nginx
curl http://tu-servidor/health

# Health Check Node.js
curl http://tu-servidor:8005/health

# Health Check Python
curl http://tu-servidor:8000/health

# Frontend
curl http://tu-servidor/
```

### **Logs de Verificación**

```bash
# Ver logs de Nginx
docker logs cotizador-construccion-nginx-1

# Ver logs de Node.js
docker logs cotizador-construccion-node-backend-1

# Ver logs de Python
docker logs cotizador-construccion-python-backend-1
```

## ⚙️ **Variables de Entorno para Easypanel**

Crea estas variables en la configuración de Easypanel:

```env
# Configuración de Producción
NODE_ENV=production
PYTHONUNBUFFERED=1

# URLs de APIs (configurar según tu entorno)
INDEC_API_URL=https://www.indec.gob.ar/api/v1
CAMARA_CONSTRUCCION_API_URL=https://api.camaraconstruccion.com.ar
PRECIOS_AR_API_URL=https://api.preciosar.com.ar

# Configuración de Seguridad
JWT_SECRET=tu-super-secret-jwt-key-cambiar-en-produccion
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 **Archivos de Configuración Disponibles**

- **`easypanel.yml`**: Configuración automática de servicios
- **`nginx.conf`**: Proxy reverso y servido de frontend
- **`docker-compose.prod.yml`**: Configuración de producción
- **`EASYPANEL_DEPLOY.md`**: Guía completa paso a paso

## 🎯 **Estado Actual del Proyecto**

✅ **Repositorio GitHub**: Creado y configurado  
✅ **Código fuente**: Subido completamente  
✅ **Configuración Docker**: Lista para producción  
✅ **Configuración Easypanel**: Archivos preparados  
✅ **Documentación**: Completa y detallada  

## 🚀 **Próximo Paso**

**¡Tu código está en GitHub y listo para ser desplegado en Easypanel!**

1. **Accede a Easypanel** en tu servidor
2. **Crea el proyecto** siguiendo esta guía
3. **Conecta el repositorio** con las credenciales proporcionadas
4. **Despliega los servicios** en el orden indicado

---

**¡Tu Cotizador de Construcción está listo para producción! 🎉**
