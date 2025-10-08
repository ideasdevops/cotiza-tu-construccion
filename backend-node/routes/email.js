/**
 * Rutas de Email para el Backend de Node.js
 * Usando Nodemailer para el Cotizador de Construcción
 */

const express = require('express');
const router = express.Router();
const EmailService = require('../email-service');

const emailService = new EmailService();

// Middleware para parsear JSON
router.use(express.json({ limit: '10mb' }));

/**
 * POST /api/email/send
 * Envía email de cotización
 */
router.post('/send', async (req, res) => {
  try {
    console.log('📧 Recibida solicitud de envío de email de cotización');
    
    const { to, subject, html, attachments } = req.body;
    
    // Validar campos requeridos
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: to, subject, html'
      });
    }
    
    // Enviar email
    const result = await emailService.sendQuoteEmail({
      to,
      subject,
      html,
      attachments
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email de cotización enviado exitosamente',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error enviando email de cotización',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error en ruta de email de cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/email/contact
 * Envía email de contacto
 */
router.post('/contact', async (req, res) => {
  try {
    console.log('📧 Recibida solicitud de envío de email de contacto');
    
    const { subject, html } = req.body;
    
    // Validar campos requeridos
    if (!subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: subject, html'
      });
    }
    
    // Enviar email
    const result = await emailService.sendContactEmail({
      subject,
      html
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email de contacto enviado exitosamente',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error enviando email de contacto',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error en ruta de email de contacto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/email/verify
 * Verifica la conexión SMTP
 */
router.get('/verify', async (req, res) => {
  try {
    console.log('🔍 Verificando conexión SMTP...');
    
    const isConnected = await emailService.verifyConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Conexión SMTP verificada correctamente',
        smtp: {
          host: 'c2630942.ferozo.com',
          port: 465,
          secure: true,
          user: 'novedades@sumpetrol.com.ar'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error verificando conexión SMTP'
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando conexión SMTP:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
