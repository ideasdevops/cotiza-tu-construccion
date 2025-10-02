"""
Servicio de Nocodb para Cotizador de Construcción
Guarda los datos de los clientes en la base de datos
"""

import aiohttp
import asyncio
import logging
from typing import Dict, Any, Optional
from .config import settings

logger = logging.getLogger(__name__)

class NocodbService:
    def __init__(self):
        # Usar nuevas variables primero, fallback a legacy
        self.base_url = getattr(settings, 'NC_DB_URL', settings.NOCODB_URL)
        self.token = getattr(settings, 'NC_TOKEN', settings.NOCODB_TOKEN)
        self.base_id = getattr(settings, 'NC_DB_ID', settings.NOCODB_BASE_ID)
        self.table_id = settings.NOCODB_TABLE_ID
        self.api_url = f"{self.base_url}/api/v1/db/data/v1/{self.base_id}/{self.table_id}"
        
        logger.info(f"🔗 NocoDB configurado:")
        logger.info(f"   URL: {self.base_url}")
        logger.info(f"   Token: {self.token[:10]}...")
        logger.info(f"   Base ID: {self.base_id}")
        logger.info(f"   Table ID: {self.table_id}")
        logger.info(f"   API URL: {self.api_url}")
        
        self.headers = {
            "xc-token": self.token,
            "Content-Type": "application/json"
        }
    
    async def save_customer_data(self, customer_data: Dict[str, Any]) -> bool:
        """
        Guarda los datos del cliente en Nocodb
        """
        try:
            logger.info(f"🔄 Intentando guardar cliente en NocoDB: {customer_data.get('nombre', 'Sin nombre')}")
            logger.info(f"📊 URL de API: {self.api_url}")
            logger.info(f"🔑 Token: {self.token[:10]}...")
            
            # Preparar datos para Nocodb
            nocodb_data = {
                "Fecha": customer_data.get("fecha", ""),
                "Nombre": customer_data.get("nombre", ""),
                "Email": customer_data.get("email", ""),
                "# Whatsapp": customer_data.get("whatsapp", ""),
                "Tipo_Construccion": customer_data.get("tipo_construccion", ""),
                "Metros_Cuadrados": customer_data.get("metros_cuadrados", 0),
                "Provincia": customer_data.get("provincia", ""),
                "Pisos": customer_data.get("pisos", 1),
                "Uso": customer_data.get("uso", ""),
                "Terminaciones": customer_data.get("terminaciones", ""),
                "Total_Cotizacion": customer_data.get("total_cotizacion", 0),
                "Materiales_Seleccionados": str(customer_data.get("materiales", [])),
                "Observaciones": customer_data.get("observaciones", ""),
                "Estado": "Nuevo"
            }
            
            logger.info(f"📝 Datos preparados para NocoDB: {nocodb_data}")
            
            async with aiohttp.ClientSession() as session:
                logger.info(f"🌐 Enviando POST a: {self.api_url}")
                logger.info(f"📋 Headers: {self.headers}")
                
                async with session.post(
                    self.api_url,
                    json=nocodb_data,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    
                    logger.info(f"📡 Respuesta recibida: {response.status}")
                    
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"✅ Cliente guardado exitosamente en NocoDB: {result}")
                        return True
                    elif response.status == 401:
                        logger.error("❌ Error de autenticación en NocoDB - Token inválido")
                        return False
                    elif response.status == 404:
                        logger.error("❌ Tabla no encontrada en NocoDB - Verificar base_id y table_id")
                        return False
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Error guardando en NocoDB: {response.status} - {error_text}")
                        logger.error(f"📋 Headers de respuesta: {dict(response.headers)}")
                        return False
                        
        except aiohttp.ClientError as e:
            logger.error(f"🌐 Error de conexión con NocoDB: {e}")
            return False
        except asyncio.TimeoutError:
            logger.error("⏰ Timeout en conexión con NocoDB")
            return False
        except Exception as e:
            logger.error(f"❌ Error inesperado en servicio NocoDB: {e}")
            return False
    
    async def save_contact_form(self, contact_data: Dict[str, Any]) -> bool:
        """
        Guarda los datos del formulario de contacto
        """
        try:
            nocodb_data = {
                "Fecha": contact_data.get("fecha", ""),
                "Nombre": contact_data.get("nombre", ""),
                "Email": contact_data.get("email", ""),
                "# Whatsapp": contact_data.get("whatsapp", ""),
                "Mensaje": contact_data.get("mensaje", ""),
                "Tipo": "Contacto",
                "Estado": "Nuevo"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    json=nocodb_data,
                    headers=self.headers
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Contacto guardado en Nocodb: {result.get('Id')}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"Error guardando contacto en Nocodb: {response.status} - {error_text}")
                        return False
                        
        except Exception as e:
            logger.error(f"Error guardando contacto en Nocodb: {e}")
            return False
    
    async def get_customers(self, limit: int = 100) -> Optional[list]:
        """
        Obtiene la lista de clientes desde Nocodb
        """
        try:
            params = {
                "limit": limit,
                "sort": "-Fecha"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.api_url,
                    params=params,
                    headers=self.headers
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        return result.get("list", [])
                    else:
                        error_text = await response.text()
                        logger.error(f"Error obteniendo clientes: {response.status} - {error_text}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error obteniendo clientes: {e}")
            return None
    
    async def update_customer_status(self, customer_id: int, status: str) -> bool:
        """
        Actualiza el estado de un cliente
        """
        try:
            update_data = {"Estado": status}
            
            async with aiohttp.ClientSession() as session:
                async with session.patch(
                    f"{self.api_url}/{customer_id}",
                    json=update_data,
                    headers=self.headers
                ) as response:
                    
                    if response.status == 200:
                        logger.info(f"Estado del cliente {customer_id} actualizado a: {status}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"Error actualizando estado: {response.status} - {error_text}")
                        return False
                        
        except Exception as e:
            logger.error(f"Error actualizando estado del cliente: {e}")
            return False

# Instancia global del servicio de Nocodb
nocodb_service = NocodbService()
