# Dockerfile para Cotizador de Construcción
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache python3 py3-pip

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY backend-node/package*.json ./backend-node/
COPY backend-python/requirements.txt ./backend-python/

# Instalar dependencias de Node.js
WORKDIR /app/backend-node
RUN npm ci --only=production

# Instalar dependencias de Python
WORKDIR /app/backend-python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar código fuente
WORKDIR /app
COPY . .

# Exponer puerto
EXPOSE 8005

# Comando por defecto
CMD ["npm", "run", "start", "--prefix", "backend-node"]
