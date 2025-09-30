/**
 * Sistema Anti-Bot para el Cotizador de Construcción
 * Implementa múltiples capas de protección contra bots y spam
 */

class AntiBotSystem {
  constructor() {
    this.formStartTime = Date.now();
    this.captchaAnswer = 10; // 7 + 3 = 10
    this.minFormTime = 5000; // Mínimo 5 segundos para completar el formulario
    this.maxFormTime = 300000; // Máximo 5 minutos para completar el formulario
    
    this.init();
  }

  /**
   * Inicializa el sistema anti-bot
   */
  init() {
    console.log('🛡️ Sistema anti-bot inicializado');
    
    // Establecer tiempo de inicio del formulario
    this.setFormStartTime();
    
    // Configurar validación del captcha
    this.setupCaptchaValidation();
    
      // Configurar validación de tiempo
    this.setupTimeValidation();
    
    // Configurar honeypot
    this.setupHoneypot();
    
    // Configurar validación de comportamiento
    this.setupBehaviorValidation();
  }

  /**
   * Establece el tiempo de inicio del formulario
   */
  setFormStartTime() {
    const formStartTimeInput = document.getElementById('formStartTime');
    if (formStartTimeInput) {
      formStartTimeInput.value = this.formStartTime;
    }
  }

  /**
   * Configura la validación del captcha
   */
  setupCaptchaValidation() {
    const captchaInput = document.getElementById('captchaInput');
    const captchaError = document.getElementById('captchaError');
    
    if (captchaInput && captchaError) {
      // Validar en tiempo real
      captchaInput.addEventListener('input', (e) => {
        this.validateCaptcha(e.target.value);
      });
      
      // Validar al enviar el formulario
      captchaInput.addEventListener('blur', (e) => {
        this.validateCaptcha(e.target.value);
      });
    }
  }

  /**
   * Valida la respuesta del captcha
   */
  validateCaptcha(answer) {
    const captchaInput = document.getElementById('captchaInput');
    const captchaError = document.getElementById('captchaError');
    
    if (!captchaInput || !captchaError) return;
    
    const userAnswer = parseInt(answer);
    
    if (userAnswer === this.captchaAnswer) {
      // Respuesta correcta
      captchaInput.style.borderColor = '#10B981'; // Verde
      captchaInput.style.backgroundColor = '#F0FDF4';
      captchaError.style.display = 'none';
      
      // Agregar clase de éxito
      captchaInput.classList.add('captcha-success');
      captchaInput.classList.remove('captcha-error');
      
      return true;
    } else if (answer.length > 0) {
      // Respuesta incorrecta
      captchaInput.style.borderColor = '#EF4444'; // Rojo
      captchaInput.style.backgroundColor = '#FEF2F2';
      captchaError.style.display = 'flex';
      
      // Agregar clase de error
      captchaInput.classList.add('captcha-error');
      captchaInput.classList.remove('captcha-success');
      
      return false;
    } else {
      // Campo vacío
      captchaInput.style.borderColor = '#D1D5DB'; // Gris
      captchaInput.style.backgroundColor = '#FFFFFF';
      captchaError.style.display = 'none';
      
      // Remover clases
      captchaInput.classList.remove('captcha-success', 'captcha-error');
      
      return false;
    }
  }

  /**
   * Configura la validación de tiempo
   */
  setupTimeValidation() {
    const form = document.getElementById('quoteForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        if (!this.validateFormTime()) {
          e.preventDefault();
          this.showTimeError();
          return false;
        }
        
        // Establecer tiempo de envío
        this.setFormSubmissionTime();
      });
    }
  }

  /**
   * Valida el tiempo del formulario
   */
  validateFormTime() {
    const currentTime = Date.now();
    const formTime = currentTime - this.formStartTime;
    
    console.log(`⏱️ Tiempo del formulario: ${formTime}ms`);
    
    // Verificar tiempo mínimo
    if (formTime < this.minFormTime) {
      console.warn('⚠️ Formulario enviado muy rápido (posible bot)');
      return false;
    }
    
    // Verificar tiempo máximo
    if (formTime > this.maxFormTime) {
      console.warn('⚠️ Formulario tardó demasiado (posible timeout)');
      return false;
    }
    
    return true;
  }

  /**
   * Establece el tiempo de envío del formulario
   */
  setFormSubmissionTime() {
    const formSubmissionTimeInput = document.getElementById('formSubmissionTime');
    if (formSubmissionTimeInput) {
      formSubmissionTimeInput.value = Date.now();
    }
  }

  /**
   * Configura el honeypot
   */
  setupHoneypot() {
    const honeypotField = document.getElementById('website');
    if (honeypotField) {
      // Los bots suelen llenar todos los campos
      honeypotField.addEventListener('input', (e) => {
        if (e.target.value.length > 0) {
          console.warn('🚫 Honeypot activado - posible bot detectado');
          this.flagAsBot('honeypot_field_filled');
        }
      });
    }
  }

  /**
   * Configura la validación de comportamiento
   */
  setupBehaviorValidation() {
    const form = document.getElementById('quoteForm');
    if (form) {
      // Detectar envío múltiple
      let submitCount = 0;
      const maxSubmits = 3;
      
      form.addEventListener('submit', () => {
        submitCount++;
        if (submitCount > maxSubmits) {
          console.warn('🚫 Demasiados envíos - posible bot');
          this.flagAsBot('multiple_submissions');
          return false;
        }
      });
      
      // Solo validar comportamiento al enviar, no durante la interacción
      // Removido: detección automática de cambios sospechosos
    }
  }

  /**
   * Detecta comportamiento sospechoso
   */
  detectSuspiciousBehavior(event) {
    const input = event.target;
    const value = input.value;
    
    // Detectar cambios muy rápidos
    if (input.dataset.lastChange) {
      const timeDiff = Date.now() - parseInt(input.dataset.lastChange);
      if (timeDiff < 100) { // Menos de 100ms entre cambios
        console.warn('🚫 Cambios muy rápidos detectados');
        this.flagAsBot('rapid_field_changes');
      }
    }
    
    // Detectar patrones sospechosos
    if (this.isSuspiciousPattern(value)) {
      console.warn('🚫 Patrón sospechoso detectado');
      this.flagAsBot('suspicious_pattern');
    }
    
    // Actualizar timestamp del último cambio
    input.dataset.lastChange = Date.now();
  }

  /**
   * Verifica si un valor tiene un patrón sospechoso
   */
  isSuspiciousPattern(value) {
    if (!value || value.length < 3) return false;
    
    // Patrones típicos de bots
    const suspiciousPatterns = [
      /^[a-z]{1}[0-9]{1}[a-z]{1}[0-9]{1}$/i, // a1b2c3
      /^[0-9]{6,}$/, // Solo números largos
      /^[a-z]{6,}$/i, // Solo letras largas
      /^(.)\1{5,}$/, // Caracteres repetidos
      /^[a-z0-9]{20,}$/i // Strings muy largos sin espacios
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Marca el formulario como enviado por un bot
   */
  flagAsBot(reason) {
    console.error(`🚫 BOT DETECTADO - Razón: ${reason}`);
    
    // Mostrar mensaje de error
    this.showBotError();
    
    // Bloquear envío del formulario
    const form = document.getElementById('quoteForm');
    if (form) {
      form.style.pointerEvents = 'none';
      form.style.opacity = '0.5';
    }
    
    // Registrar en analytics (si está disponible)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'bot_detected', {
        'event_category': 'security',
        'event_label': reason
      });
    }
  }

  /**
   * Muestra error de bot detectado
   */
  showBotError() {
    const errorMessage = `
      <div class="bot-error-message" style="
        background: #FEF2F2;
        border: 2px solid #EF4444;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        color: #991B1B;
        text-align: center;
        font-weight: 600;
      ">
        <i class="fas fa-exclamation-triangle" style="color: #EF4444; margin-right: 8px;"></i>
        Actividad sospechosa detectada. Por favor, completa el formulario de manera natural.
      </div>
    `;
    
    const form = document.getElementById('quoteForm');
    if (form) {
      form.insertAdjacentHTML('beforebegin', errorMessage);
      
      // Remover mensaje después de 10 segundos
      setTimeout(() => {
        const errorElement = document.querySelector('.bot-error-message');
        if (errorElement) {
          errorElement.remove();
        }
        
        // Restaurar formulario
        form.style.pointerEvents = 'auto';
        form.style.opacity = '1';
      }, 10000);
    }
  }

  /**
   * Muestra error de tiempo
   */
  showTimeError() {
    const errorMessage = `
      <div class="time-error-message" style="
        background: #FEF2F2;
        border: 2px solid #EF4444;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        color: #991B1B;
        text-align: center;
        font-weight: 600;
      ">
        <i class="fas fa-clock" style="color: #EF4444; margin-right: 8px;"></i>
        Por favor, tómate tu tiempo para completar el formulario correctamente.
      </div>
    `;
    
    const form = document.getElementById('quoteForm');
    if (form) {
      form.insertAdjacentHTML('beforebegin', errorMessage);
      
      // Remover mensaje después de 5 segundos
      setTimeout(() => {
        const errorElement = document.querySelector('.time-error-message');
        if (errorElement) {
          errorElement.remove();
        }
      }, 5000);
    }
  }

  /**
   * Valida todo el sistema anti-bot antes del envío
   */
  validateAll() {
    const captchaValid = this.validateCaptcha(
      document.getElementById('captchaInput')?.value || ''
    );
    const timeValid = this.validateFormTime();
    
    console.log(`🛡️ Validación anti-bot: Captcha=${captchaValid}, Tiempo=${timeValid}`);
    
    return captchaValid && timeValid;
  }

  /**
   * Valida el formulario de contacto
   */
  validateContactForm() {
    const captchaInput = document.getElementById('contactCaptchaInput');
    const captchaError = document.getElementById('contactCaptchaError');
    
    if (!captchaInput || !captchaError) return true;
    
    const userAnswer = parseInt(captchaInput.value);
    const correctAnswer = 9; // 5 + 4 = 9
    
    if (userAnswer === correctAnswer) {
      captchaInput.style.borderColor = '#10B981';
      captchaInput.style.backgroundColor = '#F0FDF4';
      captchaError.style.display = 'none';
      return true;
    } else {
      captchaInput.style.borderColor = '#EF4444';
      captchaInput.style.backgroundColor = '#FEF2F2';
      captchaError.style.display = 'flex';
      return false;
    }
  }

  /**
   * Genera un nuevo captcha
   */
  generateNewCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    this.captchaAnswer = num1 + num2;
    
    const questionElement = document.querySelector('.captcha-question');
    if (questionElement) {
      questionElement.textContent = `¿Cuánto es ${num1} + ${num2}?`;
    }
    
    // Limpiar input
    const captchaInput = document.getElementById('captchaInput');
    if (captchaInput) {
      captchaInput.value = '';
      captchaInput.style.borderColor = '#D1D5DB';
      captchaInput.style.backgroundColor = '#FFFFFF';
      captchaInput.classList.remove('captcha-success', 'captcha-error');
    }
    
    // Ocultar error
    const captchaError = document.getElementById('captchaError');
    if (captchaError) {
      captchaError.style.display = 'none';
    }
    
    console.log(`🔄 Nuevo captcha generado: ${num1} + ${num2} = ${this.captchaAnswer}`);
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    return {
      formStartTime: this.formStartTime,
      currentTime: Date.now(),
      formDuration: Date.now() - this.formStartTime,
      minFormTime: this.minFormTime,
      maxFormTime: this.maxFormTime,
      captchaAnswer: this.captchaAnswer
    };
  }
}

// Inicializar sistema anti-bot cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.antiBotSystem = new AntiBotSystem();
  
  // Agregar botón para generar nuevo captcha en el formulario principal
  const captchaSection = document.querySelector('.captcha-challenge');
  if (captchaSection) {
    const refreshButton = document.createElement('button');
    refreshButton.type = 'button';
    refreshButton.className = 'btn outline small';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Nuevo Captcha';
    refreshButton.style.marginTop = '8px';
    refreshButton.addEventListener('click', () => {
      window.antiBotSystem.generateNewCaptcha();
    });
    
    captchaSection.appendChild(refreshButton);
  }
  
  // Configurar validación del formulario de contacto
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      if (!window.antiBotSystem.validateContactForm()) {
        e.preventDefault();
        return false;
      }
    });
  }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntiBotSystem;
}
