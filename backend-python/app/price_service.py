import aiohttp
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import os
from .models import PrecioMaterial, Material

class PriceService:
    """Servicio para obtener precios de materiales de construcción en Argentina"""
    
    def __init__(self):
        self.base_urls = {
            "indec": "https://www.indec.gob.ar/api/v1/",
            "camara_construccion": "https://api.camaraconstruccion.com.ar/",
            "precios_ar": "https://api.preciosar.com.ar/"
        }
        self.cache = {}
        self.cache_expiry = {}
        self.cache_duration = timedelta(hours=24)
        
        # Precios base por defecto (en caso de fallo de APIs)
        self.precios_base = {
            "acero_estructural": {"precio": 1500, "unidad": "kg", "categoria": "estructura"},
            "perfil_steel_frame": {"precio": 800, "unidad": "m2", "categoria": "estructura"},
            "hierro_redondo": {"precio": 1200, "unidad": "kg", "categoria": "estructura"},
            "chapa_acanalada": {"precio": 450, "unidad": "m2", "categoria": "cubierta"},
            "lana_mineral": {"precio": 120, "unidad": "m2", "categoria": "aislamiento"},
            "placa_yeso": {"precio": 180, "unidad": "m2", "categoria": "interior"},
            "pintura_interior": {"precio": 85, "unidad": "m2", "categoria": "terminacion"},
            "pintura_exterior": {"precio": 120, "unidad": "m2", "categoria": "terminacion"},
            "ceramica": {"precio": 350, "unidad": "m2", "categoria": "terminacion"},
            "porcelanato": {"precio": 650, "unidad": "m2", "categoria": "terminacion"}
        }
    
    async def get_material_price(self, material: str) -> Optional[PrecioMaterial]:
        """Obtiene el precio de un material específico"""
        # Verificar cache
        if material in self.cache:
            if datetime.now() < self.cache_expiry.get(material, datetime.min):
                return self.cache[material]
        
        try:
            # Intentar obtener precio de APIs externas
            precio = await self._fetch_from_apis(material)
            if precio:
                self.cache[material] = precio
                self.cache_expiry[material] = datetime.now() + self.cache_duration
                return precio
        except Exception as e:
            print(f"Error obteniendo precio de {material}: {e}")
        
        # Usar precio base si no se puede obtener de APIs
        if material in self.precios_base:
            base_data = self.precios_base[material]
            return PrecioMaterial(
                material=material,
                precio_por_m2=base_data["precio"],
                moneda="ARS",
                fecha_actualizacion=datetime.now().isoformat(),
                fuente="precios_base"
            )
        
        return None
    
    async def _fetch_from_apis(self, material: str) -> Optional[PrecioMaterial]:
        """Intenta obtener precios de múltiples APIs"""
        tasks = [
            self._fetch_from_indec(material),
            self._fetch_from_camara_construccion(material),
            self._fetch_from_precios_ar(material)
        ]
        
        # Ejecutar todas las tareas en paralelo
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filtrar resultados exitosos
        valid_results = [r for r in results if isinstance(r, PrecioMaterial)]
        
        if valid_results:
            # Retornar el precio más bajo (mejor para el cliente)
            return min(valid_results, key=lambda x: x.precio_por_m2)
        
        return None
    
    async def _fetch_from_indec(self, material: str) -> Optional[PrecioMaterial]:
        """Obtiene precios del INDEC (Instituto Nacional de Estadística y Censos)"""
        try:
            async with aiohttp.ClientSession() as session:
                # Simular llamada a API del INDEC
                # En producción, usar la API real del INDEC
                await asyncio.sleep(0.1)  # Simular delay de red
                
                # Simular respuesta del INDEC
                if "acero" in material.lower():
                    return PrecioMaterial(
                        material=material,
                        precio_por_m2=1400,
                        moneda="ARS",
                        fecha_actualizacion=datetime.now().isoformat(),
                        fuente="INDEC"
                    )
        except Exception:
            pass
        return None
    
    async def _fetch_from_camara_construccion(self, material: str) -> Optional[PrecioMaterial]:
        """Obtiene precios de la Cámara de Construcción"""
        try:
            async with aiohttp.ClientSession() as session:
                # Simular llamada a API de la Cámara
                await asyncio.sleep(0.1)
                
                # Simular respuesta
                if "perfil" in material.lower():
                    return PrecioMaterial(
                        material=material,
                        precio_por_m2=750,
                        moneda="ARS",
                        fecha_actualizacion=datetime.now().isoformat(),
                        fuente="Cámara Construcción"
                    )
        except Exception:
            pass
        return None
    
    async def _fetch_from_precios_ar(self, material: str) -> Optional[PrecioMaterial]:
        """Obtiene precios de PreciosAR"""
        try:
            async with aiohttp.ClientSession() as session:
                # Simular llamada a API de PreciosAR
                await asyncio.sleep(0.1)
                
                # Simular respuesta
                if "pintura" in material.lower():
                    return PrecioMaterial(
                        material=material,
                        precio_por_m2=90,
                        moneda="ARS",
                        fecha_actualizacion=datetime.now().isoformat(),
                        fuente="PreciosAR"
                    )
        except Exception:
            pass
        return None
    
    def get_all_base_prices(self) -> Dict[str, Material]:
        """Retorna todos los precios base disponibles"""
        return {
            nombre: Material(
                nombre=nombre,
                precio_por_m2=data["precio"],
                unidad=data["unidad"],
                categoria=data["categoria"]
            )
            for nombre, data in self.precios_base.items()
        }
    
    def update_base_price(self, material: str, precio: float, unidad: str, categoria: str):
        """Actualiza un precio base"""
        self.precios_base[material] = {
            "precio": precio,
            "unidad": unidad,
            "categoria": categoria
        }
    
    def get_price_multiplier_by_region(self, provincia: str) -> float:
        """Retorna multiplicador de precio según la región"""
        multipliers = {
            "buenos_aires": 1.0,
            "caba": 1.2,
            "cordoba": 0.9,
            "santa_fe": 0.95,
            "mendoza": 0.85,
            "tucuman": 0.8,
            "salta": 0.75,
            "jujuy": 0.7,
            "chaco": 0.8,
            "formosa": 0.75,
            "misiones": 0.85,
            "corrientes": 0.8,
            "entre_rios": 0.9,
            "la_pampa": 0.85,
            "rio_negro": 0.9,
            "neuquen": 0.95,
            "chubut": 0.9,
            "santa_cruz": 1.1,
            "tierra_del_fuego": 1.3
        }
        
        provincia_normalizada = provincia.lower().replace(" ", "_")
        return multipliers.get(provincia_normalizada, 1.0)
