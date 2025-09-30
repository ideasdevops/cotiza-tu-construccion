"""
Configuración del Cotizador de Construcción
Credenciales SMTP y configuración de Nocodb
"""

import os
from typing import Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Configuración SMTP de Sumpetrol
    SMTP_SERVER: str = "c2630942.ferozo.com"
    SMTP_PORT: int = 465
    SMTP_USERNAME: str = "novedades@sumpetrol.com.ar"
    SMTP_PASSWORD: str = "Novedad3s2k24@@"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = True
    
    # Email de recepción de consultas
    CONTACT_EMAIL: str = "marketing@sumpetrol.com.ar"
    
    # Configuración de Nocodb
    NOCODB_URL: str = "https://bots-nocodb.prskfv.easypanel.host"
    NOCODB_TOKEN: str = "JvshcwW9JUK_sR4yT7H5r7ygSA2BPFAGNI8nSeWF"
    NOCODB_BASE_ID: str = "pjo0a1kfnvm1ai3"
    NOCODB_TABLE_ID: str = "m7i75nx5rkwockg"
    
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
