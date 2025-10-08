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
        
        # Tablas específicas
        self.contactos_table_id = settings.NOCODB_CONTACTOS_TABLE_ID
        self.cotizaciones_table_id = settings.NOCODB_COTIZACIONES_TABLE_ID
        
        # URLs para cada tabla
        self.contactos_api_url = f"{self.base_url}/api/v1/db/data/v1/{self.base_id}/{self.contactos_table_id}"
        self.cotizaciones_api_url = f"{self.base_url}/api/v1/db/data/v1/{self.base_id}/{self.cotizaciones_table_id}"
        
        logger.info(f"🔗 NocoDB configurado:")
        logger.info(f"   URL: {self.base_url}")
        logger.info(f"   Token: {self.token[:10]}...")
        logger.info(f"   Base ID: {self.base_id}")
        logger.info(f"   Contactos Table ID: {self.contactos_table_id}")
        logger.info(f"   Cotizaciones Table ID: {self.cotizaciones_table_id}")
        logger.info(f"   Contactos API URL: {self.contactos_api_url}")
        logger.info(f"   Cotizaciones API URL: {self.cotizaciones_api_url}")
        
        self.headers = {
            "xc-token": self.token,
            "Content-Type": "application/json"
        }
    
    async def save_customer_data(self, customer_data: Dict[str, Any]) -> bool:
        """
        Guarda los datos del cliente en Nocodb (tabla de contactos)
        """
        try:
            logger.info(f"🔄 Intentando guardar cliente en NocoDB: {customer_data.get('nombre', 'Sin nombre')}")
            logger.info(f"📊 URL de API: {self.contactos_api_url}")
            logger.info(f"🔑 Token: {self.token[:10]}...")
            
            # Preparar datos para Nocodb (formato de tabla contactos_csv)
            nocodb_data = {
                "nombre_cliente": customer_data.get("nombre", ""),
                "email_cliente": customer_data.get("email", ""),
                "telefono_cliente": customer_data.get("whatsapp", ""),
                "mensaje_consulta": customer_data.get("observaciones", ""),
                "fecha_consulta": customer_data.get("fecha", ""),
                "estado_consulta": "Nuevo",
                "origen_consulta": "Web Construcción",
                "notas_Internas": f"Tipo: {customer_data.get('tipo_construccion', '')}, Área: {customer_data.get('metros_cuadrados', 0)}m²"
            }
            
            logger.info(f"📝 Datos preparados para NocoDB: {nocodb_data}")
            
            async with aiohttp.ClientSession() as session:
                logger.info(f"🌐 Enviando POST a: {self.contactos_api_url}")
                logger.info(f"📋 Headers: {self.headers}")
                
                async with session.post(
                    self.contactos_api_url,
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

    async def save_quote_data(self, quote_data: Dict[str, Any]) -> bool:
        """
        Guarda los datos de la cotización en Nocodb (tabla de cotizaciones)
        """
        try:
            logger.info(f"🔄 Intentando guardar cotización en NocoDB: {quote_data.get('client_name', 'Sin nombre')}")
            logger.info(f"📊 URL de API: {self.cotizaciones_api_url}")
            
            # Preparar datos para Nocodb (formato de tabla cotizaciones)
            nocodb_data = {
                "cliente_nombre": quote_data.get("client_name", ""),
                "cliente_email": quote_data.get("client_email", ""),
                "cliente_telefono": quote_data.get("client_phone", ""),
                "tipo_construccion": quote_data.get("construction_type", ""),
                "area_m2": quote_data.get("area", ""),
                "pisos": quote_data.get("floors", 1),
                "ubicacion": quote_data.get("location", ""),
                "nivel_terminacion": quote_data.get("finish_level", ""),
                "total_cotizacion": quote_data.get("total_cost", ""),
                "tiempo_estimado": quote_data.get("estimated_time", ""),
                "fecha_cotizacion": quote_data.get("quote_date", ""),
                "valido_hasta": quote_data.get("valid_until", ""),
                "estado": "Nueva",
                "origen": "Web Construcción",
                "desglose_costos": str(quote_data.get("breakdown", [])),
                "observaciones": f"Tipo de uso: {quote_data.get('usage_type', '')}"
            }
            
            logger.info(f"📝 Datos de cotización preparados para NocoDB: {nocodb_data}")
            
            async with aiohttp.ClientSession() as session:
                logger.info(f"🌐 Enviando POST a: {self.cotizaciones_api_url}")
                
                async with session.post(
                    self.cotizaciones_api_url,
                    json=nocodb_data,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    
                    response_text = await response.text()
                    logger.info(f"📡 Respuesta de NocoDB: {response.status} - {response_text}")
                    
                    if response.status == 200:
                        logger.info("✅ Cotización guardada exitosamente en NocoDB")
                        return True
                    else:
                        logger.error(f"❌ Error guardando cotización: {response.status} - {response_text}")
                        return False
                        
        except Exception as e:
            logger.error(f"❌ Error guardando cotización en NocoDB: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return False

# Instancia global del servicio de Nocodb
nocodb_service = NocodbService()
