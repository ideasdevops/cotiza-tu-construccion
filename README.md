# Cotizador de Construcción - Steel Frame & Industrial

Cotizador online profesional para construcción de módulos de viviendas y estructuras industriales:

- **Steel Frame**: Construcción en seco con perfiles de acero
- **Estructuras Industriales**: Con hierros estructurales y metales
- **Módulos Contenedores**: Conversión de contenedores marítimos
- **Materiales en Seco**: Sistemas constructivos modernos

## Arquitectura

Arquitectura tipo microservicio:

- **Backend Python (FastAPI)**: Cálculos de costos, integración con APIs de precios
- **Backend Node (Express + SQLite)**: Orquestación, persistencia y servir frontend
- **Frontend (HTML/CSS/JS)**: UI moderna y profesional con experiencia de usuario optimizada

## APIs de Precios (Argentina)

- Precios por metro cuadrado de construcción
- Costos de materiales de acero y hierro
- Precios de terminaciones y acabados
- Datos actualizados del mercado argentino

## Desarrollo Local

### 1) Backend Python
```bash
cd backend-python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Backend Node
```bash
cd backend-node
npm install
npm run dev
```

### Variables de Entorno
Crear archivo `.env` en la raíz:
```env
PORT=3000
PY_SERVICE_URL=http://localhost:8000
```

Abrir `http://localhost:3000`

## Docker

```bash
docker-compose up
```

## Características del Frontend

- **Selector de Tipo de Construcción**: Steel frame, industrial, contenedores
- **Calculadora de Metros Cuadrados**: Con validaciones y preview 3D
- **Selector de Materiales**: Acero, hierro, terminaciones
- **Tipo de Uso**: Industrial o residencial
- **Nivel de Terminaciones**: Básico, estándar, premium
- **Generación de Cotizaciones**: PDF profesional con detalles técnicos
