# 🏗️ Cotizador de Construcción - Sumpetrol

## 📋 Descripción General

Aplicación web moderna para cotización de proyectos de construcción, desarrollada para **Sumpetrol**. Permite calcular costos de construcción en tiempo real con precios actualizados en Dólares Americanos (USD).

## ✨ Características Principales

### 🎯 **Funcionalidades Core**
- **Cotización Automática**: Cálculo instantáneo de costos de construcción
- **Gestión de Materiales**: Selección y gestión de materiales con precios actualizados
- **Múltiples Tipos de Construcción**: Steel Frame, Industrial, Contenedores Marítimos, Sistema Mixto
- **Formulario de Contacto**: Integración directa con marketing@sumpetrol.com.ar
- **Generación de PDF**: Descarga de cotizaciones en formato PDF
- **Responsive Design**: Optimizado para dispositivos móviles y desktop

### 🏢 **Tipos de Construcción Soportados**
| Tipo | Descripción | Precio Base |
|------|-------------|-------------|
| **Steel Frame** | Construcción en seco con perfiles de acero | U$D 2,200/m² |
| **Industrial** | Estructuras con hierros estructurales | U$D 1,800/m² |
| **Contenedor Marítimo** | Módulos con contenedores marítimos | U$D 1,800/m² |
| **Sistema Mixto** | Combinación de diferentes sistemas | U$D 2,300/m² |

### 💰 **Moneda y Precios**
- **Moneda Principal**: Dólares Americanos (USD)
- **Formato**: U$D X,XXX.XX
- **Actualización**: Precios en tiempo real del mercado
- **Cálculo**: Incluye materiales, mano de obra, terminaciones, instalaciones, transporte e impuestos

## 🚀 Tecnologías Utilizadas

### **Frontend**
- **HTML5**: Estructura semántica moderna
- **CSS3**: Estilos avanzados con variables CSS y Flexbox/Grid
- **JavaScript ES6+**: Lógica de aplicación modular
- **Font Awesome**: Iconografía profesional
- **Responsive Design**: Mobile-first approach

### **Backend**
- **Python 3.8+**: Lógica de negocio y cálculos
- **FastAPI**: API REST moderna y rápida
- **ReportLab**: Generación de PDFs profesionales
- **SMTP**: Envío de emails automático
- **Nocodb**: Almacenamiento de datos de clientes

### **Servicios Integrados**
- **Email Service**: Envío automático de cotizaciones
- **PDF Service**: Generación de documentos descargables
- **Nocodb Service**: Base de datos para clientes y contactos
- **Materials Manager**: Gestión completa de materiales

## 📁 Estructura del Proyecto

```
cotizador_construccion/
├── frontend/                 # Interfaz de usuario
│   ├── index.html           # Página principal
│   ├── css/                 # Estilos CSS
│   │   ├── styles.css       # Estilos principales
│   │   ├── components.css   # Componentes específicos
│   │   └── responsive.css   # Diseño responsive
│   └── js/                  # Lógica JavaScript
│       ├── app.js           # Aplicación principal
│       ├── materials-manager.js # Gestor de materiales
│       ├── quote.js         # Lógica de cotización
│       ├── contact-form.js  # Formulario de contacto
│       ├── materials.js     # Datos de materiales
│       └── ui.js            # Utilidades de interfaz
├── backend-python/          # Backend en Python
│   ├── app/                 # Aplicación principal
│   │   ├── main.py          # API principal
│   │   ├── config.py        # Configuración
│   │   ├── calculator.py    # Cálculos de construcción
│   │   ├── price_service.py # Servicio de precios
│   │   ├── email_service.py # Servicio de email
│   │   ├── pdf_service.py   # Generación de PDF
│   │   ├── nocodb_service.py # Integración Nocodb
│   │   └── models.py        # Modelos de datos
│   └── requirements.txt     # Dependencias Python
├── backend-node/            # Servidor Node.js
│   ├── server.js            # Servidor HTTP simple
│   └── package.json         # Dependencias Node.js
└── docker-compose.yml       # Configuración Docker
```

## 🛠️ Instalación y Configuración

### **Requisitos Previos**
- Docker y Docker Compose
- Python 3.8+
- Node.js 14+
- NPM o Yarn

### **Instalación Local**

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd cotizador_construccion
```

2. **Instalar dependencias Python**
```bash
cd backend-python
pip install -r requirements.txt
```

3. **Instalar dependencias Node.js**
```bash
cd ../backend-node
npm install
```

4. **Configurar variables de entorno**
```bash
# Crear archivo .env en backend-python/app/
cp .env.example .env
# Editar con tus credenciales
```

5. **Ejecutar la aplicación**
```bash
# Terminal 1: Backend Python
cd backend-python
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend Node.js
cd backend-node
node server.js
```

### **Instalación con Docker**

1. **Construir y ejecutar**
```bash
docker-compose up --build
```

2. **Acceder a la aplicación**
- Frontend: http://localhost:8000
- API Backend: http://localhost:8000/api

## ⚙️ Configuración

### **Variables de Entorno (.env)**
```env
# SMTP Configuration
SMTP_SERVER=c2630942.ferozo.com
SMTP_PORT=465
SMTP_USERNAME=novedades@sumpetrol.com.ar
SMTP_PASSWORD=Novedad3s2k24@@
SMTP_USE_TLS=true
SMTP_USE_SSL=true

# Contact Email
CONTACT_EMAIL=marketing@sumpetrol.com.ar

# Nocodb Configuration
NOCODB_URL=https://bots-nocodb.prskfv.easypanel.host
NOCODB_TOKEN=JvshcwW9JUK_sR4yT7H5r7ygSA2BPFAGNI8nSeWF
NOCODB_BASE_ID=pjo0a1kfnvm1ai3
NOCODB_TABLE_ID=m7i75nx5rkwockg

# App Configuration
APP_NAME="Cotizador de Construcción - Sumpetrol"
APP_VERSION=1.0.0
DEBUG=false
```

## 🔧 API Endpoints

### **Cotización**
- `POST /api/cotizar` - Calcular cotización
- `GET /api/cotizar/descargar-pdf` - Descargar PDF de cotización
- `POST /api/cotizar/enviar-email` - Enviar cotización por email

### **Materiales**
- `GET /api/materiales/precios` - Obtener precios de materiales
- `GET /api/materiales/categorias` - Obtener categorías

### **Contacto**
- `POST /api/contacto/enviar` - Enviar formulario de contacto

### **Nocodb**
- `GET /api/nocodb/clientes` - Obtener lista de clientes
- `PATCH /api/nocodb/clientes/{id}/estado` - Actualizar estado de cliente

## 🎨 Personalización

### **Colores y Estilos**
Los colores principales se definen en variables CSS:
```css
:root {
  --primary-color: #990042;      /* Marrón Sumpetrol */
  --primary-dark: #720220;       /* Marrón oscuro */
  --primary-light: #b30052;      /* Marrón claro */
  --secondary-color: #4a5568;    /* Gris secundario */
  --success: #38a169;            /* Verde éxito */
  --error: #e53e3e;              /* Rojo error */
  --warning: #d69e2e;            /* Amarillo advertencia */
}
```

### **Logo y Branding**
- **Logo Principal**: `https://sumpetrol.com.ar/wp-content/uploads/2024/01/Logo-png-transparente.png`
- **Favicon**: Configurado para Sumpetrol
- **Colores**: Paleta corporativa de Sumpetrol

## 📱 Características Responsive

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Adaptaciones**
- Navegación móvil con menú hamburguesa
- Grids adaptativos para diferentes tamaños
- Botones y formularios optimizados para touch
- Imágenes responsivas

## 🚀 Despliegue

### **Docker (Recomendado)**
```bash
# Construir imagen
docker build -t cotizador-construccion .

# Ejecutar contenedor
docker run -p 8000:8000 cotizador-construccion
```

### **Easypanel**
La aplicación está configurada para despliegue en Easypanel con:
- Volúmenes persistentes para datos
- Configuración de red optimizada
- Health checks automáticos

### **Producción**
Para entornos de producción:
1. Configurar HTTPS
2. Establecer variables de entorno de producción
3. Configurar monitoreo y logs
4. Implementar backup automático

## 🧪 Testing

### **Frontend**
- Validación de formularios
- Pruebas de usabilidad
- Compatibilidad de navegadores

### **Backend**
- Tests unitarios para cálculos
- Validación de API endpoints
- Pruebas de integración

## 📊 Monitoreo y Logs

### **Logs de Aplicación**
- Logs de cotizaciones generadas
- Errores de API y frontend
- Métricas de uso

### **Métricas Clave**
- Número de cotizaciones generadas
- Materiales más consultados
- Tiempo de respuesta de la API

## 🔒 Seguridad

### **Medidas Implementadas**
- Validación de entrada en frontend y backend
- Sanitización de datos
- CORS configurado
- Rate limiting en APIs críticas

### **Recomendaciones**
- Mantener dependencias actualizadas
- Monitorear logs de seguridad
- Implementar autenticación si es necesario

## 🤝 Contribución

### **Guidelines**
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### **Estándares de Código**
- Python: PEP 8
- JavaScript: ESLint + Prettier
- CSS: BEM methodology
- Commits: Conventional Commits

## 📞 Soporte

### **Contacto Técnico**
- **Email**: marketing@sumpetrol.com.ar
- **Sitio Web**: https://sumpetrol.com.ar

### **Reportar Issues**
1. Verificar que el issue no esté ya reportado
2. Usar el template de issue
3. Incluir pasos para reproducir
4. Adjuntar logs y screenshots si es necesario

## 📄 Licencia

Este proyecto es propiedad de **Sumpetrol** y está destinado para uso interno y comercial de la empresa.

## 🗓️ Historial de Versiones

### **v1.0.0 (2025-08-31)**
- ✅ Implementación inicial del cotizador
- ✅ Gestión completa de materiales
- ✅ Generación de PDFs
- ✅ Integración con Nocodb
- ✅ Servicio de email SMTP
- ✅ Diseño responsive completo
- ✅ Logo y branding de Sumpetrol
- ✅ Precios en Dólares Americanos
- ✅ Formulario de contacto funcional

---

**Desarrollado con ❤️ para Sumpetrol**
