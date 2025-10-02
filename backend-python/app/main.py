from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import ValidationError
import uvicorn
import logging
from typing import List, Dict, Any
import json
import os
from datetime import datetime

from .models import (
    CotizacionRequest, CotizacionResponse, Material, 
    PrecioMaterial, CalculoCostos
)
from .calculator import ConstructionCalculator
from .price_service import PriceService
from .email_service import email_service
from .email_service_improved import improved_email_service
from .nocodb_service import nocodb_service
from .pdf_service import pdf_service
from .argentina_apis import argentina_api_service, get_current_prices, get_current_exchange_rate
from .price_updater import price_updater_service, start_price_updater, get_price_updater_status
from .config import settings

# Función wrapper para guardar datos en NocoDB
def save_data_to_nocodb(data_type: str, data: Dict[str, Any]):
    """Wrapper síncrono para guardar datos en NocoDB"""
    import asyncio
    try:
        logger.info(f"🔄 Guardando {data_type} en NocoDB: {data.get('nombre', data.get('customer_name', 'Sin nombre'))}")
        logger.info(f"📊 Datos recibidos: {data}")
        
        # Crear nuevo loop de eventos para la tarea async
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            if data_type == "contact":
                success = loop.run_until_complete(nocodb_service.save_customer_data(data))
            elif data_type == "quote":
                success = loop.run_until_complete(nocodb_service.save_quote_data(data))
            else:
                logger.error(f"❌ Tipo de datos no reconocido: {data_type}")
                return False
                
            if success:
                logger.info(f"✅ {data_type} guardado exitosamente en NocoDB")
            else:
                logger.error(f"❌ Error guardando {data_type} en NocoDB")
            return success
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"❌ Error en wrapper de guardado de {data_type}: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return False

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear instancia de FastAPI
app = FastAPI(
    title="Cotizador de Construcción API - Sumpetrol",
    description="API para cotización de construcciones steel frame e industriales con integración SMTP y Nocodb",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instanciar servicios
calculator = ConstructionCalculator()
price_service = PriceService()

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "Cotizador de Construcción API - Sumpetrol",
        "version": "1.0.0",
        "status": "activo",
        "company": "Sumpetrol"
    }

@app.get("/health")
async def health_check():
    """Verificación de salud de la API"""
    return {"status": "healthy", "service": "cotizador_construccion", "company": "Sumpetrol"}

@app.post("/cotizar", response_model=CotizacionResponse)
async def crear_cotizacion(request: CotizacionRequest, background_tasks: BackgroundTasks):
    """Crea una nueva cotización de construcción"""
    try:
        logger.info(f"Nueva cotización solicitada por: {request.nombre}")
        
        # Validar datos de entrada
        if request.metros_cuadrados <= 0:
            raise HTTPException(status_code=400, detail="Los metros cuadrados deben ser mayores a 0")
        
        if request.pisos < 1 or request.pisos > 10:
            raise HTTPException(status_code=400, detail="El número de pisos debe estar entre 1 y 10")
        
        # Calcular cotización
        cotizacion = await calculator.calculate_quote(request)
        
        # Guardar en Nocodb en background
        background_tasks.add_task(
            nocodb_service.save_customer_data,
            {
                "fecha": datetime.now().strftime("%Y-%m-%d"),
                "nombre": request.nombre,
                "email": request.email,
                "whatsapp": request.whatsapp,
                "tipo_construccion": request.tipo_construccion,
                "metros_cuadrados": request.metros_cuadrados,
                "provincia": request.provincia,
                "pisos": request.pisos,
                "uso": request.tipo_uso,
                "terminaciones": request.nivel_terminacion,
                "total_cotizacion": cotizacion.total_estimado,
                "materiales": str(cotizacion.materiales_utilizados),
                "observaciones": request.observaciones
            }
        )
        
        logger.info(f"Cotización creada exitosamente. ID: {cotizacion.id}")
        
        return cotizacion
        
    except ValidationError as e:
        logger.error(f"Error de validación: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error interno: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/cotizar/enviar-email")
async def enviar_cotizacion_email(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Envía la cotización por email al cliente"""
    try:
        logger.info("📧 Recibiendo solicitud de envío de email de cotización...")
        
        # Obtener datos del body
        body = await request.json()
        logger.info(f"📋 Datos recibidos: {body}")
        
        customer_email = body.get('email')
        customer_name = body.get('nombre')
        
        if not customer_email or not customer_name:
            logger.error("❌ Faltan datos requeridos (email o nombre)")
            raise HTTPException(status_code=400, detail="Faltan datos requeridos (email o nombre)")
        
        quote_data = {
            'nombre': customer_name,
            'email': customer_email,
            'telefono': body.get('telefono'),
            'whatsapp': body.get('whatsapp'),
            'provincia': body.get('provincia'),
            'tipo_construccion': body.get('tipo_construccion'),
            'metros_cuadrados': body.get('metros_cuadrados'),
            'pisos': body.get('pisos'),
            'tipo_uso': body.get('tipo_uso'),
            'nivel_terminacion': body.get('nivel_terminacion'),
            'total_estimado': body.get('total_estimado'),
            'materiales': body.get('materiales'),
            'observaciones': body.get('observaciones'),
            'tiempo_estimado': body.get('tiempo_estimado')
        }
        
        logger.info(f"👤 Cliente: {customer_name}, Email: {customer_email}")
        logger.info(f"📊 Tipo construcción: {quote_data.get('tipo_construccion')}, Área: {quote_data.get('metros_cuadrados')} m²")
        
        # Generar PDF en background
        background_tasks.add_task(
            _generate_and_send_pdf_email,
            customer_email,
            customer_name,
            quote_data
        )
        
        logger.info("✅ Tarea de envío de email agregada a background tasks")
        
        return {
            "success": True,
            "message": "Email de cotización enviado exitosamente",
            "status": "enviado"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error enviando email: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

async def _generate_and_send_pdf_email(customer_email: str, customer_name: str, quote_data: Dict[str, Any]):
    """Función helper para generar PDF y enviar email en background"""
    try:
        logger.info(f"📧 Generando PDF y enviando email a {customer_email}...")
        
        # Generar PDF
        pdf_path = pdf_service.generate_quote_pdf(quote_data, {"nombre": customer_name, "email": customer_email})
        logger.info(f"✅ PDF generado: {pdf_path}")
        
        # Enviar email usando el servicio mejorado
        success = improved_email_service.send_construction_quote_email(customer_email, customer_name, quote_data)
        
        # Limpiar archivo temporal
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
            logger.info("🗑️ Archivo temporal PDF eliminado")
            
        if success:
            logger.info(f"✅ Email de cotización enviado exitosamente a {customer_email}")
        else:
            logger.error(f"❌ Error enviando email a {customer_email}")
            
    except Exception as e:
        logger.error(f"❌ Error en proceso de email con PDF: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")

@app.post("/contacto/enviar")
async def enviar_contacto(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Envía formulario de contacto"""
    try:
        logger.info("📧 Recibiendo formulario de contacto...")
        
        body = await request.json()
        logger.info(f"📋 Datos recibidos: {body}")
        
        nombre = body.get('name') or body.get('nombre', '')
        email = body.get('email', '')
        telefono = body.get('phone') or body.get('telefono', '')
        mensaje = body.get('message') or body.get('mensaje', '')
        
        logger.info(f"📝 Datos extraídos - Nombre: {nombre}, Email: {email}, Teléfono: {telefono}")
        
        if not nombre or not email or not mensaje:
            logger.error("❌ Faltan datos requeridos")
            raise HTTPException(status_code=400, detail="Faltan datos requeridos")
        
        # Enviar email usando el servicio mejorado
        background_tasks.add_task(
            improved_email_service.send_contact_form_email,
            nombre,
            email,
            telefono,
            mensaje
        )
        
        # Guardar en Nocodb usando wrapper
        background_tasks.add_task(
            save_data_to_nocodb,
            "contact",
            {
                "fecha": datetime.now().strftime("%Y-%m-%d"),
                "nombre": nombre,
                "email": email,
                "telefono": telefono,
                "mensaje": mensaje
            }
        )
        
        logger.info("✅ Formulario de contacto procesado exitosamente")
        
        return {
            "success": True,
            "message": "Mensaje de contacto enviado exitosamente",
            "status": "enviado"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando contacto: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/cotizar/descargar-pdf")
async def descargar_cotizacion_pdf(request: Request):
    """Genera y descarga PDF de la cotización"""
    try:
        logger.info("📄 Generando PDF de cotización...")
        
        body = await request.json()
        logger.info(f"📋 Datos recibidos para PDF: {body}")
        
        customer_name = body.get('customer_name', 'Cliente')
        customer_email = body.get('customer_email', '')
        quote_data = body.get('quote_data', {})
        
        logger.info(f"👤 Cliente: {customer_name}, Email: {customer_email}")
        
        # Generar PDF
        pdf_path = pdf_service.generate_quote_pdf(quote_data, {"nombre": customer_name, "email": customer_email})
        
        logger.info(f"✅ PDF generado exitosamente: {pdf_path}")
        
        # Retornar archivo para descarga
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"cotizacion_{customer_name}_{datetime.now().strftime('%Y%m%d')}.pdf"
        )
        
    except Exception as e:
        logger.error(f"❌ Error generando PDF: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error generando PDF")

@app.post("/nocodb/clientes")
async def crear_cliente(customer_data: dict):
    """Crea un nuevo cliente en NocoDB"""
    try:
        logger.info(f"Creando nuevo cliente: {customer_data.get('nombre', 'Sin nombre')}")
        
        success = await nocodb_service.save_customer_data(customer_data)
        
        if success:
            return {
                "success": True,
                "message": "Cliente creado exitosamente en NocoDB",
                "data": customer_data
            }
        else:
            raise HTTPException(status_code=500, detail="Error creando cliente en NocoDB")
            
    except Exception as e:
        logger.error(f"Error creando cliente: {e}")
        raise HTTPException(status_code=500, detail=f"Error creando cliente: {str(e)}")

@app.get("/nocodb/clientes")
async def obtener_clientes(limit: int = 100):
    """Obtiene lista de clientes desde Nocodb"""
    try:
        clientes = await nocodb_service.get_customers(limit)
        return {
            "clientes": clientes,
            "total": len(clientes) if clientes else 0
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo clientes: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo clientes")

@app.patch("/nocodb/clientes/{customer_id}/estado")
async def actualizar_estado_cliente(customer_id: int, estado: str):
    """Actualiza el estado de un cliente en Nocodb"""
    try:
        success = await nocodb_service.update_customer_status(customer_id, estado)
        
        if success:
            return {"message": f"Estado del cliente {customer_id} actualizado a: {estado}"}
        else:
            raise HTTPException(status_code=500, detail="Error actualizando estado")
            
    except Exception as e:
        logger.error(f"Error actualizando estado: {e}")
        raise HTTPException(status_code=500, detail="Error actualizando estado")

@app.get("/costos/desglose")
async def obtener_desglose_costos(
    metros_cuadrados: float,
    tipo_construccion: str,
    tipo_uso: str,
    nivel_terminacion: str,
    provincia: str = "buenos_aires"
):
    """Obtiene el desglose de costos sin crear una cotización completa"""
    try:
        # Crear request mínimo para el cálculo
        request = CotizacionRequest(
            nombre="Consulta",
            email="consulta@example.com",
            tipo_construccion=tipo_construccion,
            tipo_uso=tipo_uso,
            nivel_terminacion=nivel_terminacion,
            metros_cuadrados=metros_cuadrados,
            provincia=provincia
        )
        
        desglose = await calculator.get_cost_breakdown(request)
        
        return {
            "metros_cuadrados": metros_cuadrados,
            "tipo_construccion": tipo_construccion,
            "tipo_uso": tipo_uso,
            "nivel_terminacion": nivel_terminacion,
            "provincia": provincia,
            "desglose": desglose
        }
        
    except Exception as e:
        logger.error(f"Error calculando desglose: {e}")
        raise HTTPException(status_code=500, detail="Error calculando costos")

@app.get("/materiales/precios")
async def obtener_precios_materiales():
    """Obtiene todos los precios de materiales disponibles"""
    try:
        materiales = price_service.get_all_base_prices()
        
        return {
            "materiales": [
                {
                    "nombre": mat.nombre,
                    "precio_por_m2": mat.precio_por_m2,
                    "unidad": mat.unidad,
                    "categoria": mat.categoria
                }
                for mat in materiales.values()
            ],
            "total_materiales": len(materiales),
            "moneda": "ARS"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo precios: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo precios")

@app.get("/materiales/{material}/precio")
async def obtener_precio_material(material: str):
    """Obtiene el precio de un material específico"""
    try:
        precio = await price_service.get_material_price(material)
        
        if not precio:
            raise HTTPException(status_code=404, detail=f"Material '{material}' no encontrado")
        
        return precio
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo precio de {material}: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo precio")

@app.get("/regiones/multiplicadores")
async def obtener_multiplicadores_regionales():
    """Obtiene los multiplicadores de precio por región"""
    try:
        # Obtener multiplicadores de todas las provincias
        provincias = [
            "buenos_aires", "caba", "cordoba", "santa_fe", "mendoza",
            "tucuman", "salta", "jujuy", "chaco", "formosa", "misiones",
            "corrientes", "entre_rios", "la_pampa", "rio_negro", "neuquen",
            "chubut", "santa_cruz", "tierra_del_fuego"
        ]
        
        multiplicadores = {}
        for provincia in provincias:
            multiplicadores[provincia] = price_service.get_price_multiplier_by_region(provincia)
        
        return {
            "multiplicadores": multiplicadores,
            "descripcion": "Factores de ajuste de precio por región de Argentina"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo multiplicadores: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo multiplicadores")

@app.get("/tipos-construccion")
async def obtener_tipos_construccion():
    """Obtiene los tipos de construcción disponibles"""
    return {
        "tipos": [
            {
                "id": "steel_frame",
                "nombre": "Steel Frame",
                "descripcion": "Construcción en seco con perfiles de acero galvanizado",
                "caracteristicas": ["Rápida construcción", "Excelente aislamiento", "Ecológico"]
            },
            {
                "id": "industrial",
                "nombre": "Industrial",
                "descripcion": "Estructuras con hierros estructurales y metales",
                "caracteristicas": ["Alta resistencia", "Ideal para naves industriales", "Económico"]
            },
            {
                "id": "contenedor",
                "nombre": "Contenedor Marítimo",
                "descripcion": "Conversión de contenedores en módulos habitables",
                "caracteristicas": ["Muy económico", "Portátil", "Rápido"]
            },
            {
                "id": "mixto",
                "nombre": "Mixto",
                "descripcion": "Combinación de diferentes sistemas constructivos",
                "caracteristicas": ["Flexible", "Personalizable", "Adaptable"]
            }
        ]
    }

@app.get("/niveles-terminacion")
async def obtener_niveles_terminacion():
    """Obtiene los niveles de terminación disponibles"""
    return {
        "niveles": [
            {
                "id": "basico",
                "nombre": "Básico",
                "descripcion": "Terminaciones básicas para uso funcional",
                "factor_precio": 0.7
            },
            {
                "id": "estandar",
                "nombre": "Estándar",
                "descripcion": "Terminaciones estándar para uso residencial",
                "factor_precio": 1.0
            },
            {
                "id": "premium",
                "nombre": "Premium",
                "descripcion": "Terminaciones premium con materiales de alta calidad",
                "factor_precio": 1.4
            }
        ]
    }

@app.get("/tipos-uso")
async def obtener_tipos_uso():
    """Obtiene los tipos de uso disponibles"""
    return {
        "tipos": [
            {
                "id": "residencial",
                "nombre": "Residencial",
                "descripcion": "Viviendas y espacios habitables",
                "factor_precio": 1.0
            },
            {
                "id": "industrial",
                "nombre": "Industrial",
                "descripcion": "Naves industriales y espacios de trabajo",
                "factor_precio": 0.9
            },
            {
                "id": "comercial",
                "nombre": "Comercial",
                "descripcion": "Locales comerciales y espacios públicos",
                "factor_precio": 1.1
            }
        ]
    }

# ============================================================================
# NUEVOS ENDPOINTS PARA APIS DE ARGENTINA
# ============================================================================

@app.get("/api/argentina/precios")
async def obtener_precios_argentina():
    """Obtiene precios actualizados de construcción desde APIs de Argentina"""
    try:
        logger.info("Obteniendo precios desde APIs de Argentina...")
        prices = await get_current_prices()
        
        return {
            "success": True,
            "data": {
                "steel_frame_m2": prices.steel_frame_m2,
                "industrial_m2": prices.industrial_m2,
                "container_m2": prices.container_m2,
                "materials_m2": prices.materials_m2,
                "labor_m2": prices.labor_m2,
                "finishes_m2": prices.finishes_m2,
                "last_updated": prices.last_updated.isoformat(),
                "currency": "USD",
                "source": "Argentina APIs (INDEC + BCRA)"
            },
            "message": "Precios obtenidos exitosamente desde APIs de Argentina"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo precios de Argentina: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo precios de Argentina")

@app.get("/api/argentina/tipo-cambio")
async def obtener_tipo_cambio():
    """Obtiene tipo de cambio ARS/USD actual desde Banco Central de Argentina"""
    try:
        logger.info("Obteniendo tipo de cambio desde BCRA...")
        exchange_rate = await get_current_exchange_rate()
        
        return {
            "success": True,
            "data": {
                "ars_usd": exchange_rate.ars_usd,
                "usd_ars": exchange_rate.usd_ars,
                "last_updated": exchange_rate.last_updated.isoformat(),
                "source": exchange_rate.source
            },
            "message": "Tipo de cambio obtenido exitosamente"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo tipo de cambio: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo tipo de cambio")

@app.get("/api/argentina/multiplicadores-regionales")
async def obtener_multiplicadores_regionales():
    """Obtiene multiplicadores de precio por región de Argentina"""
    try:
        multipliers = {}
        provinces = [
            "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán",
            "Entre Ríos", "Chaco", "Corrientes", "Misiones", "Formosa",
            "Chubut", "Río Negro", "Neuquén", "La Pampa", "San Luis",
            "La Rioja", "Catamarca", "Santiago", "Salta", "Jujuy",
            "San Juan", "Tierra del Fuego"
        ]
        
        for province in provinces:
            multipliers[province] = argentina_api_service.get_regional_multiplier(province)
        
        return {
            "success": True,
            "data": multipliers,
            "message": "Multiplicadores regionales obtenidos exitosamente"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo multiplicadores regionales: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo multiplicadores regionales")

@app.get("/api/argentina/materiales")
async def obtener_precios_materiales():
    """Obtiene precios actualizados de materiales de construcción"""
    try:
        # Lista de materiales disponibles
        materiales = [
            "acero_estructural", "perfiles_metalicos", "tornillos", "pintura",
            "aislante", "techo_metalico", "piso_cemento", "ventanas",
            "puertas", "instalacion_electrica", "instalacion_sanitaria",
            "ceramica", "griferia", "iluminacion"
        ]
        
        precios = {}
        for material in materiales:
            precios[material] = argentina_api_service.get_material_price(material)
        
        return {
            "success": True,
            "data": precios,
            "currency": "USD",
            "message": "Precios de materiales obtenidos exitosamente"
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo precios de materiales: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo precios de materiales")

# ============================================================================
# ENDPOINTS PARA SERVICIO DE ACTUALIZACIÓN AUTOMÁTICA
# ============================================================================

@app.get("/api/updater/status")
async def obtener_estado_actualizador():
    """Obtiene el estado del servicio de actualización automática de precios"""
    try:
        status = get_price_updater_status()
        return {
            "success": True,
            "data": status,
            "message": "Estado del actualizador obtenido exitosamente"
        }
    except Exception as e:
        logger.error(f"Error obteniendo estado del actualizador: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo estado del actualizador")

@app.post("/api/updater/start")
async def iniciar_actualizador():
    """Inicia el servicio de actualización automática de precios"""
    try:
        await start_price_updater()
        return {
            "success": True,
            "message": "Servicio de actualización iniciado exitosamente"
        }
    except Exception as e:
        logger.error(f"Error iniciando actualizador: {e}")
        raise HTTPException(status_code=500, detail="Error iniciando actualizador")

@app.post("/api/updater/stop")
async def detener_actualizador():
    """Detiene el servicio de actualización automática de precios"""
    try:
        price_updater_service.stop()
        return {
            "success": True,
            "message": "Servicio de actualización detenido exitosamente"
        }
    except Exception as e:
        logger.error(f"Error deteniendo actualizador: {e}")
        raise HTTPException(status_code=500, detail="Error deteniendo actualizador")

@app.post("/api/updater/force-update")
async def forzar_actualizacion():
    """Fuerza una actualización inmediata de precios"""
    try:
        logger.info("Forzando actualización inmediata de precios...")
        
        # Actualizar precios
        prices = await get_current_prices()
        
        # Actualizar tipo de cambio
        exchange_rate = await get_current_exchange_rate()
        
        return {
            "success": True,
            "data": {
                "prices": {
                    "steel_frame_m2": prices.steel_frame_m2,
                    "industrial_m2": prices.industrial_m2,
                    "container_m2": prices.container_m2,
                    "materials_m2": prices.materials_m2,
                    "labor_m2": prices.labor_m2,
                    "finishes_m2": prices.finishes_m2
                },
                "exchange_rate": {
                    "ars_usd": exchange_rate.ars_usd,
                    "usd_ars": exchange_rate.usd_ars,
                    "source": exchange_rate.source
                },
                "last_updated": datetime.now().isoformat()
            },
            "message": "Actualización forzada completada exitosamente"
        }
        
    except Exception as e:
        logger.error(f"Error en actualización forzada: {e}")
        raise HTTPException(status_code=500, detail="Error en actualización forzada")

# ============================================================================
# ENDPOINTS ADICIONALES PARA COMPATIBILIDAD CON FRONTEND
# ============================================================================

@app.get("/api/construccion/tipos")
async def api_tipos_construccion():
    """Endpoint API para tipos de construcción"""
    return await obtener_tipos_construccion()

@app.get("/api/construccion/terminaciones")
async def api_niveles_terminacion():
    """Endpoint API para niveles de terminación"""
    return await obtener_niveles_terminacion()

@app.get("/api/construccion/usos")
async def api_tipos_uso():
    """Endpoint API para tipos de uso"""
    return await obtener_tipos_uso()

@app.get("/api/materiales/precios")
async def api_precios_materiales():
    """Endpoint API para precios de materiales"""
    return await obtener_precios_materiales()

@app.get("/api/regiones/multiplicadores")
async def api_multiplicadores_regionales():
    """Endpoint API para multiplicadores regionales"""
    return await obtener_multiplicadores_regionales()

@app.get("/api/costos/desglose")
async def api_desglose_costos(
    metros_cuadrados: float,
    tipo_construccion: str,
    tipo_uso: str,
    nivel_terminacion: str,
    provincia: str = "buenos_aires"
):
    """Endpoint API para desglose de costos"""
    return await obtener_desglose_costos(
        metros_cuadrados=metros_cuadrados,
        tipo_construccion=tipo_construccion,
        tipo_uso=tipo_uso,
        nivel_terminacion=nivel_terminacion,
        provincia=provincia
    )

@app.post("/api/cotizaciones")
async def api_crear_cotizacion(request: CotizacionRequest, background_tasks: BackgroundTasks):
    """Endpoint API para crear cotización"""
    return await crear_cotizacion(request, background_tasks)

@app.get("/api/cotizaciones/{cotizacion_id}")
async def api_obtener_cotizacion(cotizacion_id: str):
    """Endpoint API para obtener cotización por ID"""
    try:
        # En una implementación real, esto vendría de una base de datos
        return {
            "message": "Cotización obtenida",
            "id": cotizacion_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error obteniendo cotización {cotizacion_id}: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo cotización")

# ============================================================================
# EVENTOS DE INICIO Y CIERRE
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Evento que se ejecuta al iniciar la aplicación"""
    try:
        logger.info("🚀 Iniciando Cotizador de Construcción API...")
        
        # Iniciar servicio de actualización automática
        await start_price_updater()
        
        logger.info("✅ Servicio de actualización automática iniciado")
        logger.info("✅ API lista para recibir solicitudes")
        
    except Exception as e:
        logger.error(f"❌ Error en evento de inicio: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento que se ejecuta al cerrar la aplicación"""
    try:
        logger.info("🛑 Cerrando Cotizador de Construcción API...")
        
        # Detener servicio de actualización automática
        price_updater_service.stop()
        
        logger.info("✅ Servicio de actualización automática detenido")
        logger.info("✅ API cerrada correctamente")
        
    except Exception as e:
        logger.error(f"❌ Error en evento de cierre: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
