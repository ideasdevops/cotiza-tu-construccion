from typing import Dict, List, Tuple
from .models import (
    CotizacionRequest, CotizacionResponse, CalculoCostos, 
    Material, TipoConstruccion, TipoUso, NivelTerminacion
)
from .price_service import PriceService
import uuid
from datetime import datetime, timedelta

class ConstructionCalculator:
    """Calculadora de costos para construcción steel frame e industrial"""
    
    def __init__(self):
        self.price_service = PriceService()
        
        # Factores de complejidad por tipo de construcción
        self.complexity_factors = {
            TipoConstruccion.STEEL_FRAME: {
                "estructura": 1.0,
                "aislamiento": 1.2,
                "terminaciones": 1.1,
                "instalaciones": 1.0
            },
            TipoConstruccion.INDUSTRIAL: {
                "estructura": 1.3,
                "aislamiento": 0.8,
                "terminaciones": 0.7,
                "instalaciones": 1.4
            },
            TipoConstruccion.CONTENEDOR: {
                "estructura": 0.8,
                "aislamiento": 1.5,
                "terminaciones": 1.3,
                "instalaciones": 1.2
            },
            TipoConstruccion.MIXTO: {
                "estructura": 1.1,
                "aislamiento": 1.1,
                "terminaciones": 1.0,
                "instalaciones": 1.1
            }
        }
        
        # Factores por tipo de uso
        self.usage_factors = {
            TipoUso.RESIDENCIAL: 1.0,
            TipoUso.INDUSTRIAL: 0.9,
            TipoUso.COMERCIAL: 1.1
        }
        
        # Factores por nivel de terminación
        self.finish_factors = {
            NivelTerminacion.BASICO: 0.7,
            NivelTerminacion.ESTANDAR: 1.0,
            NivelTerminacion.PREMIUM: 1.4
        }
        
        # Costos base por metro cuadrado (ARS)
        self.base_costs = {
            "estructura": 2500,
            "cubierta": 1800,
            "aislamiento": 600,
            "interior": 1200,
            "terminaciones": 800,
            "instalaciones": 1500,
            "transporte": 300,
            "impuestos": 0.21  # 21% IVA
        }
    
    async def calculate_quote(self, request: CotizacionRequest) -> CotizacionResponse:
        """Calcula la cotización completa"""
        
        # Obtener multiplicador regional
        regional_multiplier = self.price_service.get_price_multiplier_by_region(request.provincia)
        
        # Calcular costos base
        costos = await self._calculate_base_costs(request, regional_multiplier)
        
        # Aplicar factores de complejidad
        costos = self._apply_complexity_factors(request, costos)
        
        # Aplicar factores de uso y terminación
        costos = self._apply_usage_and_finish_factors(request, costos)
        
        # Calcular total
        total = costos.total
        
        # Generar ID único
        quote_id = str(uuid.uuid4())
        
        # Obtener materiales utilizados
        materiales = await self._get_materials_used(request)
        
        # Calcular tiempo estimado
        tiempo_estimado = self._calculate_construction_time(request)
        
        # Generar observaciones
        observaciones = self._generate_observations(request, costos)
        
        return CotizacionResponse(
            id=quote_id,
            cliente=request.nombre,
            total_estimado=total,
            moneda="ARS",
            desglose=costos.dict(),
            materiales_utilizados=materiales,
            tiempo_estimado=tiempo_estimado,
            observaciones=observaciones,
            validez_dias=30
        )
    
    async def _calculate_base_costs(self, request: CotizacionRequest, regional_multiplier: float) -> CalculoCostos:
        """Calcula los costos base por metro cuadrado"""
        
        m2 = request.metros_cuadrados
        
        # Estructura
        estructura = self.base_costs["estructura"] * m2 * regional_multiplier
        
        # Cubierta
        cubierta = self.base_costs["cubierta"] * m2 * regional_multiplier
        
        # Aislamiento
        aislamiento = self.base_costs["aislamiento"] * m2 * regional_multiplier
        
        # Interior
        interior = self.base_costs["interior"] * m2 * regional_multiplier
        
        # Terminaciones
        terminaciones = self.base_costs["terminaciones"] * m2 * regional_multiplier
        
        # Instalaciones
        instalaciones = self.base_costs["instalaciones"] * m2 * regional_multiplier
        
        # Transporte (fijo por proyecto)
        transporte = self.base_costs["transporte"] * regional_multiplier
        
        # Subtotal antes de impuestos
        subtotal = estructura + cubierta + aislamiento + interior + terminaciones + instalaciones + transporte
        
        # Impuestos
        impuestos = subtotal * self.base_costs["impuestos"]
        
        return CalculoCostos(
            materiales=estructura + cubierta + aislamiento + interior,
            mano_obra=terminaciones + instalaciones,
            terminaciones=terminaciones,
            instalaciones=instalaciones,
            transporte=transporte,
            impuestos=impuestos,
            total=subtotal + impuestos
        )
    
    def _apply_complexity_factors(self, request: CotizacionRequest, costos: CalculoCostos) -> CalculoCostos:
        """Aplica factores de complejidad según el tipo de construcción"""
        
        factors = self.complexity_factors[request.tipo_construccion]
        
        # Aplicar factores a cada componente
        costos.materiales *= factors["estructura"]
        costos.terminaciones *= factors["terminaciones"]
        costos.instalaciones *= factors["instalaciones"]
        
        # Recalcular total
        costos.total = costos.materiales + costos.mano_obra + costos.transporte + costos.impuestos
        
        return costos
    
    def _apply_usage_and_finish_factors(self, request: CotizacionRequest, costos: CalculoCostos) -> CalculoCostos:
        """Aplica factores de uso y terminación"""
        
        usage_factor = self.usage_factors[request.tipo_uso]
        finish_factor = self.finish_factors[request.nivel_terminacion]
        
        # Aplicar factores
        costos.terminaciones *= finish_factor
        costos.instalaciones *= usage_factor
        
        # Recalcular total
        costos.total = costos.materiales + costos.mano_obra + costos.transporte + costos.impuestos
        
        return costos
    
    async def _get_materials_used(self, request: CotizacionRequest) -> List[Material]:
        """Obtiene la lista de materiales utilizados"""
        
        materiales = []
        base_prices = self.price_service.get_all_base_prices()
        
        # Seleccionar materiales según el tipo de construcción
        if request.tipo_construccion == TipoConstruccion.STEEL_FRAME:
            materiales.extend([
                base_prices["perfil_steel_frame"],
                base_prices["lana_mineral"],
                base_prices["placa_yeso"]
            ])
        elif request.tipo_construccion == TipoConstruccion.INDUSTRIAL:
            materiales.extend([
                base_prices["acero_estructural"],
                base_prices["hierro_redondo"],
                base_prices["chapa_acanalada"]
            ])
        elif request.tipo_construccion == TipoConstruccion.CONTENEDOR:
            materiales.extend([
                base_prices["acero_estructural"],
                base_prices["lana_mineral"],
                base_prices["placa_yeso"]
            ])
        
        # Agregar terminaciones según nivel
        if request.nivel_terminacion == NivelTerminacion.BASICO:
            materiales.append(base_prices["pintura_interior"])
        elif request.nivel_terminacion == NivelTerminacion.ESTANDAR:
            materiales.extend([
                base_prices["pintura_interior"],
                base_prices["pintura_exterior"]
            ])
        elif request.nivel_terminacion == NivelTerminacion.PREMIUM:
            materiales.extend([
                base_prices["pintura_interior"],
                base_prices["pintura_exterior"],
                base_prices["porcelanato"]
            ])
        
        return materiales
    
    def _calculate_construction_time(self, request: CotizacionRequest) -> str:
        """Calcula el tiempo estimado de construcción"""
        
        # Tiempo base por metro cuadrado (días)
        base_time_per_m2 = 0.5
        
        # Factores adicionales
        if request.pisos > 1:
            base_time_per_m2 *= 1.3
        
        if request.tiene_terraza:
            base_time_per_m2 *= 1.1
        
        if request.tiene_sotano:
            base_time_per_m2 *= 1.2
        
        # Calcular tiempo total
        total_days = int(request.metros_cuadrados * base_time_per_m2)
        
        if total_days < 30:
            return f"{total_days} días"
        elif total_days < 365:
            months = total_days // 30
            return f"{months} meses"
        else:
            years = total_days // 365
            return f"{years} años"
    
    def _generate_observations(self, request: CotizacionRequest, costos: CalculoCostos) -> List[str]:
        """Genera observaciones para la cotización"""
        
        observaciones = []
        
        # Observaciones por tipo de construcción
        if request.tipo_construccion == TipoConstruccion.STEEL_FRAME:
            observaciones.append("Construcción en seco con perfiles de acero galvanizado")
            observaciones.append("Aislamiento térmico y acústico incluido")
        
        elif request.tipo_construccion == TipoConstruccion.INDUSTRIAL:
            observaciones.append("Estructura industrial con hierros estructurales")
            observaciones.append("Cubierta con chapa acanalada galvanizada")
        
        elif request.tipo_construccion == TipoConstruccion.CONTENEDOR:
            observaciones.append("Conversión de contenedor marítimo estándar")
            observaciones.append("Aislamiento térmico reforzado")
        
        # Observaciones por nivel de terminación
        if request.nivel_terminacion == NivelTerminacion.PREMIUM:
            observaciones.append("Terminaciones premium con materiales de alta calidad")
        
        # Observaciones por ubicación
        if request.provincia.lower() in ["buenos_aires", "caba"]:
            observaciones.append("Precios ajustados para región metropolitana")
        
        # Observaciones generales
        observaciones.append("Cotización válida por 30 días")
        observaciones.append("Incluye materiales, mano de obra e instalaciones")
        observaciones.append("No incluye cimientos ni conexiones de servicios")
        
        return observaciones
    
    async def get_cost_breakdown(self, request: CotizacionRequest) -> Dict[str, float]:
        """Retorna el desglose detallado de costos"""
        
        # Calcular costos base
        costos = await self._calculate_base_costs(request, 1.0)
        
        # Aplicar todos los factores
        costos = self._apply_complexity_factors(request, costos)
        costos = self._apply_usage_and_finish_factors(request, costos)
        
        return {
            "materiales": round(costos.materiales, 2),
            "mano_obra": round(costos.mano_obra, 2),
            "transporte": round(costos.transporte, 2),
            "impuestos": round(costos.impuestos, 2),
            "total": round(costos.total, 2)
        }
