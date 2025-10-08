# Dockerfile con Supervisor para Cotizador de Construcción
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    nginx \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar código fuente
COPY . .

# Instalar dependencias de Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend-python/requirements.txt

# Configurar Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar frontend a ubicación de Nginx
COPY frontend/ /usr/share/nginx/html/

# Configurar Supervisor
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

# Crear directorios de logs
RUN mkdir -p /var/log/supervisor

# Exponer puertos
EXPOSE 80 8000

# Comando de inicio con Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
