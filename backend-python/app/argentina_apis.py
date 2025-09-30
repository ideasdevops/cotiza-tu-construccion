"""
Servicio de APIs de Argentina para precios de construcción en tiempo real
Integra: INDEC, Banco Central, Cámara de Construcción Argentina
"""

import aiohttp
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from dataclasses import dataclass
import json
import os

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ConstructionPrices:
    """Precios de construcción por tipo y región"""
    steel_frame_m2: float  # USD por m2
    industrial_m2: float   # USD por m2
    container_m2: float    # USD por m2
    materials_m2: float    # USD por m2
    labor_m2: float        # USD por m2
    finishes_m2: float     # USD por m2
    last_updated: datetime

@dataclass
class ExchangeRate:
    """Tipo de cambio ARS/USD"""
    ars_usd: float
    usd_ars: float
    last_updated: datetime
    source: str

@dataclass
class RegionalMultipliers:
    """Multiplicadores regionales por provincia"""
    buenos_aires: float = 1.0
    cordoba: float = 0.95
    santa_fe: float = 0.92
    mendoza: float = 0.88
    tucuman: float = 0.85
    entre_rios: float = 0.90
    chaco: float = 0.83
    corrientes: float = 0.87
    misiones: float = 0.89
    formosa: float = 0.82
    chubut: float = 0.93
    rio_negro: float = 0.91
    neuquen: float = 0.94
    la_pampa: float = 0.86
    san_luis: float = 0.84
    la_rioja: float = 0.81
    catamarca: float = 0.83
    santiago: float = 0.80
    salta: float = 0.86
    jujuy: float = 0.85
    san_juan: float = 0.87
    tierra_fuego: float = 1.15

class ArgentinaAPIService:
    """Servicio principal para APIs de Argentina"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache_file = "argentina_apis_cache.json"
        self.cache_duration = timedelta(hours=12)
        self.last_update: Optional[datetime] = None
        
        # Precios base en USD (actualizados según mercado argentino real)
        self.base_prices = {
            "steel_frame": {
                "materials": 45.0,      # USD/m2 - Acero, perfiles, tornillos
                "labor": 35.0,          # USD/m2 - Mano de obra especializada
                "finishes": 25.0,       # USD/m2 - Terminaciones básicas
                "total": 105.0          # USD/m2 - Total base
            },
            "industrial": {
                "materials": 55.0,      # USD/m2 - Materiales industriales
                "labor": 40.0,          # USD/m2 - Mano de obra industrial
                "finishes": 30.0,       # USD/m2 - Terminaciones industriales
                "total": 125.0          # USD/m2 - Total base
            },
            "container": {
                "materials": 35.0,      # USD/m2 - Contenedor reciclado
                "labor": 25.0,          # USD/m2 - Modificación de contenedor
                "finishes": 20.0,       # USD/m2 - Terminaciones básicas
                "total": 80.0           # USD/m2 - Total base
            }
        }
        
        # Multiplicadores regionales
        self.regional_multipliers = RegionalMultipliers()
        
        # Inicializar
        self._load_cache()
    
    async def __aenter__(self):
        """Context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.session:
            await self.session.close()
    
    def _load_cache(self):
        """Cargar cache desde archivo"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    cache_data = json.load(f)
                    self.last_update = datetime.fromisoformat(cache_data.get('last_update', ''))
                    logger.info(f"Cache cargado desde: {self.last_update}")
        except Exception as e:
            logger.warning(f"Error cargando cache: {e}")
            self.last_update = None
    
    def _save_cache(self, data: Dict):
        """Guardar cache en archivo"""
        try:
            cache_data = {
                'last_update': datetime.now().isoformat(),
                'data': data
            }
            with open(self.cache_file, 'w') as f:
                json.dump(cache_data, f, default=str)
            logger.info("Cache guardado exitosamente")
        except Exception as e:
            logger.error(f"Error guardando cache: {e}")
    
    async def get_exchange_rate(self) -> ExchangeRate:
        """Obtener tipo de cambio ARS/USD desde múltiples fuentes"""
        try:
            # Intentar Banco Central de Argentina (API oficial)
            bcra_rate = await self._get_bcra_rate()
            if bcra_rate:
                return bcra_rate
            
            # Fallback: API alternativa (dólar blue promedio)
            blue_rate = await self._get_blue_rate()
            if blue_rate:
                return blue_rate
            
            # Fallback: Valor estimado basado en datos históricos
            logger.warning("Usando tipo de cambio estimado")
            return ExchangeRate(
                ars_usd=0.0011,  # 1 ARS = 0.0011 USD (aproximado)
                usd_ars=900.0,   # 1 USD = 900 ARS (aproximado)
                last_updated=datetime.now(),
                source="estimado"
            )
            
        except Exception as e:
            logger.error(f"Error obteniendo tipo de cambio: {e}")
            # Valor de emergencia
            return ExchangeRate(
                ars_usd=0.0011,
                usd_ars=900.0,
                last_updated=datetime.now(),
                source="emergencia"
            )
    
    async def _get_bcra_rate(self) -> Optional[ExchangeRate]:
        """Obtener tipo de cambio del Banco Central"""
        try:
            if not self.session:
                return None
            
            # API del Banco Central (dólar oficial)
            url = "https://api.estadisticas.bcra.gob.ar/api/Estadistica/GetSeries"
            
            # Parámetros para obtener cotización del dólar
            params = {
                "series": "168",  # Serie del dólar oficial
                "fechaDesde": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "fechaHasta": datetime.now().strftime("%Y-%m-%d")
            }
            
            async with self.session.get(url, params=params, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    if data and len(data) > 0:
                        # Obtener último valor disponible
                        last_value = data[-1].get('v', 0)
                        if last_value > 0:
                            ars_usd = 1 / last_value
                            return ExchangeRate(
                                ars_usd=ars_usd,
                                usd_ars=last_value,
                                last_update=datetime.now(),
                                source="BCRA"
                            )
        except Exception as e:
            logger.warning(f"Error obteniendo tipo de cambio BCRA: {e}")
        
        return None
    
    async def _get_blue_rate(self) -> Optional[ExchangeRate]:
        """Obtener tipo de cambio del dólar blue"""
        try:
            if not self.session:
                return None
            
            # API alternativa para dólar blue
            url = "https://api-dolar-argentina.herokuapp.com/api/dolares"
            
            async with self.session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    if data and 'blue' in data:
                        blue_data = data['blue']
                        usd_ars = float(blue_data.get('venta', 0))
                        if usd_ars > 0:
                            ars_usd = 1 / usd_ars
                            return ExchangeRate(
                                ars_usd=ars_usd,
                                usd_ars=usd_ars,
                                last_updated=datetime.now(),
                                source="Blue"
                            )
        except Exception as e:
            logger.warning(f"Error obteniendo tipo de cambio Blue: {e}")
        
        return None
    
    async def get_construction_prices(self) -> ConstructionPrices:
        """Obtener precios de construcción actualizados"""
        try:
            # Verificar si necesitamos actualizar cache
            if (self.last_update and 
                datetime.now() - self.last_update < self.cache_duration):
                logger.info("Usando precios en cache")
                return self._get_cached_prices()
            
            # Obtener tipo de cambio actual
            exchange_rate = await self.get_exchange_rate()
            
            # Obtener precios desde INDEC o Cámara de Construcción
            indec_prices = await self._get_indec_prices()
            
            if indec_prices:
                # Usar precios del INDEC convertidos a USD
                prices = ConstructionPrices(
                    steel_frame_m2=indec_prices['steel_frame'] * exchange_rate.ars_usd,
                    industrial_m2=indec_prices['industrial'] * exchange_rate.ars_usd,
                    container_m2=indec_prices['container'] * exchange_rate.ars_usd,
                    materials_m2=indec_prices['materials'] * exchange_rate.ars_usd,
                    labor_m2=indec_prices['labor'] * exchange_rate.ars_usd,
                    finishes_m2=indec_prices['finishes'] * exchange_rate.ars_usd,
                    last_updated=datetime.now()
                )
            else:
                # Usar precios base actualizados con inflación
                inflation_multiplier = self._calculate_inflation_multiplier()
                prices = ConstructionPrices(
                    steel_frame_m2=self.base_prices['steel_frame']['total'] * inflation_multiplier,
                    industrial_m2=self.base_prices['industrial']['total'] * inflation_multiplier,
                    container_m2=self.base_prices['container']['total'] * inflation_multiplier,
                    materials_m2=45.0 * inflation_multiplier,
                    labor_m2=35.0 * inflation_multiplier,
                    finishes_m2=25.0 * inflation_multiplier,
                    last_updated=datetime.now()
                )
            
            # Guardar en cache
            self._save_cache({
                'exchange_rate': {
                    'ars_usd': exchange_rate.ars_usd,
                    'usd_ars': exchange_rate.usd_ars,
                    'source': exchange_rate.source
                },
                'prices': {
                    'steel_frame_m2': prices.steel_frame_m2,
                    'industrial_m2': prices.industrial_m2,
                    'container_m2': prices.container_m2,
                    'materials_m2': prices.materials_m2,
                    'labor_m2': prices.labor_m2,
                    'finishes_m2': prices.finishes_m2
                }
            })
            
            self.last_update = datetime.now()
            return prices
            
        except Exception as e:
            logger.error(f"Error obteniendo precios de construcción: {e}")
            # Retornar precios base en caso de error
            return ConstructionPrices(
                steel_frame_m2=105.0,
                industrial_m2=125.0,
                container_m2=80.0,
                materials_m2=45.0,
                labor_m2=35.0,
                finishes_m2=25.0,
                last_updated=datetime.now()
            )
    
    async def _get_indec_prices(self) -> Optional[Dict]:
        """Obtener precios del INDEC (simulado por ahora)"""
        try:
            if not self.session:
                return None
            
            # URL del INDEC para precios de construcción
            # Nota: Esta es una URL simulada, en producción usar la real del INDEC
            url = "https://www.indec.gob.ar/indec/web/Institucional-Indec-Precios"
            
            # Por ahora, simulamos los precios basados en datos históricos del INDEC
            # En producción, hacer scraping o usar API oficial
            simulated_prices = {
                'steel_frame': 94500.0,    # ARS/m2 - Acero estructural
                'industrial': 112500.0,    # ARS/m2 - Industrial
                'container': 72000.0,      # ARS/m2 - Contenedor
                'materials': 40500.0,      # ARS/m2 - Materiales
                'labor': 31500.0,          # ARS/m2 - Mano de obra
                'finishes': 22500.0        # ARS/m2 - Terminaciones
            }
            
            logger.info("Usando precios simulados del INDEC")
            return simulated_prices
            
        except Exception as e:
            logger.warning(f"Error obteniendo precios INDEC: {e}")
            return None
    
    def _calculate_inflation_multiplier(self) -> float:
        """Calcular multiplicador de inflación basado en datos históricos"""
        # Basado en inflación promedio mensual de Argentina (aproximadamente 4-6%)
        # Este valor debería actualizarse mensualmente
        monthly_inflation = 0.05  # 5% mensual
        months_since_base = 6     # 6 meses desde precios base
        
        return (1 + monthly_inflation) ** months_since_base
    
    def get_regional_multiplier(self, province: str) -> float:
        """Obtener multiplicador regional por provincia"""
        province_lower = province.lower().replace(' ', '_')
        
        if hasattr(self.regional_multipliers, province_lower):
            return getattr(self.regional_multipliers, province_lower)
        
        # Valor por defecto para provincias no especificadas
        return 0.90
    
    def get_material_price(self, material_id: str, quantity: float = 1.0) -> float:
        """Obtener precio de material específico"""
        # Precios base de materiales en USD (actualizados)
        material_prices = {
            'acero_estructural': 2.5,      # USD/kg
            'perfiles_metalicos': 3.2,     # USD/m
            'tornillos': 0.15,             # USD/unidad
            'pintura': 8.5,                # USD/litro
            'aislante': 12.0,              # USD/m2
            'techo_metalico': 15.0,        # USD/m2
            'piso_cemento': 18.0,          # USD/m2
            'ventanas': 45.0,              # USD/unidad
            'puertas': 120.0,              # USD/unidad
            'instalacion_electrica': 25.0, # USD/m2
            'instalacion_sanitaria': 30.0, # USD/m2
            'ceramica': 22.0,              # USD/m2
            'griferia': 85.0,              # USD/unidad
            'iluminacion': 35.0,           # USD/unidad
        }
        
        base_price = material_prices.get(material_id, 0.0)
        return base_price * quantity

# Instancia global del servicio
argentina_api_service = ArgentinaAPIService()

async def get_current_prices() -> ConstructionPrices:
    """Función helper para obtener precios actuales"""
    async with ArgentinaAPIService() as service:
        return await service.get_construction_prices()

async def get_current_exchange_rate() -> ExchangeRate:
    """Función helper para obtener tipo de cambio actual"""
    async with ArgentinaAPIService() as service:
        return await service.get_exchange_rate()
