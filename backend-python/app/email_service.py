"""
Servicio de Email para Cotizador de Construcción
Usa las credenciales SMTP de Sumpetrol
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import logging
from .config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.use_tls = settings.SMTP_USE_TLS
        self.use_ssl = settings.SMTP_USE_SSL
        
    def send_quote_email(self, 
                        to_email: str, 
                        customer_name: str, 
                        quote_data: dict,
                        pdf_path: Optional[str] = None) -> bool:
        """
        Envía email con cotización al cliente
        """
        try:
            # Crear mensaje
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = to_email
            msg['Subject'] = f"Cotización de Construcción - {customer_name}"
            
            # Cuerpo del email
            body = self._create_quote_email_body(customer_name, quote_data)
            msg.attach(MIMEText(body, 'html'))
            
            # Adjuntar PDF si existe
            if pdf_path:
                self._attach_pdf(msg, pdf_path)
            
            # Enviar email
            return self._send_email(msg)
            
        except Exception as e:
            logger.error(f"Error enviando email de cotización: {e}")
            return False
    
    def send_contact_form_email(self, 
                               customer_name: str, 
                               customer_email: str, 
                               message: str) -> bool:
        """
        Envía email de consulta de contacto a marketing@sumpetrol.com.ar
        """
        try:
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = settings.CONTACT_EMAIL
            msg['Subject'] = f"Nueva consulta de contacto - {customer_name}"
            
            body = self._create_contact_email_body(customer_name, customer_email, message)
            msg.attach(MIMEText(body, 'html'))
            
            return self._send_email(msg)
            
        except Exception as e:
            logger.error(f"Error enviando email de contacto: {e}")
            return False
    
    def _create_quote_email_body(self, customer_name: str, quote_data: dict) -> str:
        """
        Crea el cuerpo HTML del email de cotización
        """
        total = quote_data.get('total', 0)
        m2 = quote_data.get('metros_cuadrados', 0)
        tipo = quote_data.get('tipo_construccion', '')
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background-color: #6B2E3A; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .quote-summary {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .total {{ font-size: 24px; font-weight: bold; color: #6B2E3A; }}
                .footer {{ background-color: #4A4A4A; color: white; padding: 15px; text-align: center; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Cotización de Construcción</h1>
                <p>Sumpetrol - Cotizador de Construcción</p>
            </div>
            
            <div class="content">
                <h2>Estimado/a {customer_name},</h2>
                
                <p>Hemos preparado su cotización de construcción según los datos proporcionados:</p>
                
                <div class="quote-summary">
                    <h3>Resumen de la Cotización</h3>
                    <p><strong>Tipo de Construcción:</strong> {tipo}</p>
                    <p><strong>Metros Cuadrados:</strong> {m2} m²</p>
                    <p class="total">Total Estimado: U$D {total:,.2f}</p>
                </div>
                
                <p>Esta cotización es válida por 30 días desde la fecha de emisión.</p>
                
                <p>Para más información o para proceder con el proyecto, contáctenos:</p>
                <ul>
                    <li><strong>Email:</strong> ventas@sumpetrol.com.ar</li>
                    <li><strong>Teléfono:</strong> +54 9 261 7110120</li>
                </ul>
                
                <p>Atentamente,<br>
                <strong>Equipo de Sumpetrol</strong></p>
            </div>
            
            <div class="footer">
                <p>Sumpetrol - Construcción y Servicios Industriales</p>
                <p>Acceso Sur - Lateral Este 4585, Luján de Cuyo, Mendoza</p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _create_contact_email_body(self, customer_name: str, customer_email: str, message: str) -> str:
        """
        Crea el cuerpo HTML del email de contacto
        """
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background-color: #6B2E3A; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .contact-info {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ background-color: #4A4A4A; color: white; padding: 15px; text-align: center; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Nueva Consulta de Contacto</h1>
                <p>Sumpetrol - Cotizador de Construcción</p>
            </div>
            
            <div class="content">
                <h2>Nueva consulta recibida</h2>
                
                <div class="contact-info">
                    <h3>Información del Cliente</h3>
                    <p><strong>Nombre:</strong> {customer_name}</p>
                    <p><strong>Email:</strong> {customer_email}</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>{message}</p>
                </div>
                
                <p>Esta consulta fue enviada desde el formulario de contacto del cotizador de construcción.</p>
            </div>
            
            <div class="footer">
                <p>Sumpetrol - Construcción y Servicios Industriales</p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _attach_pdf(self, msg: MIMEMultipart, pdf_path: str):
        """
        Adjunta un archivo PDF al email
        """
        try:
            with open(pdf_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= cotizacion_construccion.pdf'
            )
            
            msg.attach(part)
            
        except Exception as e:
            logger.error(f"Error adjuntando PDF: {e}")
    
    def _send_email(self, msg: MIMEMultipart) -> bool:
        """
        Envía el email usando SMTP
        """
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
            
            logger.info("Email enviado exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando email: {e}")
            return False

# Instancia global del servicio de email
email_service = EmailService()
