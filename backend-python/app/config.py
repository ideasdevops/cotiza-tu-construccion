"""
Configuración del Cotizador de Construcción
Credenciales SMTP y configuración de Nocodb
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Configuración SMTP de Sumpetrol
    SMTP_SERVER: str = "c2630942.ferozo.com"
    SMTP_PORT: int = 465
    SMTP_USERNAME: str = "novedades@sumpetrol.com.ar"
    SMTP_PASSWORD: str = "Novedad3s2k24@@"
    SMTP_USE_TLS: bool = False
    SMTP_USE_SSL: bool = True
    
    # Email de recepción de consultas
    CONTACT_EMAIL: str = "marketing@sumpetrol.com.ar"
    
    # Configuración de Nocodb - Variables correctas
    NC_DB_URL: str = "https://bots-nocodb.prskfv.easypanel.host"
    NC_TOKEN: str = "_H3KGTFKGtgMb3pQU5GXR2i17glb1ytl3hxYvVkT"
    NC_DB_ID: str = "pjo0a1kfnvm1ai3"
    
    # Variables legacy para compatibilidad
    NOCODB_URL: str = "https://bots-nocodb.prskfv.easypanel.host"
    NOCODB_TOKEN: str = "_H3KGTFKGtgMb3pQU5GXR2i17glb1ytl3hxYvVkT"
    NOCODB_BASE_ID: str = "pjo0a1kfnvm1ai3"
    NOCODB_TABLE_ID: str = "m7i75nx5rkwockg"
    
    # Tablas específicas de NocoDB
    NOCODB_CONTACTOS_TABLE_ID: str = "m4fda5efk6fwth6"
    NOCODB_COTIZACIONES_TABLE_ID: str = "mo17k9bts54ou45"
    
    # Variables de entorno del contenedor NocoDB
    NC_DATABASE_URL: Optional[str] = None
    NC_REDIS_URL: Optional[str] = None
    NC_AUTH_JWT_SECRET: Optional[str] = None
    NC_PUBLIC_URL: Optional[str] = None
    
    # Configuración de la aplicación
    APP_NAME: str = "Cotizador de Construcción - Sumpetrol"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instancia global de configuración
settings = Settings()

# Función para obtener configuración
def get_settings() -> Settings:
    return settings
