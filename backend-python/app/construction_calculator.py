"""
Calculadora de Construcción Simplificada
Basada en la lógica exitosa del cotizador solar
"""

import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ConstructionCalculator:
    def __init__(self):
        self.logger = logger
        self.logger.info("🏗️ Inicializando Calculadora de Construcción...")
        
        # Precios base por m² según tipo de construcción (USD)
        self.base_prices = {
            'steel-frame': {
                'residencial': {'basico': 800, 'estandar': 1200, 'premium': 1600},
                'comercial': {'basico': 900, 'estandar': 1300, 'premium': 1700},
                'industrial': {'basico': 700, 'estandar': 1000, 'premium': 1400}
            },
            'industrial': {
                'residencial': {'basico': 600, 'estandar': 900, 'premium': 1200},
                'comercial': {'basico': 700, 'estandar': 1000, 'premium': 1300},
                'industrial': {'basico': 500, 'estandar': 800, 'premium': 1100}
            },
            'contenedor': {
                'residencial': {'basico': 400, 'estandar': 600, 'premium': 800},
                'comercial': {'basico': 500, 'estandar': 700, 'premium': 900},
                'industrial': {'basico': 350, 'estandar': 550, 'premium': 750}
            },
            'mixto': {
                'residencial': {'basico': 700, 'estandar': 1050, 'premium': 1400},
                'comercial': {'basico': 800, 'estandar': 1150, 'premium': 1500},
                'industrial': {'basico': 600, 'estandar': 900, 'premium': 1250}
            }
        }
        
        # Multiplicadores por ubicación
        self.location_multipliers = {
            'buenos-aires': 1.2,
            'ciudad-autonoma-buenos-aires': 1.3,
            'cordoba': 1.1,
            'santa-fe': 1.1,
            'mendoza': 1.0,
            'tucuman': 0.9,
            'salta': 0.9,
            'jujuy': 0.9,
            'chaco': 0.8,
            'formosa': 0.8,
            'misiones': 0.9,
            'corrientes': 0.9,
            'entre-rios': 1.0,
            'la-pampa': 0.9,
            'rio-negro': 0.9,
            'neuquen': 1.0,
            'chubut': 0.9,
            'santa-cruz': 0.8,
            'tierra-del-fuego': 1.1,
            'catamarca': 0.9,
            'la-rioja': 0.9,
            'san-juan': 0.9,
            'san-luis': 0.9,
            'santiago-del-estero': 0.9
        }
        
        # Tiempos estimados por tipo (meses)
        self.construction_times = {
            'steel-frame': {'basico': 2, 'estandar': 3, 'premium': 4},
            'industrial': {'basico': 1.5, 'estandar': 2.5, 'premium': 3.5},
            'contenedor': {'basico': 1, 'estandar': 1.5, 'premium': 2},
            'mixto': {'basico': 2.5, 'estandar': 3.5, 'premium': 4.5}
        }
        
        self.logger.info("✅ Calculadora de Construcción inicializada")

    def calculate_quick_estimate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula una estimación rápida basada en parámetros estándar
        Similar a la estimación rápida del cotizador solar
        """
        try:
            self.logger.info("⚡ Calculando estimación rápida...")
            
            # Extraer datos
            construction_type = data.get('construction_type', 'steel-frame')
            usage_type = data.get('usage_type', 'residencial')
            finish_level = data.get('finish_level', 'estandar')
            square_meters = data.get('square_meters', 100)
            floors = data.get('floors', 1)
            location = data.get('location', 'mendoza')
            
            # Calcular precio base
            base_price_per_m2 = self.base_prices.get(construction_type, {}).get(usage_type, {}).get(finish_level, 1000)
            
            # Aplicar multiplicador de ubicación
            location_multiplier = self.location_multipliers.get(location, 1.0)
            
            # Calcular costo base
            base_cost = square_meters * base_price_per_m2 * location_multiplier
            
            # Aplicar multiplicador por pisos (cada piso adicional aumenta el costo)
            floor_multiplier = 1 + (floors - 1) * 0.3
            
            # Calcular costo total
            total_cost = base_cost * floor_multiplier
            
            # Calcular tiempo estimado
            estimated_months = self.construction_times.get(construction_type, {}).get(finish_level, 3)
            estimated_time = f"{estimated_months} mes{'es' if estimated_months > 1 else ''}"
            
            # Preparar resultado
            result = {
                'area': f"{square_meters} m²",
                'construction_type': self._format_construction_type(construction_type),
                'usage_type': self._format_usage_type(usage_type),
                'finish_level': self._format_finish_level(finish_level),
                'floors': floors,
                'location': self._format_location(location),
                'estimated_cost': f"U$D {total_cost:,.0f}",
                'estimated_time': estimated_time,
                'base_price_per_m2': f"U$D {base_price_per_m2:,.0f}/m²",
                'location_multiplier': f"{location_multiplier:.1f}x",
                'floor_multiplier': f"{floor_multiplier:.1f}x"
            }
            
            self.logger.info(f"✅ Estimación rápida calculada: ${total_cost:,.0f}")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error calculando estimación rápida: {e}")
            raise

    def calculate_detailed_quote(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula una cotización detallada con desglose de costos
        Similar a la cotización completa del cotizador solar
        """
        try:
            self.logger.info("📋 Calculando cotización detallada...")
            
            # Obtener estimación rápida como base
            quick_estimate = self.calculate_quick_estimate(data)
            
            # Extraer datos
            construction_type = data.get('construction_type', 'steel-frame')
            usage_type = data.get('usage_type', 'residencial')
            finish_level = data.get('finish_level', 'estandar')
            square_meters = data.get('square_meters', 100)
            floors = data.get('floors', 1)
            location = data.get('location', 'mendoza')
            
            # Calcular desglose de costos
            breakdown = self._calculate_cost_breakdown(data)
            
            # Calcular costos adicionales
            additional_costs = self._calculate_additional_costs(data)
            
            # Calcular total
            base_cost = self._extract_numeric_cost(quick_estimate['estimated_cost'])
            total_cost = base_cost + additional_costs
            
            # Preparar resultado detallado
            result = {
                'client_name': data.get('client_name', 'Cliente'),
                'client_email': data.get('client_email', ''),
                'client_phone': data.get('client_phone', ''),
                'construction_type': self._format_construction_type(construction_type),
                'usage_type': self._format_usage_type(usage_type),
                'finish_level': self._format_finish_level(finish_level),
                'area': f"{square_meters} m²",
                'floors': floors,
                'location': self._format_location(location),
                'total_cost': f"U$D {total_cost:,.0f}",
                'estimated_time': quick_estimate['estimated_time'],
                'breakdown': breakdown,
                'additional_costs': f"U$D {additional_costs:,.0f}",
                'base_cost': f"U$D {base_cost:,.0f}",
                'quote_date': datetime.now().strftime('%d/%m/%Y'),
                'valid_until': (datetime.now() + timedelta(days=30)).strftime('%d/%m/%Y')
            }
            
            self.logger.info(f"✅ Cotización detallada calculada: ${total_cost:,.0f}")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error calculando cotización detallada: {e}")
            raise

    def _calculate_cost_breakdown(self, data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Calcula el desglose de costos por categoría"""
        construction_type = data.get('construction_type', 'steel-frame')
        usage_type = data.get('usage_type', 'residencial')
        finish_level = data.get('finish_level', 'estandar')
        square_meters = data.get('square_meters', 100)
        floors = data.get('floors', 1)
        location = data.get('location', 'mendoza')
        
        # Obtener precio base
        base_price_per_m2 = self.base_prices.get(construction_type, {}).get(usage_type, {}).get(finish_level, 1000)
        location_multiplier = self.location_multipliers.get(location, 1.0)
        
        # Calcular costos por categoría
        breakdown = []
        
        # Estructura básica
        structure_cost = square_meters * base_price_per_m2 * 0.4 * location_multiplier
        breakdown.append({
            'category': 'Estructura Básica',
            'cost': f"U$D {structure_cost:,.0f}",
            'percentage': '40%'
        })
        
        # Materiales
        materials_cost = square_meters * base_price_per_m2 * 0.3 * location_multiplier
        breakdown.append({
            'category': 'Materiales',
            'cost': f"U$D {materials_cost:,.0f}",
            'percentage': '30%'
        })
        
        # Mano de obra
        labor_cost = square_meters * base_price_per_m2 * 0.2 * location_multiplier
        breakdown.append({
            'category': 'Mano de Obra',
            'cost': f"U$D {labor_cost:,.0f}",
            'percentage': '20%'
        })
        
        # Instalaciones
        installations_cost = square_meters * base_price_per_m2 * 0.1 * location_multiplier
        breakdown.append({
            'category': 'Instalaciones',
            'cost': f"U$D {installations_cost:,.0f}",
            'percentage': '10%'
        })
        
        return breakdown

    def _calculate_additional_costs(self, data: Dict[str, Any]) -> float:
        """Calcula costos adicionales"""
        floors = data.get('floors', 1)
        square_meters = data.get('square_meters', 100)
        
        # Costo adicional por piso extra
        additional_floors = max(0, floors - 1)
        floor_cost = additional_floors * square_meters * 200  # U$D 200/m² por piso adicional
        
        # Costos de permisos y gestión (5% del costo base)
        base_cost = square_meters * 1000  # Estimación conservadora
        permits_cost = base_cost * 0.05
        
        return floor_cost + permits_cost

    def _extract_numeric_cost(self, cost_str: str) -> float:
        """Extrae el valor numérico de una cadena de costo"""
        try:
            # Remover "U$D " y comas
            clean_str = cost_str.replace('U$D ', '').replace(',', '')
            return float(clean_str)
        except:
            return 0.0

    def _format_construction_type(self, construction_type: str) -> str:
        """Formatea el tipo de construcción para mostrar"""
        formats = {
            'steel-frame': 'Steel Frame',
            'industrial': 'Industrial',
            'contenedor': 'Contenedor Marítimo',
            'mixto': 'Sistema Mixto'
        }
        return formats.get(construction_type, construction_type.title())

    def _format_usage_type(self, usage_type: str) -> str:
        """Formatea el tipo de uso para mostrar"""
        formats = {
            'residencial': 'Residencial',
            'comercial': 'Comercial',
            'industrial': 'Industrial'
        }
        return formats.get(usage_type, usage_type.title())

    def _format_finish_level(self, finish_level: str) -> str:
        """Formatea el nivel de terminación para mostrar"""
        formats = {
            'basico': 'Básico',
            'estandar': 'Estándar',
            'premium': 'Premium'
        }
        return formats.get(finish_level, finish_level.title())

    def _format_location(self, location: str) -> str:
        """Formatea la ubicación para mostrar"""
        formats = {
            'buenos-aires': 'Buenos Aires',
            'ciudad-autonoma-buenos-aires': 'Ciudad Autónoma de Buenos Aires',
            'cordoba': 'Córdoba',
            'santa-fe': 'Santa Fe',
            'mendoza': 'Mendoza',
            'tucuman': 'Tucumán',
            'salta': 'Salta',
            'jujuy': 'Jujuy',
            'chaco': 'Chaco',
            'formosa': 'Formosa',
            'misiones': 'Misiones',
            'corrientes': 'Corrientes',
            'entre-rios': 'Entre Ríos',
            'la-pampa': 'La Pampa',
            'rio-negro': 'Río Negro',
            'neuquen': 'Neuquén',
            'chubut': 'Chubut',
            'santa-cruz': 'Santa Cruz',
            'tierra-del-fuego': 'Tierra del Fuego',
            'catamarca': 'Catamarca',
            'la-rioja': 'La Rioja',
            'san-juan': 'San Juan',
            'san-luis': 'San Luis',
            'santiago-del-estero': 'Santiago del Estero'
        }
        return formats.get(location, location.replace('-', ' ').title())
