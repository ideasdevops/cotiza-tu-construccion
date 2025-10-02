"""
Servicio de Email Mejorado para Cotizador de Construcción
Basado en el servicio del cotizador solar
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime
from .config import settings

logger = logging.getLogger(__name__)

class ImprovedEmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.use_tls = settings.SMTP_USE_TLS
        self.use_ssl = settings.SMTP_USE_SSL
        self.contact_email = settings.CONTACT_EMAIL
        
    def send_contact_form_email(self, 
                               name: str, 
                               email: str, 
                               phone: str, 
                               message: str) -> bool:
        """
        Envía email de formulario de contacto
        """
        try:
            logger.info(f"📧 Enviando email de formulario de contacto...")
            logger.info(f"👤 Cliente: {name}, Email: {email}, Teléfono: {phone}")
            
            # Solo enviar email interno a marketing (no al cliente)
            internal_msg = MIMEMultipart()
            internal_msg['From'] = self.username
            internal_msg['To'] = self.contact_email
            internal_msg['Subject'] = f"🔔 Nueva consulta construcción - {name}"
            
            internal_body = self._create_contact_internal_body(name, email, phone, message)
            internal_msg.attach(MIMEText(internal_body, 'html', 'utf-8'))
            
            # Enviar solo email interno
            internal_sent = self._send_email(internal_msg)
            
            logger.info(f"✅ Email de contacto enviado a {self.contact_email}: {internal_sent}")
            return internal_sent
            
        except Exception as e:
            logger.error(f"Error enviando email de contacto: {e}")
            return False
    
    def send_construction_quote_email(self, 
                                    customer_name: str, 
                                    customer_email: str, 
                                    quote_data: Dict[str, Any]) -> bool:
        """
        Envía email de cotización de construcción al cliente
        """
        try:
            logger.info(f"📧 Enviando email de cotización de construcción...")
            logger.info(f"👤 Cliente: {customer_name}, Email: {customer_email}")
            
            # Email al cliente
            client_msg = MIMEMultipart()
            client_msg['From'] = f"Sumpetrol Construcción <{self.username}>"
            client_msg['To'] = customer_email
            client_msg['Subject'] = f"📋 Cotización de Construcción - {customer_name}"
            
            client_body = self._create_construction_quote_body(customer_name, quote_data)
            client_msg.attach(MIMEText(client_body, 'html', 'utf-8'))
            
            # Email interno
            internal_msg = MIMEMultipart()
            internal_msg['From'] = self.username
            internal_msg['To'] = self.contact_email
            internal_msg['Subject'] = f"📊 Nueva cotización construcción - {customer_name}"
            
            internal_body = self._create_construction_quote_notification_body(customer_name, customer_email, quote_data)
            internal_msg.attach(MIMEText(internal_body, 'html', 'utf-8'))
            
            # Enviar ambos emails
            client_sent = self._send_email(client_msg)
            internal_sent = self._send_email(internal_msg)
            
            logger.info(f"✅ Emails de cotización enviados - Cliente: {client_sent}, Interno: {internal_sent}")
            return client_sent and internal_sent
            
        except Exception as e:
            logger.error(f"Error enviando email de cotización: {e}")
            return False
    
    def _send_email(self, msg: MIMEMultipart) -> bool:
        """Envía email usando SMTP"""
        try:
            if self.use_ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                if self.use_tls:
                    server.starttls()
            
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()
            
            logger.info("✅ Email enviado exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error enviando email: {e}")
            return False
    
    def _create_contact_internal_body(self, name: str, email: str, phone: str, message: str) -> str:
        """Crear cuerpo del email interno de contacto"""
        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nueva Consulta de Construcción</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1f2937; color: white; padding: 20px; text-align: center; }}
                .content {{ background: white; padding: 20px; border: 1px solid #e5e7eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Nueva Consulta de Construcción</h1>
                    <p>{datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                </div>
                
                <div class="content">
                    <p><strong>Cliente:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Teléfono:</strong> {phone}</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>{message}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_construction_quote_body(self, customer_name: str, quote_data: Dict[str, Any]) -> str:
        """Crear cuerpo del email de cotización para el cliente"""
        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cotización de Construcción</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1f2937; color: white; padding: 20px; text-align: center; }}
                .content {{ background: white; padding: 20px; border: 1px solid #e5e7eb; }}
                .quote-details {{ background: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 Cotización de Construcción</h1>
                    <p>Estimado/a {customer_name}</p>
                </div>
                
                <div class="content">
                    <p>Gracias por confiar en Sumpetrol para su proyecto de construcción.</p>
                    
                    <div class="quote-details">
                        <h3>Detalles de su Cotización:</h3>
                        <p><strong>Tipo de Construcción:</strong> {quote_data.get('tipo_construccion', 'N/A')}</p>
                        <p><strong>Área Total:</strong> {quote_data.get('area_total', 'N/A')} m²</p>
                        <p><strong>Costo Total Estimado:</strong> ${quote_data.get('costo_total', 'N/A'):,.0f}</p>
                        <p><strong>Fecha de Cotización:</strong> {datetime.now().strftime('%d/%m/%Y')}</p>
                    </div>
                    
                    <p>Esta cotización es válida por 30 días y está sujeta a cambios en precios de materiales.</p>
                    <p>Para más información o para coordinar una visita técnica, no dude en contactarnos.</p>
                    
                    <p>Saludos cordiales,<br>Equipo Sumpetrol Construcción</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_construction_quote_notification_body(self, customer_name: str, customer_email: str, quote_data: Dict[str, Any]) -> str:
        """Crear cuerpo del email de notificación interna de cotización"""
        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nueva Cotización de Construcción</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1f2937; color: white; padding: 20px; text-align: center; }}
                .content {{ background: white; padding: 20px; border: 1px solid #e5e7eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Nueva Cotización de Construcción Generada</h1>
                    <p>{datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                </div>
                
                <div class="content">
                    <p><strong>Cliente:</strong> {customer_name}</p>
                    <p><strong>Email:</strong> {customer_email}</p>
                    <p><strong>Tipo de Construcción:</strong> {quote_data.get('tipo_construccion', 'N/A')}</p>
                    <p><strong>Área Total:</strong> {quote_data.get('area_total', 'N/A')} m²</p>
                    <p><strong>Costo Total:</strong> ${quote_data.get('costo_total', 'N/A'):,.0f}</p>
                </div>
            </div>
        </body>
        </html>
        """

# Instancia global del servicio mejorado
improved_email_service = ImprovedEmailService()
