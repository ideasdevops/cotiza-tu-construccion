/**
 * Cotizador de Construcción - Aplicación Principal
 * Maneja la inicialización y funcionalidades generales de la aplicación
 */

class ConstructionApp {
  constructor() {
    this.currentQuote = null;
    this.materials = [];
    this.constructionTypes = [];
    this.finishLevels = [];
    this.usageTypes = [];
    this.regions = [];
    
    this.init();
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    try {
      console.log('🚀 Iniciando Cotizador de Construcción...');
      
      // Cargar datos iniciales
      await this.loadInitialData();
      
      // Inicializar componentes
      this.initNavigation();
      this.initHeroPreview();
      this.initTypeCards();
      this.initScrollEffects();
      this.initContactForm();
      
      // Mostrar notificación de bienvenida
      this.showNotification('¡Bienvenido al Cotizador de Construcción!', 'info');
      
      console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando la aplicación:', error);
      this.showNotification('Error al cargar la aplicación', 'error');
    }
  }

  /**
   * Carga los datos iniciales de la aplicación
   */
  async loadInitialData() {
    try {
      // Cargar tipos de construcción
      const constructionResponse = await fetch('/api/construccion/tipos');
      this.constructionTypes = await constructionResponse.json();
      
      // Cargar niveles de terminación
      const finishResponse = await fetch('/api/construccion/terminaciones');
      this.finishLevels = await finishResponse.json();
      
      // Cargar tipos de uso
      const usageResponse = await fetch('/api/construccion/usos');
      this.usageTypes = await usageResponse.json();
      
      // Cargar precios de materiales
      const materialsResponse = await fetch('/api/materiales/precios');
      const materialsData = await materialsResponse.json();
      this.materials = materialsData.materiales;
      
      // Cargar multiplicadores regionales
      const regionsResponse = await fetch('/api/regiones/multiplicadores');
      const regionsData = await regionsResponse.json();
      this.regions = regionsData.multiplicadores;
      
      console.log('📊 Datos iniciales cargados:', {
        constructionTypes: this.constructionTypes.length,
        finishLevels: this.finishLevels.length,
        usageTypes: this.usageTypes.length,
        materials: this.materials.length,
        regions: Object.keys(this.regions).length
      });
      
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
      throw error;
    }
  }

  /**
   * Inicializa la navegación móvil
   */
  initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
      
      // Cerrar menú al hacer clic en un enlace
      const navLinks = navMenu.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });
    }
    
    // Navegación suave para enlaces internos
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /**
   * Inicializa la vista previa del hero
   */
  initHeroPreview() {
    const previewItems = document.querySelectorAll('.preview-item');
    
    previewItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remover clase active de todos los items
        previewItems.forEach(i => i.classList.remove('active'));
        
        // Agregar clase active al item clickeado
        item.classList.add('active');
        
        // Obtener el tipo de construcción
        const constructionType = item.dataset.type;
        
        // Actualizar información del hero
        this.updateHeroInfo(constructionType);
      });
    });
  }

  /**
   * Actualiza la información del hero según el tipo de construcción seleccionado
   */
  updateHeroInfo(constructionType) {
    const heroText = document.querySelector('.hero-text h2');
    const heroDescription = document.querySelector('.hero-text p');
    
    const typeInfo = {
      'steel-frame': {
        title: 'Steel Frame - Construcción Moderna',
        description: 'Sistema constructivo en seco con perfiles de acero galvanizado. Ideal para viviendas residenciales con excelente aislamiento térmico y acústico.'
      },
      'industrial': {
        title: 'Industrial - Estructuras Robustas',
        description: 'Construcciones industriales con hierros estructurales y metales. Perfecto para naves industriales, galpones y espacios de trabajo.'
      },
      'contenedor': {
        title: 'Contenedores - Solución Económica',
        description: 'Conversión de contenedores marítimos en módulos habitables. Solución económica, portátil y rápida para diversos usos.'
      }
    };
    
    if (typeInfo[constructionType]) {
      heroText.textContent = typeInfo[constructionType].title;
      heroDescription.textContent = typeInfo[constructionType].description;
      
      // Agregar animación
      heroText.classList.add('fade-in');
      heroDescription.classList.add('fade-in');
      
      setTimeout(() => {
        heroText.classList.remove('fade-in');
        heroDescription.classList.remove('fade-in');
      }, 500);
    }
  }

  /**
   * Inicializa las tarjetas de tipos de construcción
   */
  initTypeCards() {
    const typeCards = document.querySelectorAll('.type-card');
    
    typeCards.forEach(card => {
      card.addEventListener('click', () => {
        // Scroll suave a la sección de cotización
        const quoteSection = document.querySelector('#cotizador');
        if (quoteSection) {
          quoteSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
        
        // Seleccionar automáticamente el tipo en el formulario
        const constructionType = card.dataset.type;
        const typeSelect = document.querySelector('#tipo_construccion');
        if (typeSelect) {
          typeSelect.value = constructionType;
          
          // Disparar evento change para actualizar el formulario
          typeSelect.dispatchEvent(new Event('change'));
        }
        
        // Mostrar notificación
        this.showNotification(`Tipo de construcción seleccionado: ${constructionType}`, 'success');
      });
    });
  }

  /**
   * Inicializa efectos de scroll
   */
  initScrollEffects() {
    // Efecto de aparición en scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, observerOptions);
    
    // Observar elementos para animación
    const animatedElements = document.querySelectorAll('.type-card, .material-card, .form-section');
    animatedElements.forEach(el => observer.observe(el));
    
    // Efecto de navbar en scroll
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scroll hacia abajo
        navbar.style.transform = 'translateY(-100%)';
      } else {
        // Scroll hacia arriba
        navbar.style.transform = 'translateY(0)';
      }
      
      lastScrollTop = scrollTop;
    });
  }

  /**
   * Inicializa el formulario de contacto
   */
  initContactForm() {
    const contactForm = document.querySelector('#contactForm');
    
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const contactData = {
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message')
        };
        
        try {
          // Simular envío de formulario
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mostrar notificación de éxito
          this.showNotification('Mensaje enviado correctamente', 'success');
          
          // Limpiar formulario
          contactForm.reset();
          
        } catch (error) {
          console.error('Error enviando mensaje:', error);
          this.showNotification('Error al enviar el mensaje', 'error');
        }
      });
    }
  }

  /**
   * Muestra una notificación
   */
  showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Ocultar y remover después de 5 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Formatea un número como moneda argentina
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formatea un número con separadores de miles
   */
  formatNumber(number) {
    return new Intl.NumberFormat('es-AR').format(number);
  }

  /**
   * Valida un email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida un teléfono
   */
  validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Obtiene el multiplicador regional para una provincia
   */
  getRegionalMultiplier(provincia) {
    const normalizedProvince = provincia.toLowerCase().replace(/\s+/g, '_');
    return this.regions[normalizedProvince] || 1.0;
  }

  /**
   * Obtiene información de un tipo de construcción
   */
  getConstructionTypeInfo(type) {
    return this.constructionTypes.tipos?.find(t => t.id === type) || null;
  }

  /**
   * Obtiene información de un nivel de terminación
   */
  getFinishLevelInfo(level) {
    return this.finishLevels.niveles?.find(n => n.id === level) || null;
  }

  /**
   * Obtiene información de un tipo de uso
   */
  getUsageTypeInfo(usage) {
    return this.usageTypes.tipos?.find(t => t.id === usage) || null;
  }

  /**
   * Obtiene materiales por categoría
   */
  getMaterialsByCategory(category) {
    if (category === 'todos') {
      return this.materials;
    }
    return this.materials.filter(material => material.categoria === category);
  }

  /**
   * Actualiza el estado de carga de un elemento
   */
  setLoadingState(element, isLoading) {
    if (isLoading) {
      element.classList.add('loading');
      element.disabled = true;
    } else {
      element.classList.remove('loading');
      element.disabled = false;
    }
  }

  /**
   * Maneja errores de la aplicación
   */
  handleError(error, context = '') {
    console.error(`❌ Error en ${context}:`, error);
    
    let userMessage = 'Ha ocurrido un error inesperado';
    
    if (error.response) {
      // Error de respuesta HTTP
      userMessage = error.response.data?.error || userMessage;
    } else if (error.message) {
      // Error de JavaScript
      userMessage = error.message;
    }
    
    this.showNotification(userMessage, 'error');
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ConstructionApp();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConstructionApp;
}
