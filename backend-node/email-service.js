/**
 * Servicio de Email del Backend usando Nodemailer
 * Para el Cotizador de Construcción - Sumpetrol
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuración SMTP de Sumpetrol
    this.transporter = nodemailer.createTransporter({
      host: 'c2630942.ferozo.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'novedades@sumpetrol.com.ar',
        pass: 'Novedad3s2k24@@'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    this.contactEmail = 'marketing@sumpetrol.com.ar';
  }

  /**
   * Envía email de cotización
   */
  async sendQuoteEmail(emailData) {
    try {
      console.log('📧 Enviando email de cotización...');
      
      const mailOptions = {
        from: 'novedades@sumpetrol.com.ar',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments || []
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de cotización enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error enviando email de cotización:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía email de contacto
   */
  async sendContactEmail(emailData) {
    try {
      console.log('📧 Enviando email de contacto...');
      
      const mailOptions = {
        from: 'novedades@sumpetrol.com.ar',
        to: this.contactEmail,
        subject: emailData.subject,
        html: emailData.html
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de contacto enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error enviando email de contacto:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica la conexión SMTP
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error verificando conexión SMTP:', error);
      return false;
    }
  }
}

module.exports = EmailService;
