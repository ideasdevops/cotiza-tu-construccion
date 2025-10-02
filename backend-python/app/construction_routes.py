"""
Rutas para el Cotizador de Construcción Simplificado
Basado en la lógica exitosa del cotizador solar
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from typing import Dict, Any
import logging
from datetime import datetime

from .construction_calculator import ConstructionCalculator
from .email_service_improved import ImprovedEmailService
from .nocodb_service import NocodbService

logger = logging.getLogger(__name__)

router = APIRouter()

# Instancias de servicios
try:
    logger.info("🏗️ Inicializando servicios de construcción...")
    construction_calculator = ConstructionCalculator()
    email_service = ImprovedEmailService()
    nocodb_service = NocodbService()
    logger.info("✅ Servicios de construcción inicializados correctamente")
except Exception as e:
    logger.error(f"❌ Error inicializando servicios de construcción: {e}")
    import traceback
    logger.error(f"❌ Traceback: {traceback.format_exc()}")
    raise

@router.get("/health")
async def health_check():
    """Verificar salud de la API"""
    return {
        "status": "healthy",
        "service": "construction-calculator",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/test")
async def test_endpoint():
    """Endpoint de prueba para verificar conectividad"""
    return {
        "message": "Construction calculator API is working!",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/api/construction/health",
            "/api/construction/test", 
            "/api/construction/estimate",
            "/api/construction/quote"
        ]
    }

@router.post("/estimate")
async def quick_estimate(request: Request):
    """
    Estimación rápida de construcción
    Similar al endpoint de estimación rápida del cotizador solar
    """
    try:
        logger.info("⚡ Iniciando estimación rápida de construcción...")
        
        body = await request.json()
        logger.info(f"📋 Datos recibidos: {body}")
        
        # Validar datos mínimos
        required_fields = ['clientName', 'clientEmail', 'clientPhone', 'location', 'constructionType', 'squareMeters']
        for field in required_fields:
            if not body.get(field):
                logger.warning(f"⚠️ Campo requerido faltante: {field}")
                raise HTTPException(status_code=400, detail=f"Campo requerido faltante: {field}")
        
        # Preparar datos para el calculador
        estimate_data = {
            'client_name': body.get('clientName'),
            'client_email': body.get('clientEmail'),
            'client_phone': body.get('clientPhone'),
            'location': body.get('location'),
            'construction_type': body.get('constructionType'),
            'square_meters': float(body.get('squareMeters', 0)),
            'floors': int(body.get('floors', 1)),
            'usage_type': body.get('usageType', 'residencial'),
            'finish_level': body.get('finishLevel', 'estandar')
        }
        
        logger.info(f"👤 Cliente: {estimate_data['client_name']}, Email: {estimate_data['client_email']}")
        logger.info(f"📊 Tipo: {estimate_data['construction_type']}, Área: {estimate_data['square_meters']} m²")
        
        # Calcular estimación rápida
        estimation = construction_calculator.calculate_quick_estimate(estimate_data)
        
        logger.info(f"✅ Estimación calculada: ${estimation.get('estimated_cost', 'N/A')}")
        
        return {
            "success": True,
            "estimation": estimation,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en estimación rápida: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/quote")
async def detailed_quote(request: Request, background_tasks: BackgroundTasks):
    """
    Cotización completa de construcción
    Similar al endpoint de cotización completa del cotizador solar
    """
    try:
        logger.info("📋 Iniciando cotización completa de construcción...")
        
        body = await request.json()
        logger.info(f"📋 Datos recibidos: {body}")
        
        # Validar datos completos
        required_fields = ['clientName', 'clientEmail', 'clientPhone', 'location', 'constructionType', 'squareMeters', 'usageType', 'finishLevel']
        for field in required_fields:
            if not body.get(field):
                logger.warning(f"⚠️ Campo requerido faltante: {field}")
                raise HTTPException(status_code=400, detail=f"Campo requerido faltante: {field}")
        
        # Preparar datos para el calculador
        quote_data = {
            'client_name': body.get('clientName'),
            'client_email': body.get('clientEmail'),
            'client_phone': body.get('clientPhone'),
            'location': body.get('location'),
            'construction_type': body.get('constructionType'),
            'square_meters': float(body.get('squareMeters', 0)),
            'floors': int(body.get('floors', 1)),
            'usage_type': body.get('usageType'),
            'finish_level': body.get('finishLevel')
        }
        
        logger.info(f"👤 Cliente: {quote_data['client_name']}, Email: {quote_data['client_email']}")
        logger.info(f"📊 Tipo: {quote_data['construction_type']}, Área: {quote_data['square_meters']} m², Pisos: {quote_data['floors']}")
        
        # Calcular cotización completa
        quote = construction_calculator.calculate_detailed_quote(quote_data)
        
        logger.info(f"✅ Cotización calculada: ${quote.get('total_cost', 'N/A')}")
        
        # Guardar en NocoDB en background
        background_tasks.add_task(save_quote_to_nocodb, quote_data, quote)
        
        # Enviar email en background
        background_tasks.add_task(send_quote_email, quote_data, quote)
        
        return {
            "success": True,
            "quote": quote,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en cotización completa: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

async def save_quote_to_nocodb(client_data: Dict[str, Any], quote_data: Dict[str, Any]):
    """Guardar cotización en NocoDB"""
    try:
        logger.info("💾 Guardando cotización en NocoDB...")
        
        # Preparar datos para NocoDB
        nocodb_data = {
            'client_name': client_data.get('client_name'),
            'client_email': client_data.get('client_email'),
            'client_phone': client_data.get('client_phone'),
            'location': client_data.get('location'),
            'construction_type': client_data.get('construction_type'),
            'square_meters': client_data.get('square_meters'),
            'floors': client_data.get('floors'),
            'usage_type': client_data.get('usage_type'),
            'finish_level': client_data.get('finish_level'),
            'total_cost': quote_data.get('total_cost'),
            'estimated_time': quote_data.get('estimated_time'),
            'quote_date': datetime.now().isoformat(),
            'status': 'pending'
        }
        
        success = await nocodb_service.save_construction_quote(nocodb_data)
        
        if success:
            logger.info("✅ Cotización guardada en NocoDB exitosamente")
        else:
            logger.error("❌ Error guardando cotización en NocoDB")
            
    except Exception as e:
        logger.error(f"❌ Error guardando en NocoDB: {e}")

async def send_quote_email(client_data: Dict[str, Any], quote_data: Dict[str, Any]):
    """Enviar email de cotización"""
    try:
        logger.info(f"📧 Enviando email de cotización a {client_data.get('client_email')}...")
        
        # Preparar datos para email
        email_data = {
            'client_name': client_data.get('client_name'),
            'client_email': client_data.get('client_email'),
            'client_phone': client_data.get('client_phone'),
            'location': client_data.get('location'),
            'construction_type': client_data.get('construction_type'),
            'square_meters': client_data.get('square_meters'),
            'floors': client_data.get('floors'),
            'usage_type': client_data.get('usage_type'),
            'finish_level': client_data.get('finish_level'),
            'total_cost': quote_data.get('total_cost'),
            'estimated_time': quote_data.get('estimated_time'),
            'breakdown': quote_data.get('breakdown', [])
        }
        
        success = email_service.send_construction_quote_email(
            client_data.get('client_email'),
            client_data.get('client_name'),
            email_data
        )
        
        if success:
            logger.info("✅ Email de cotización enviado exitosamente")
        else:
            logger.error("❌ Error enviando email de cotización")
            
    except Exception as e:
        logger.error(f"❌ Error enviando email: {e}")
