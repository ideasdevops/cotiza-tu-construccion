#!/usr/bin/env python3
"""
Script de prueba para verificar la corrección de la cotización completa
"""

import sys
import os
sys.path.append('/home/administrator/cotiza-tu-construccion/backend-python')

from app.construction_calculator import ConstructionCalculator

def test_multiple_scenarios():
    print("🔧 Probando múltiples escenarios de cotización...")
    
    calculator = ConstructionCalculator()
    
    # Escenarios de prueba
    test_cases = [
        {
            'name': 'Caso 1: Steel Frame Residencial Estándar',
            'data': {
                'client_name': 'Franco',
                'client_email': 'frsponton@gmail.com',
                'client_phone': '+5492613151000',
                'location': 'mendoza',
                'construction_type': 'steel-frame',
                'square_meters': 120,
                'floors': 2,
                'usage_type': 'residencial',
                'finish_level': 'estandar'
            }
        },
        {
            'name': 'Caso 2: Steel Frame Comercial Premium (del error actual)',
            'data': {
                'client_name': 'Franco',
                'client_email': 'frsponton@gmail.com',
                'client_phone': '+5492613151000',
                'location': 'mendoza',
                'construction_type': 'steel-frame',
                'square_meters': 150,
                'floors': 2,
                'usage_type': 'comercial',
                'finish_level': 'premium'
            }
        },
        {
            'name': 'Caso 3: Industrial Estándar',
            'data': {
                'client_name': 'Test',
                'client_email': 'test@test.com',
                'client_phone': '+5492610000000',
                'location': 'buenos-aires',
                'construction_type': 'industrial',
                'square_meters': 200,
                'floors': 1,
                'usage_type': 'industrial',
                'finish_level': 'estandar'
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 {test_case['name']}")
        print(f"📊 Datos: {test_case['data']}")
        
        try:
            # Probar cotización detallada
            quote = calculator.calculate_detailed_quote(test_case['data'])
            print(f"✅ ÉXITO: Total = {quote['total_cost']}")
            print(f"📅 Fecha: {quote['quote_date']} - Válida hasta: {quote['valid_until']}")
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
    
    print(f"\n🎯 Pruebas completadas para {len(test_cases)} escenarios")

if __name__ == "__main__":
    test_multiple_scenarios()
