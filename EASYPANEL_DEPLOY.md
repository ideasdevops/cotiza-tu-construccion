# 🚀 Despliegue en Easypanel - Cotizador de Construcción

## 📋 Requisitos Previos

- **Easypanel** instalado y configurado en tu servidor
- **Docker** y **Docker Compose** funcionando
- **Git** configurado para clonar repositorios
- **Dominio** configurado (opcional, para HTTPS)

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
   - URL: `https://github.com/tu-usuario/cotizador-construccion.git`
   - Branch: `main` o `master`
   - Build Command: `git pull origin main`

2. **Configurar Webhook** (Opcional)
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

### **Paso 1: Preparar el Código**

```bash
# En tu servidor local
git add .
git commit -m "Prepare for Easypanel deployment"
git push origin main
```

### **Paso 2: Desplegar en Easypanel**

1. **Build del Proyecto**
   - Haz clic en **"Build"**
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
   - Email: `tu-email@dominio.com`

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

## ⚙️ **Configuración Avanzada**

### **Variables de Entorno**

Crea un archivo `.env` en Easypanel con:

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

### **Monitoreo y Logs**

1. **Configurar Logs Centralizados**
   - Activa **"Log Aggregation"** en Easypanel
   - Configura rotación de logs

2. **Monitoreo de Recursos**
   - Activa **"Resource Monitoring"**
   - Configura alertas para CPU, RAM y disco

## 🚨 **Solución de Problemas Comunes**

### **Error: Puerto ya en uso**
```bash
# Verificar puertos ocupados
netstat -tulpn | grep :8000
netstat -tulpn | grep :8005

# Detener servicios conflictivos
docker stop servicio-conflicto
```

### **Error: Permisos de archivos**
```bash
# Cambiar permisos
chmod -R 755 ./frontend
chmod -R 755 ./backend-python
chmod -R 755 ./backend-node
```

### **Error: Dependencias no encontradas**
```bash
# Verificar que todos los archivos estén presentes
ls -la
ls -la backend-python/
ls -la backend-node/
ls -la frontend/
```

### **Error: Health Check fallando**
```bash
# Verificar logs del servicio
docker logs nombre-servicio

# Verificar conectividad entre servicios
docker exec -it nombre-servicio ping otro-servicio
```

## 📊 **Métricas de Rendimiento**

### **Optimizaciones Recomendadas**

1. **Nginx**
   - Gzip compression activado
   - Cache de archivos estáticos
   - Rate limiting configurado

2. **Python Backend**
   - Workers múltiples (2-4 según CPU)
   - Timeouts optimizados
   - Connection pooling

3. **Node.js Backend**
   - PM2 para gestión de procesos
   - Cluster mode para múltiples workers
   - Memory limits configurados

## 🔄 **Actualizaciones y Mantenimiento**

### **Proceso de Actualización**

1. **Desarrollo Local**
   ```bash
   git pull origin main
   # Hacer cambios
   git add .
   git commit -m "Update: descripción de cambios"
   git push origin main
   ```

2. **Despliegue Automático**
   - Easypanel detectará el push
   - Se ejecutará el build automáticamente
   - Los servicios se reiniciarán con el nuevo código

### **Backup y Recuperación**

1. **Backup de Datos**
   ```bash
   # Backup de volúmenes
   docker run --rm -v cotizador_construccion_app-data:/data -v $(pwd):/backup alpine tar czf /backup/app-data-backup.tar.gz /data
   ```

2. **Recuperación**
   ```bash
   # Restaurar volúmenes
   docker run --rm -v cotizador_construccion_app-data:/data -v $(pwd):/backup alpine tar xzf /backup/app-data-backup.tar.gz -C /
   ```

## 📞 **Soporte y Contacto**

- **Documentación**: Revisa este archivo y `INSTALACION.md`
- **Logs**: Usa los logs de Easypanel para debugging
- **Comunidad**: Foros de Easypanel y Docker

---

**¡Tu Cotizador de Construcción está listo para producción! 🎉**
