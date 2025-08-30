/**
 * Cotizador de Construcción - Módulo de Interfaz de Usuario
 * Maneja elementos de UI, animaciones y utilidades de la interfaz
 */

class UIManager {
  constructor() {
    this.isInitialized = false;
    this.currentTheme = 'light';
    this.animationsEnabled = true;
    
    this.init();
  }

  /**
   * Inicializa el gestor de UI
   */
  init() {
    if (this.isInitialized) return;
    
    this.initThemeToggle();
    this.initAnimations();
    this.initTooltips();
    this.initModals();
    this.initScrollToTop();
    this.initProgressBars();
    this.initCounters();
    
    this.isInitialized = true;
    console.log('✅ Gestor de UI inicializado');
  }

  /**
   * Inicializa el toggle de tema
   */
  initThemeToggle() {
    // Crear botón de toggle de tema si no existe
    this.createThemeToggle();
    
    const themeToggle = document.querySelector('#themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // Cargar tema guardado
    this.loadSavedTheme();
  }

  /**
   * Crea el botón de toggle de tema
   */
  createThemeToggle() {
    if (document.querySelector('#themeToggle')) return;
    
    const navbar = document.querySelector('.nav-content');
    if (!navbar) return;
    
    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.title = 'Cambiar tema';
    
    // Agregar estilos
    themeToggle.style.cssText = `
      background: none;
      border: none;
      color: var(--gray-700);
      font-size: 1.25rem;
      cursor: pointer;
      padding: var(--spacing-sm);
      border-radius: 50%;
      transition: all var(--transition-fast);
      margin-left: var(--spacing-md);
    `;
    
    navbar.appendChild(themeToggle);
  }

  /**
   * Cambia entre tema claro y oscuro
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    this.saveTheme();
    
    // Actualizar icono
    const themeToggle = document.querySelector('#themeToggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
      }
    }
  }

  /**
   * Aplica un tema específico
   */
  applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--white', '#1a1a1a');
      root.style.setProperty('--gray-50', '#2a2a2a');
      root.style.setProperty('--gray-100', '#3a3a3a');
      root.style.setProperty('--gray-200', '#4a4a4a');
      root.style.setProperty('--gray-300', '#5a5a5a');
      root.style.setProperty('--gray-400', '#6a6a6a');
      root.style.setProperty('--gray-500', '#7a7a7a');
      root.style.setProperty('--gray-600', '#8a8a8a');
      root.style.setProperty('--gray-700', '#9a9a9a');
      root.style.setProperty('--gray-800', '#aaaaaa');
      root.style.setProperty('--gray-900', '#ffffff');
    } else {
      root.style.setProperty('--white', '#ffffff');
      root.style.setProperty('--gray-50', '#f9fafb');
      root.style.setProperty('--gray-100', '#f3f4f6');
      root.style.setProperty('--gray-200', '#e5e7eb');
      root.style.setProperty('--gray-300', '#d1d5db');
      root.style.setProperty('--gray-400', '#9ca3af');
      root.style.setProperty('--gray-500', '#6b7280');
      root.style.setProperty('--gray-600', '#4b5563');
      root.style.setProperty('--gray-700', '#374151');
      root.style.setProperty('--gray-800', '#1f2937');
      root.style.setProperty('--gray-900', '#111827');
    }
  }

  /**
   * Guarda el tema en localStorage
   */
  saveTheme() {
    localStorage.setItem('construction-app-theme', this.currentTheme);
  }

  /**
   * Carga el tema guardado
   */
  loadSavedTheme() {
    const savedTheme = localStorage.getItem('construction-app-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme = savedTheme;
      this.applyTheme(this.currentTheme);
      
      // Actualizar icono
      const themeToggle = document.querySelector('#themeToggle');
      if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
          icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
      }
    }
  }

  /**
   * Inicializa las animaciones
   */
  initAnimations() {
    // Verificar preferencias de reducción de movimiento
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.animationsEnabled = false;
      return;
    }
    
    // Observador de intersección para animaciones
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.animationsEnabled) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);
    
    // Observar elementos animables
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
  }

  /**
   * Inicializa tooltips
   */
  initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        this.showTooltip(e.target, e.target.dataset.tooltip);
      });
      
      element.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  /**
   * Muestra un tooltip
   */
  showTooltip(element, text) {
    // Remover tooltip existente
    this.hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    
    // Posicionar tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 5}px;
      left: ${rect.left + (rect.width / 2)}px;
      transform: translateX(-50%);
      background: var(--gray-800);
      color: var(--white);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--border-radius-sm);
      font-size: 0.875rem;
      z-index: 10000;
      pointer-events: none;
      white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    // Agregar flecha
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 5px solid var(--gray-800);
    `;
    
    tooltip.appendChild(arrow);
  }

  /**
   * Oculta el tooltip
   */
  hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  /**
   * Inicializa modales
   */
  initModals() {
    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.remove();
      }
    });
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
          modal.remove();
        }
      }
    });
  }

  /**
   * Inicializa botón de scroll to top
   */
  initScrollToTop() {
    // Crear botón si no existe
    this.createScrollToTopButton();
    
    const scrollToTopBtn = document.querySelector('#scrollToTop');
    if (scrollToTopBtn) {
      // Mostrar/ocultar botón según scroll
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          scrollToTopBtn.classList.add('show');
        } else {
          scrollToTopBtn.classList.remove('show');
        }
      });
      
      // Scroll to top al hacer clic
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  /**
   * Crea el botón de scroll to top
   */
  createScrollToTopButton() {
    if (document.querySelector('#scrollToTop')) return;
    
    const button = document.createElement('button');
    button.id = 'scrollToTop';
    button.className = 'scroll-to-top';
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.title = 'Volver arriba';
    
    // Agregar estilos
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: var(--primary-color);
      color: var(--white);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: all var(--transition-normal);
      z-index: 1000;
      box-shadow: var(--shadow-lg);
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-3px)';
      button.style.boxShadow = 'var(--shadow-xl)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'var(--shadow-lg)';
    });
    
    document.body.appendChild(button);
    
    // Agregar estilos CSS
    const style = document.createElement('style');
    style.textContent = `
      .scroll-to-top.show {
        opacity: 1;
        visibility: visible;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Inicializa barras de progreso
   */
  initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach(bar => {
      const progress = bar.dataset.progress || 0;
      const fill = bar.querySelector('.progress-fill');
      
      if (fill) {
        setTimeout(() => {
          fill.style.width = `${progress}%`;
        }, 100);
      }
    });
  }

  /**
   * Inicializa contadores animados
   */
  initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target) || 0;
      const duration = parseInt(counter.dataset.duration) || 2000;
      const increment = target / (duration / 16); // 60fps
      let current = 0;
      
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };
      
      // Iniciar animación cuando sea visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCounter();
            observer.unobserve(entry.target);
          }
        });
      });
      
      observer.observe(counter);
    });
  }

  /**
   * Muestra un modal
   */
  showModal(content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = content;
    
    // Aplicar opciones
    if (options.width) {
      modalContent.style.maxWidth = options.width;
    }
    
    if (options.height) {
      modalContent.style.maxHeight = options.height;
    }
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Mostrar con animación
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);
    
    return modal;
  }

  /**
   * Muestra un modal de confirmación
   */
  showConfirmModal(message, onConfirm, onCancel) {
    const content = `
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Confirmar Acción</h3>
        </div>
        <div class="confirm-body">
          <p>${message}</p>
        </div>
        <div class="confirm-actions">
          <button class="btn outline" id="cancelBtn">Cancelar</button>
          <button class="btn primary" id="confirmBtn">Confirmar</button>
        </div>
      </div>
    `;
    
    const modal = this.showModal(content, { width: '400px' });
    
    // Agregar event listeners
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');
    
    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      modal.remove();
    });
    
    return modal;
  }

  /**
   * Muestra un modal de alerta
   */
  showAlertModal(message, type = 'info') {
    const iconMap = {
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle'
    };
    
    const colorMap = {
      info: 'var(--info)',
      success: 'var(--success)',
      warning: 'var(--warning)',
      error: 'var(--error)'
    };
    
    const content = `
      <div class="alert-modal">
        <div class="alert-icon" style="color: ${colorMap[type]}">
          <i class="${iconMap[type]} fa-3x"></i>
        </div>
        <div class="alert-message">
          <p>${message}</p>
        </div>
        <div class="alert-actions">
          <button class="btn primary" id="okBtn">Aceptar</button>
        </div>
      </div>
    `;
    
    const modal = this.showModal(content, { width: '400px' });
    
    const okBtn = modal.querySelector('#okBtn');
    okBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    return modal;
  }

  /**
   * Muestra un indicador de carga
   */
  showLoading(message = 'Cargando...') {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
    
    document.body.appendChild(loading);
    
    // Agregar estilos
    if (!document.querySelector('#loadingStyles')) {
      const style = document.createElement('style');
      style.id = 'loadingStyles';
      style.textContent = `
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        
        .loading-content {
          background: var(--white);
          padding: var(--spacing-2xl);
          border-radius: var(--border-radius-lg);
          text-align: center;
          box-shadow: var(--shadow-xl);
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--gray-200);
          border-top: 4px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto var(--spacing-lg);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    return loading;
  }

  /**
   * Oculta el indicador de carga
   */
  hideLoading(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.remove();
    }
  }

  /**
   * Crea una barra de progreso
   */
  createProgressBar(container, progress, options = {}) {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
      width: 100%;
      height: ${options.height || '8px'};
      background: var(--gray-200);
      border-radius: var(--border-radius-sm);
      overflow: hidden;
    `;
    
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.cssText = `
      height: 100%;
      background: ${options.color || 'var(--primary-color)'};
      width: 0;
      transition: width ${options.duration || '0.5s'} ease-out;
    `;
    
    progressBar.appendChild(fill);
    container.appendChild(progressBar);
    
    // Animar progreso
    setTimeout(() => {
      fill.style.width = `${progress}%`;
    }, 100);
    
    return progressBar;
  }

  /**
   * Crea un contador animado
   */
  createCounter(container, target, options = {}) {
    const counter = document.createElement('div');
    counter.className = 'counter';
    counter.dataset.target = target;
    counter.dataset.duration = options.duration || 2000;
    counter.textContent = '0';
    
    container.appendChild(counter);
    
    // Iniciar animación cuando sea visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(counter, target, options.duration || 2000);
          observer.unobserve(entry.target);
        }
      });
    });
    
    observer.observe(counter);
    
    return counter;
  }

  /**
   * Anima un contador
   */
  animateCounter(counter, target, duration) {
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };
    
    updateCounter();
  }

  /**
   * Habilita/deshabilita animaciones
   */
  toggleAnimations() {
    this.animationsEnabled = !this.animationsEnabled;
    
    if (!this.animationsEnabled) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
    
    // Guardar preferencia
    localStorage.setItem('construction-app-animations', this.animationsEnabled);
  }

  /**
   * Carga preferencias de animación
   */
  loadAnimationPreferences() {
    const savedPreference = localStorage.getItem('construction-app-animations');
    if (savedPreference !== null) {
      this.animationsEnabled = savedPreference === 'true';
      
      if (!this.animationsEnabled) {
        document.body.classList.add('no-animations');
      }
    }
  }

  /**
   * Obtiene el tamaño de la pantalla
   */
  getScreenSize() {
    const width = window.innerWidth;
    
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    return 'xl';
  }

  /**
   * Verifica si es dispositivo móvil
   */
  isMobile() {
    return this.getScreenSize() === 'xs' || this.getScreenSize() === 'sm';
  }

  /**
   * Verifica si es dispositivo táctil
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Obtiene la posición del scroll
   */
  getScrollPosition() {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }

  /**
   * Scroll suave a un elemento
   */
  smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Scroll suave a una posición
   */
  smoothScrollToPosition(position, offset = 0) {
    window.scrollTo({
      top: position - offset,
      behavior: 'smooth'
    });
  }
}

// Inicializar el gestor de UI cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
