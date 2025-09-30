/**
 * Servicio de Email usando Nodemailer
 * Para el Cotizador de Construcción - Sumpetrol
 */

class EmailService {
  constructor() {
    this.smtpConfig = {
      host: 'c2630942.ferozo.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'novedades@sumpetrol.com.ar',
        pass: 'Novedad3s2k24@@'
      }
    };
    
    this.contactEmail = 'marketing@sumpetrol.com.ar';
  }

  /**
   * Envía email de cotización
   */
  async sendQuoteEmail(quoteData) {
    try {
      console.log('📧 Enviando email de cotización...');
      
      const emailData = {
        to: quoteData.email,
        subject: `Cotización de Construcción - ${quoteData.nombre}`,
        html: this.createQuoteEmailHTML(quoteData),
        attachments: []
      };
      
      // Si hay PDF, agregarlo como adjunto
      if (quoteData.pdfBlob) {
        emailData.attachments.push({
          filename: `cotizacion_${quoteData.id}.pdf`,
          content: quoteData.pdfBlob,
          contentType: 'application/pdf'
        });
      }
      
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email de cotización enviado:', result);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Error enviando email:', error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error en servicio de email:', error);
      return false;
    }
  }

  /**
   * Envía email de contacto
   */
  async sendContactEmail(contactData) {
    try {
      console.log('📧 Enviando email de contacto...');
      
      const emailData = {
        to: this.contactEmail,
        subject: `Nueva consulta de contacto - ${contactData.nombre}`,
        html: this.createContactEmailHTML(contactData)
      };
      
      const response = await fetch('/api/email/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email de contacto enviado:', result);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Error enviando email de contacto:', error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error en servicio de email de contacto:', error);
      return false;
    }
  }

  /**
   * Crea el HTML del email de cotización
   */
  createQuoteEmailHTML(quoteData) {
    const total = quoteData.total_estimado || 0;
    const m2 = quoteData.metros_cuadrados || 0;
    const tipo = quoteData.tipo_construccion || '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .header { 
            background: linear-gradient(135deg, #8B4513, #696969);
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { 
            padding: 30px; 
            background: #f9f9f9;
          }
          .quote-summary { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #8B4513;
          }
          .total { 
            font-size: 28px; 
            font-weight: bold; 
            color: #8B4513; 
            text-align: center;
            margin: 20px 0;
          }
          .details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
          }
          .footer { 
            background: #4A4A4A; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            margin-top: 20px;
            border-radius: 0 0 10px 10px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SUMPETROL</div>
          <h1>Cotización de Construcción</h1>
          <p>Tu proyecto, nuestra especialidad</p>
        </div>
        
        <div class="content">
          <h2>Hola ${quoteData.nombre},</h2>
          <p>Hemos preparado tu cotización personalizada para el proyecto de construcción.</p>
          
          <div class="quote-summary">
            <h3>Resumen de la Cotización</h3>
            <div class="total">U$D ${total.toLocaleString()}</div>
            <p><strong>Proyecto:</strong> ${tipo}</p>
            <p><strong>Superficie:</strong> ${m2} m²</p>
            <p><strong>Validez:</strong> 30 días</p>
          </div>
          
          <div class="details">
            <h3>Detalles del Proyecto</h3>
            <p><strong>Tipo de Construcción:</strong> ${quoteData.tipo_construccion}</p>
            <p><strong>Uso:</strong> ${quoteData.tipo_uso}</p>
            <p><strong>Nivel de Terminación:</strong> ${quoteData.nivel_terminacion}</p>
            <p><strong>Provincia:</strong> ${quoteData.provincia}</p>
            ${quoteData.pisos ? `<p><strong>Pisos:</strong> ${quoteData.pisos}</p>` : ''}
          </div>
          
          <div class="details">
            <h3>Materiales Seleccionados</h3>
            ${this.formatMaterialsList(quoteData.materiales)}
          </div>
          
          ${quoteData.observaciones ? `
          <div class="details">
            <h3>Observaciones</h3>
            <p>${quoteData.observaciones}</p>
          </div>
          ` : ''}
          
          <p>Para más información o para proceder con el proyecto, contáctanos:</p>
          <ul>
            <li>📧 <a href="mailto:ventas@sumpetrol.com.ar">ventas@sumpetrol.com.ar</a></li>
            <li>📱 <a href="https://wa.me/5492617110120">+54 9 261 711-0120</a></li>
            <li>🌐 <a href="https://sumpetrol.com.ar">sumpetrol.com.ar</a></li>
          </ul>
        </div>
        
        <div class="footer">
          <p><strong>SUMPETROL</strong></p>
          <p>Construcción moderna y eficiente</p>
          <p>Esta cotización es válida por 30 días</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Crea el HTML del email de contacto
   */
  createContactEmailHTML(contactData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .header { 
            background: linear-gradient(135deg, #8B4513, #696969);
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { 
            padding: 30px; 
            background: #f9f9f9;
          }
          .contact-info { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #8B4513;
          }
          .footer { 
            background: #4A4A4A; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            margin-top: 20px;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Nueva Consulta de Contacto</h1>
          <p>Cotizador de Construcción - Sumpetrol</p>
        </div>
        
        <div class="content">
          <h2>Se ha recibido una nueva consulta</h2>
          
          <div class="contact-info">
            <h3>Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${contactData.nombre}</p>
            <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
            ${contactData.whatsapp ? `<p><strong>WhatsApp:</strong> ${contactData.whatsapp}</p>` : ''}
            <p><strong>Mensaje:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              ${contactData.mensaje}
            </div>
          </div>
          
          <p>Por favor, responde a esta consulta lo antes posible.</p>
        </div>
        
        <div class="footer">
          <p><strong>SUMPETROL</strong></p>
          <p>Construcción moderna y eficiente</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Formatea la lista de materiales para el email
   */
  formatMaterialsList(materials) {
    if (!materials || materials.length === 0) {
      return '<p>No se seleccionaron materiales específicos</p>';
    }
    
    if (Array.isArray(materials)) {
      return `
        <ul>
          ${materials.map(material => `<li>${material.nombre}: U$D ${material.precio}/kg</li>`).join('')}
        </ul>
      `;
    }
    
    return `<p>${materials}</p>`;
  }
}

// Exportar para uso global
window.EmailService = EmailService;
