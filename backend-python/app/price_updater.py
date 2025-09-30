"""
Servicio de actualización automática de precios cada 12 horas
Integra con APIs de Argentina para mantener precios actualizados
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
import json
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .argentina_apis import ArgentinaAPIService, get_current_prices, get_current_exchange_rate

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PriceUpdaterService:
    """Servicio de actualización automática de precios"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.last_update: Optional[datetime] = None
        self.update_interval = timedelta(hours=12)
        self.prices_cache_file = "prices_cache.json"
        self.exchange_cache_file = "exchange_cache.json"
        
        # Inicializar
        self._load_last_update()
        self._setup_scheduler()
    
    def _load_last_update(self):
        """Cargar última actualización desde archivo"""
        try:
            if os.path.exists("last_update.txt"):
                with open("last_update.txt", "r") as f:
                    timestamp_str = f.read().strip()
                    self.last_update = datetime.fromisoformat(timestamp_str)
                    logger.info(f"Última actualización cargada: {self.last_update}")
        except Exception as e:
            logger.warning(f"Error cargando última actualización: {e}")
            self.last_update = None
    
    def _save_last_update(self):
        """Guardar última actualización en archivo"""
        try:
            with open("last_update.txt", "w") as f:
                f.write(datetime.now().isoformat())
            logger.info("Última actualización guardada")
        except Exception as e:
            logger.error(f"Error guardando última actualización: {e}")
    
    def _setup_scheduler(self):
        """Configurar programador de tareas"""
        try:
            # Actualizar precios cada 12 horas (6:00 AM y 6:00 PM)
            self.scheduler.add_job(
                self.update_prices_job,
                CronTrigger(hour="6,18", minute="0"),
                id="update_prices",
                name="Actualizar precios de construcción",
                replace_existing=True
            )
            
            # Actualizar tipo de cambio cada 6 horas
            self.scheduler.add_job(
                self.update_exchange_rate_job,
                CronTrigger(hour="0,6,12,18", minute="0"),
                id="update_exchange",
                name="Actualizar tipo de cambio",
                replace_existing=True
            )
            
            # Actualización inicial si es necesario
            if not self.last_update or datetime.now() - self.last_update > self.update_interval:
                logger.info("Programando actualización inicial")
                self.scheduler.add_job(
                    self.update_prices_job,
                    'date',
                    run_date=datetime.now() + timedelta(seconds=30),
                    id="initial_update",
                    name="Actualización inicial"
                )
            
            logger.info("Programador de tareas configurado exitosamente")
            
        except Exception as e:
            logger.error(f"Error configurando programador: {e}")
    
    async def update_prices_job(self):
        """Tarea programada para actualizar precios"""
        try:
            logger.info("🔄 Iniciando actualización programada de precios...")
            
            # Actualizar precios de construcción
            prices = await get_current_prices()
            
            # Guardar en cache
            self._save_prices_cache(prices)
            
            # Actualizar timestamp
            self.last_update = datetime.now()
            self._save_last_update()
            
            logger.info(f"✅ Precios actualizados exitosamente: {prices}")
            
            # Notificar a otros servicios si es necesario
            await self._notify_price_update(prices)
            
        except Exception as e:
            logger.error(f"❌ Error en actualización programada de precios: {e}")
    
    async def update_exchange_rate_job(self):
        """Tarea programada para actualizar tipo de cambio"""
        try:
            logger.info("🔄 Iniciando actualización programada de tipo de cambio...")
            
            # Actualizar tipo de cambio
            exchange_rate = await get_current_exchange_rate()
            
            # Guardar en cache
            self._save_exchange_cache(exchange_rate)
            
            logger.info(f"✅ Tipo de cambio actualizado: {exchange_rate.ars_usd:.6f} ARS/USD")
            
        except Exception as e:
            logger.error(f"❌ Error en actualización programada de tipo de cambio: {e}")
    
    def _save_prices_cache(self, prices):
        """Guardar precios en cache"""
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'prices': {
                    'steel_frame_m2': prices.steel_frame_m2,
                    'industrial_m2': prices.industrial_m2,
                    'container_m2': prices.container_m2,
                    'materials_m2': prices.materials_m2,
                    'labor_m2': prices.labor_m2,
                    'finishes_m2': prices.finishes_m2
                }
            }
            
            with open(self.prices_cache_file, 'w') as f:
                json.dump(cache_data, f, default=str)
            
            logger.info("Cache de precios guardado exitosamente")
            
        except Exception as e:
            logger.error(f"Error guardando cache de precios: {e}")
    
    def _save_exchange_cache(self, exchange_rate):
        """Guardar tipo de cambio en cache"""
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'exchange_rate': {
                    'ars_usd': exchange_rate.ars_usd,
                    'usd_ars': exchange_rate.usd_ars,
                    'source': exchange_rate.source
                }
            }
            
            with open(self.exchange_cache_file, 'w') as f:
                json.dump(cache_data, f, default=str)
            
            logger.info("Cache de tipo de cambio guardado exitosamente")
            
        except Exception as e:
            logger.error(f"Error guardando cache de tipo de cambio: {e}")
    
    async def _notify_price_update(self, prices):
        """Notificar a otros servicios sobre actualización de precios"""
        try:
            # Aquí podrías implementar notificaciones a otros servicios
            # Por ejemplo, WebSocket, Redis pub/sub, etc.
            logger.info("📢 Notificando actualización de precios a otros servicios...")
            
            # Por ahora, solo logging
            # En producción, implementar notificaciones reales
            
        except Exception as e:
            logger.warning(f"Error notificando actualización: {e}")
    
    def start(self):
        """Iniciar el servicio de actualización"""
        try:
            if not self.scheduler.running:
                self.scheduler.start()
                logger.info("🚀 Servicio de actualización de precios iniciado")
                
                # Mostrar próximas ejecuciones
                jobs = self.scheduler.get_jobs()
                for job in jobs:
                    logger.info(f"📅 Próxima ejecución de '{job.name}': {job.next_run_time}")
            
        except Exception as e:
            logger.error(f"Error iniciando servicio de actualización: {e}")
    
    def stop(self):
        """Detener el servicio de actualización"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown()
                logger.info("🛑 Servicio de actualización de precios detenido")
        except Exception as e:
            logger.error(f"Error deteniendo servicio de actualización: {e}")
    
    def get_status(self) -> Dict:
        """Obtener estado del servicio"""
        return {
            'running': self.scheduler.running,
            'last_update': self.last_update.isoformat() if self.last_update else None,
            'next_update': self._get_next_update_time(),
            'jobs_count': len(self.scheduler.get_jobs()),
            'update_interval_hours': self.update_interval.total_seconds() / 3600
        }
    
    def _get_next_update_time(self) -> Optional[str]:
        """Obtener próxima hora de actualización"""
        try:
            if self.last_update:
                next_update = self.last_update + self.update_interval
                return next_update.isoformat()
        except Exception as e:
            logger.warning(f"Error calculando próxima actualización: {e}")
        return None

# Instancia global del servicio
price_updater_service = PriceUpdaterService()

async def start_price_updater():
    """Función helper para iniciar el servicio"""
    price_updater_service.start()

async def stop_price_updater():
    """Función helper para detener el servicio"""
    price_updater_service.stop()

def get_price_updater_status() -> Dict:
    """Función helper para obtener estado del servicio"""
    return price_updater_service.get_status()
