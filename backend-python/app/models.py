from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

class TipoConstruccion(str, Enum):
    STEEL_FRAME = "steel_frame"
    INDUSTRIAL = "industrial"
    CONTENEDOR = "contenedor"
    MIXTO = "mixto"

class TipoUso(str, Enum):
    RESIDENCIAL = "residencial"
    INDUSTRIAL = "industrial"
    COMERCIAL = "comercial"

class NivelTerminacion(str, Enum):
    BASICO = "basico"
    ESTANDAR = "estandar"
    PREMIUM = "premium"

class Material(BaseModel):
    nombre: str
    precio_por_m2: float
    unidad: str
    categoria: str

class CotizacionRequest(BaseModel):
    # Datos del cliente
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    
    # Tipo de construcción
    tipo_construccion: TipoConstruccion
    tipo_uso: TipoUso
    nivel_terminacion: NivelTerminacion
    
    # Dimensiones
    metros_cuadrados: float = Field(..., gt=0, le=10000)
    ancho: Optional[float] = None
    largo: Optional[float] = None
    altura: Optional[float] = None
    
    # Características específicas
    pisos: int = Field(1, ge=1, le=10)
    tiene_terraza: bool = False
    tiene_sotano: bool = False
    incluye_instalaciones: bool = True
    
    # Materiales preferidos
    materiales_preferidos: Optional[List[str]] = None
    
    # Ubicación
    provincia: str
    ciudad: str
    zona: Optional[str] = None
    observaciones: Optional[str] = None

class CotizacionResponse(BaseModel):
    id: str
    cliente: str
    total_estimado: float
    moneda: str = "USD"
    desglose: dict
    materiales_utilizados: List[Material]
    tiempo_estimado: str
    observaciones: List[str]
    validez_dias: int = 30

class PrecioMaterial(BaseModel):
    material: str
    precio_por_m2: float
    moneda: str
    fecha_actualizacion: str
    fuente: str

class CalculoCostos(BaseModel):
    materiales: float
    mano_obra: float
    terminaciones: float
    instalaciones: float
    transporte: float
    impuestos: float
    total: float
