"""
Servicio de Generación de PDF para Cotizador de Construcción
Genera PDFs profesionales de las cotizaciones
"""

import os
import tempfile
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import logging

logger = logging.getLogger(__name__)

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configura estilos personalizados para el PDF"""
        # Estilo para el título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#6B2E3A')
        ))
        
        # Estilo para subtítulos
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            textColor=colors.HexColor('#4A4A4A')
        ))
        
        # Estilo para el total
        self.styles.add(ParagraphStyle(
            name='TotalStyle',
            parent=self.styles['Normal'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#6B2E3A'),
            fontName='Helvetica-Bold'
        ))
    
    def generate_quote_pdf(self, quote_data: Dict[str, Any], customer_data: Dict[str, Any]) -> str:
        """
        Genera un PDF de la cotización
        Retorna la ruta del archivo PDF generado
        """
        try:
            # Crear archivo temporal
            temp_dir = tempfile.gettempdir()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"cotizacion_{timestamp}.pdf"
            filepath = os.path.join(temp_dir, filename)
            
            # Crear documento PDF
            doc = SimpleDocTemplate(filepath, pagesize=A4)
            story = []
            
            # Agregar contenido al PDF
            self._add_header(story, customer_data)
            self._add_quote_summary(story, quote_data)
            self._add_cost_breakdown(story, quote_data)
            self._add_materials_list(story, quote_data)
            self._add_observations(story, quote_data)
            self._add_footer(story)
            
            # Construir PDF
            doc.build(story)
            
            logger.info(f"PDF generado exitosamente: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error generando PDF: {e}")
            raise
    
    def _add_header(self, story: List, customer_data: Dict[str, Any]):
        """Agrega el encabezado del PDF"""
        # Logo y título
        story.append(Paragraph("SUMPETROL", self.styles['CustomTitle']))
        story.append(Paragraph("Cotizador de Construcción", self.styles['CustomSubtitle']))
        story.append(Spacer(1, 20))
        
        # Información del cliente
        story.append(Paragraph("INFORMACIÓN DEL CLIENTE", self.styles['CustomSubtitle']))
        
        client_info = [
            ["Nombre:", customer_data.get("nombre", "")],
            ["Email:", customer_data.get("email", "")],
            ["WhatsApp:", customer_data.get("whatsapp", "")],
            ["Fecha:", datetime.now().strftime("%d/%m/%Y")]
        ]
        
        client_table = Table(client_info, colWidths=[2*inch, 4*inch])
        client_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        story.append(client_table)
        story.append(Spacer(1, 20))
    
    def _add_quote_summary(self, story: List, quote_data: Dict[str, Any]):
        """Agrega el resumen de la cotización"""
        story.append(Paragraph("RESUMEN DE LA COTIZACIÓN", self.styles['CustomSubtitle']))
        
        summary_data = [
            ["Tipo de Construcción:", quote_data.get("tipo_construccion", "")],
            ["Metros Cuadrados:", f"{quote_data.get('metros_cuadrados', 0)} m²"],
            ["Provincia:", quote_data.get("provincia", "")],
            ["Número de Pisos:", str(quote_data.get("pisos", 1))],
            ["Complejidad:", quote_data.get("complejidad", "")],
            ["Uso:", quote_data.get("uso", "")],
            ["Terminaciones:", quote_data.get("terminaciones", "")]
        ]
        
        summary_table = Table(summary_data, colWidths=[2.5*inch, 3.5*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
    
    def _add_cost_breakdown(self, story: List, quote_data: Dict[str, Any]):
        """Agrega el desglose de costos"""
        story.append(Paragraph("DESGLOSE DE COSTOS", self.styles['CustomSubtitle']))
        
        costs_data = [
            ["Concepto", "Monto (USD)"],
            ["Materiales", f"${quote_data.get('materiales_cost', 0):,.2f}"],
            ["Mano de Obra", f"${quote_data.get('mano_obra_cost', 0):,.2f}"],
            ["Terminaciones", f"${quote_data.get('terminaciones_cost', 0):,.2f}"],
            ["Instalaciones", f"${quote_data.get('instalaciones_cost', 0):,.2f}"],
            ["Transporte", f"${quote_data.get('transporte_cost', 0):,.2f}"],
            ["Impuestos (21%)", f"${quote_data.get('impuestos_cost', 0):,.2f}"],
            ["", ""],
            ["TOTAL", f"U$D {quote_data.get('total', 0):,.2f}"]
        ]
        
        costs_table = Table(costs_data, colWidths=[4*inch, 2*inch])
        costs_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -2), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6B2E3A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, -2), (-1, -1), colors.HexColor('#4A4A4A')),
            ('TEXTCOLOR', (0, -2), (-1, -1), colors.whitesmoke)
        ]))
        
        story.append(costs_table)
        story.append(Spacer(1, 20))
    
    def _add_materials_list(self, story: List, quote_data: Dict[str, Any]):
        """Agrega la lista de materiales"""
        materials = quote_data.get("materiales", [])
        if materials:
            story.append(Paragraph("MATERIALES SELECCIONADOS", self.styles['CustomSubtitle']))
            
            materials_data = [["Material", "Cantidad", "Precio Unitario", "Total"]]
            for material in materials:
                materials_data.append([
                    material.get("nombre", ""),
                    f"{material.get('cantidad', 0)} {material.get('unidad', '')}",
                    f"${material.get('precio_unitario', 0):,.2f}",
                    f"${material.get('total', 0):,.2f}"
                ])
            
            materials_table = Table(materials_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            materials_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6B2E3A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke)
            ]))
            
            story.append(materials_table)
            story.append(Spacer(1, 20))
    
    def _add_observations(self, story: List, quote_data: Dict[str, Any]):
        """Agrega las observaciones"""
        observations = quote_data.get("observaciones", [])
        if observations:
            story.append(Paragraph("OBSERVACIONES", self.styles['CustomSubtitle']))
            
            for obs in observations:
                story.append(Paragraph(f"• {obs}", self.styles['Normal']))
            
            story.append(Spacer(1, 20))
    
    def _add_footer(self, story: List):
        """Agrega el pie de página"""
        story.append(Paragraph("CONDICIONES Y VALIDEZ", self.styles['CustomSubtitle']))
        story.append(Paragraph("• Esta cotización es válida por 30 días desde la fecha de emisión", self.styles['Normal']))
        story.append(Paragraph("• Los precios están sujetos a cambios sin previo aviso", self.styles['Normal']))
        story.append(Paragraph("• Para más información contacte a ventas@sumpetrol.com.ar", self.styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Información de contacto
        contact_info = [
            ["SUMPETROL", ""],
            ["Construcción y Servicios Industriales", ""],
            ["Email: ventas@sumpetrol.com.ar", ""],
            ["Teléfono: +54 9 261 7110120", ""],
            ["Mendoza: Acceso Sur - Lateral Este 4585, Luján de Cuyo", ""],
            ["Río Negro: Vicente Lazaretti 903 - Cipolletti", ""]
        ]
        
        contact_table = Table(contact_info, colWidths=[4*inch, 2*inch])
        contact_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (0, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#6B2E3A'))
        ]))
        
        story.append(contact_table)

# Instancia global del servicio de PDF
pdf_service = PDFService()
