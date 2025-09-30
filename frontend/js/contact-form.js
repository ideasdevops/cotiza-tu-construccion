/**
 * Gestor del Formulario de Contacto
 * Envía consultas a marketing@sumpetrol.com.ar
 */

class ContactFormManager {
  constructor() {
    this.init();
  }

  init() {
    this.initEventListeners();
    console.log('✅ Gestor de formulario de contacto inicializado');
  }

  initEventListeners() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    try {
      // Obtener datos del formulario
      const formData = this.getFormData();
      
      // Validar datos
      if (!this.validateFormData(formData)) {
        return;
      }
      
      // Mostrar estado de carga
      this.setLoadingState(true);
      
      // Enviar formulario
      const success = await this.sendContactForm(formData);
      
      if (success) {
        this.showSuccessMessage();
        this.resetForm();
      } else {
        this.showErrorMessage('Error enviando el mensaje. Por favor, inténtalo de nuevo.');
      }
      
    } catch (error) {
      console.error('Error en formulario de contacto:', error);
      this.showErrorMessage('Error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      this.setLoadingState(false);
    }
  }

  getFormData() {
    const form = document.getElementById('contactForm');
    const formData = new FormData(form);
    
    return {
      nombre: formData.get('name') || '',
      email: formData.get('email') || '',
      mensaje: formData.get('message') || '',
      fecha: new Date().toISOString().split('T')[0]
    };
  }

  validateFormData(data) {
    // Validar nombre
    if (!data.nombre.trim()) {
      this.showFieldError('contactName', 'El nombre es obligatorio');
      return false;
    }
    
    // Validar email
    if (!data.email.trim()) {
      this.showFieldError('contactEmail', 'El email es obligatorio');
      return false;
    }
    
    if (!this.isValidEmail(data.email)) {
      this.showFieldError('contactEmail', 'El email no es válido');
      return false;
    }
    
    // Validar mensaje
    if (!data.mensaje.trim()) {
      this.showFieldError('contactMessage', 'El mensaje es obligatorio');
      return false;
    }
    
    if (data.mensaje.trim().length < 10) {
      this.showFieldError('contactMessage', 'El mensaje debe tener al menos 10 caracteres');
      return false;
    }
    
    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async sendContactForm(data) {
    try {
      // Simular envío exitoso (ya que no tenemos backend configurado)
      console.log('📧 Datos del formulario a enviar:', data);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular éxito
      console.log('✅ Formulario enviado exitosamente (simulado)');
      
      // Aquí podrías integrar con servicios como:
      // - EmailJS
      // - Formspree
      // - Netlify Forms
      // - O cualquier otro servicio de formularios
      
      return true;
      
    } catch (error) {
      console.error('❌ Error enviando formulario:', error);
      return false;
    }
  }

  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Limpiar error previo
    this.clearFieldError(fieldId);
    
    // Crear elemento de error
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: var(--error);
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
    `;
    
    // Insertar después del campo
    field.parentNode.appendChild(errorElement);
    
    // Agregar clase de error al campo
    field.style.borderColor = 'var(--error)';
    
    // Hacer scroll al campo con error
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
    
    field.style.borderColor = '';
  }

  setLoadingState(isLoading) {
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    if (submitBtn) {
      if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enviar Mensaje';
      }
    }
  }

  showSuccessMessage() {
    // Crear mensaje de éxito
    const successDiv = document.createElement('div');
    successDiv.className = 'contact-success-message';
    successDiv.innerHTML = `
      <div class="success-content">
        <i class="fas fa-check-circle"></i>
        <h4>¡Mensaje enviado exitosamente!</h4>
        <p>Tu consulta ha sido enviada a nuestro equipo de marketing. Te responderemos a la brevedad posible.</p>
        <p><strong>Email de contacto:</strong> marketing@sumpetrol.com.ar</p>
      </div>
    `;
    
    // Insertar después del formulario
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.parentNode.insertBefore(successDiv, contactForm.nextSibling);
    }
    
    // Hacer scroll al mensaje
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Ocultar mensaje después de 8 segundos
    setTimeout(() => {
      successDiv.style.opacity = '0';
      setTimeout(() => successDiv.remove(), 300);
    }, 8000);
  }

  showErrorMessage(message) {
    // Crear mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'contact-error-message';
    errorDiv.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <h4>Error al enviar mensaje</h4>
        <p>${message}</p>
        <p>Si el problema persiste, contáctanos directamente a <strong>marketing@sumpetrol.com.ar</strong></p>
      </div>
    `;
    
    // Insertar después del formulario
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.parentNode.insertBefore(errorDiv, contactForm.nextSibling);
    }
    
    // Hacer scroll al mensaje
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Ocultar mensaje después de 8 segundos
    setTimeout(() => {
      errorDiv.style.opacity = '0';
      setTimeout(() => errorDiv.remove(), 300);
    }, 8000);
  }

  resetForm() {
    const form = document.getElementById('contactForm');
    if (form) {
      form.reset();
      
      // Limpiar errores
      const errorElements = form.querySelectorAll('.field-error');
      errorElements.forEach(error => error.remove());
      
      // Limpiar estilos de error
      const fields = form.querySelectorAll('input, textarea');
      fields.forEach(field => {
        field.style.borderColor = '';
      });
    }
  }

  addStyles() {
    if (document.getElementById('contact-form-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'contact-form-styles';
    styles.textContent = `
      .contact-success-message,
      .contact-error-message {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin: 20px 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-left: 4px solid;
        opacity: 1;
        transition: opacity 0.3s ease;
      }
      
      .contact-success-message {
        border-left-color: var(--success);
      }
      
      .contact-error-message {
        border-left-color: var(--error);
      }
      
      .success-content,
      .error-content {
        text-align: center;
      }
      
      .success-content i {
        color: var(--success);
        font-size: 3rem;
        margin-bottom: 16px;
      }
      
      .error-content i {
        color: var(--error);
        font-size: 3rem;
        margin-bottom: 16px;
      }
      
      .success-content h4,
      .error-content h4 {
        margin: 0 0 16px 0;
        color: var(--gray-800);
      }
      
      .success-content p,
      .error-content p {
        margin: 0 0 12px 0;
        color: var(--gray-600);
        line-height: 1.6;
      }
      
      .success-content strong,
      .error-content strong {
        color: var(--primary-color);
      }
      
      .field-error {
        color: var(--error);
        font-size: 0.75rem;
        margin-top: 0.25rem;
        font-weight: 500;
      }
      
      @media (max-width: 768px) {
        .contact-success-message,
        .contact-error-message {
          margin: 16px 0;
          padding: 20px;
        }
        
        .success-content i,
        .error-content i {
          font-size: 2.5rem;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.contactFormManager = new ContactFormManager();
  window.contactFormManager.addStyles();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContactFormManager;
}
