#!/bin/bash

echo "🚀 Cargando archivos a volúmenes persistentes..."

# Crear directorio temporal para los volúmenes
mkdir -p /tmp/cotizador-volumes/data

# Copiar todo el contenido de la aplicación
echo "📦 Copiando backend Python..."
cp -r /home/administrator/cotizador_construccion/backend-python/* /tmp/cotizador-volumes/data/

echo "📦 Copiando backend Node.js..."
cp -r /home/administrator/cotizador_construccion/backend-node/* /tmp/cotizador-volumes/data/

echo "📦 Copiando frontend..."
cp -r /home/administrator/cotizador_construccion/frontend/* /tmp/cotizador-volumes/data/

echo "📦 Copiando archivos de configuración..."
cp /home/administrator/cotizador_construccion/docker-compose.yml /tmp/cotizador-volumes/data/
cp /home/administrator/cotizador_construccion/Dockerfile /tmp/cotizador-volumes/data/
cp /home/administrator/cotizador_construccion/nginx.conf /tmp/cotizador-volumes/data/

echo "✅ Archivos copiados a /tmp/cotizador-volumes/data/"
echo "📋 Ahora necesitas:"
echo "1. Usar el archivo easypanel-cotizador-complete-persistent.json en EasyPanel"
echo "2. Los archivos se cargarán automáticamente desde /code/data al iniciar el contenedor"
echo "3. Los volúmenes harán que los archivos sean persistentes"
