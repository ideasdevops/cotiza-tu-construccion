from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import uvicorn
import logging
from typing import List, Dict, Any
import json

from .models import (
    CotizacionRequest, CotizacionResponse, Material, 
    PrecioMaterial, CalculoCostos
)
from .calculator import ConstructionCalculator
from .price_service import PriceService

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear instancia de FastAPI
app = FastAPI(
    title="Cotizador de Construcción API",
    description="API para cotización de construcciones steel frame e industriales",
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
        "message": "Cotizador de Construcción API",
        "version": "1.0.0",
        "status": "activo"
    }

@app.get("/health")
async def health_check():
    """Verificación de salud de la API"""
    return {"status": "healthy", "service": "cotizador_construccion"}

@app.post("/cotizar", response_model=CotizacionResponse)
async def crear_cotizacion(request: CotizacionRequest):
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
        
        logger.info(f"Cotización creada exitosamente. ID: {cotizacion.id}")
        
        return cotizacion
        
    except ValidationError as e:
        logger.error(f"Error de validación: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error interno: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

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

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
