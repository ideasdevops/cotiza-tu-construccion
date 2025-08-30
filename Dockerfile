# Dockerfile Ultra-Simple para Cotizador de Construcción
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar código fuente
COPY . .

# Instalar dependencias de Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend-python/requirements.txt

# Exponer puerto
EXPOSE 8000

# Comando de inicio simple
CMD ["python", "-m", "uvicorn", "backend-python.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
