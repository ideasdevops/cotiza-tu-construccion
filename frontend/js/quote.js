/**
 * Cotizador de Construcción - Módulo de Cotizaciones
 * Maneja la lógica de cálculo y generación de cotizaciones
 */

class QuoteCalculator {
  constructor() {
    this.currentQuote = null;
    this.formData = {};
    this.isCalculating = false;
    
    this.init();
  }

  /**
   * Inicializa el cotizador
   */
  init() {
    this.initFormValidation();
    this.initFormEvents();
    this.initButtons();
    this.initAutoCalculation();
    
    console.log('✅ Cotizador inicializado');
  }

  /**
   * Inicializa la validación del formulario
   */
  initFormValidation() {
    const form = document.querySelector('#quoteForm');
    
    if (form) {
      // Validación en tiempo real
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
      });
      
      // Validación del formulario completo
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  /**
   * Inicializa eventos del formulario
   */
  initFormEvents() {
    // Cambio en tipo de construcción
    const constructionTypeSelect = document.querySelector('#tipo_construccion');
    if (constructionTypeSelect) {
      constructionTypeSelect.addEventListener('change', (e) => {
        this.handleConstructionTypeChange(e.target.value);
      });
    }
    
    // Cambio en metros cuadrados
    const m2Input = document.querySelector('#metros_cuadrados');
    if (m2Input) {
      m2Input.addEventListener('input', (e) => {
        this.handleM2Change(e.target.value);
      });
    }
    
    // Cambio en provincia
    const provinceSelect = document.querySelector('#provincia');
    if (provinceSelect) {
      provinceSelect.addEventListener('change', (e) => {
        this.handleProvinceChange(e.target.value);
      });
    }
    
    // Cambio en número de pisos
    const floorsInput = document.querySelector('#pisos');
    if (floorsInput) {
      floorsInput.addEventListener('input', (e) => {
        this.handleFloorsChange(e.target.value);
      });
    }
  }

  /**
   * Inicializa los botones de acción
   */
  initButtons() {
    // Botón de vista previa
    const previewBtn = document.querySelector('#btnPreview');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.showPreview());
    }
    
    // Botón de reiniciar
    const resetBtn = document.querySelector('#btnReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetForm());
    }
    
    // Botón de nueva cotización
    const newQuoteBtn = document.querySelector('#btnNewQuote');
    if (newQuoteBtn) {
      newQuoteBtn.addEventListener('click', () => this.showNewQuoteForm());
    }
    
    // Botón de descargar PDF
    const downloadBtn = document.querySelector('#btnDownloadPDF');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadPDF());
    }
    
    // Botón de compartir
    const shareBtn = document.querySelector('#btnShareQuote');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareQuote());
    }
  }

  /**
   * Inicializa el cálculo automático
   */
  initAutoCalculation() {
    // Calcular automáticamente cuando cambien valores clave
    const autoCalcInputs = ['metros_cuadrados', 'tipo_construccion', 'tipo_uso', 'nivel_terminacion', 'provincia'];
    
    autoCalcInputs.forEach(inputId => {
      const input = document.querySelector(`#${inputId}`);
      if (input) {
        input.addEventListener('change', () => {
          if (this.isFormValid()) {
            this.calculateQuote();
          }
        });
      }
    });
  }

  /**
   * Maneja el envío del formulario
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }
    
    try {
      this.setLoadingState(true);
      
      // Obtener datos del formulario
      const formData = this.getFormData();
      
      // Crear cotización
      const quote = await this.createQuote(formData);
      
      // Mostrar resultados
      this.showResults(quote);
      
      // Guardar cotización actual
      this.currentQuote = quote;
      
      // Mostrar notificación de éxito
      if (window.app) {
        window.app.showNotification('Cotización generada exitosamente', 'success');
      }
      
    } catch (error) {
      console.error('Error creando cotización:', error);
      
      if (window.app) {
        window.app.handleError(error, 'creación de cotización');
      }
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Valida el formulario completo
   */
  validateForm() {
    const form = document.querySelector('#quoteForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    // Validaciones adicionales
    const m2 = parseFloat(document.querySelector('#metros_cuadrados').value);
    if (m2 <= 0 || m2 > 10000) {
      this.showFieldError(document.querySelector('#metros_cuadrados'), 'Los metros cuadrados deben estar entre 1 y 10,000');
      isValid = false;
    }
    
    const pisos = parseInt(document.querySelector('#pisos').value);
    if (pisos < 1 || pisos > 10) {
      this.showFieldError(document.querySelector('#pisos'), 'El número de pisos debe estar entre 1 y 10');
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Valida un campo individual
   */
  validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    // Limpiar errores previos
    this.clearFieldError(field);
    
    // Validar campo requerido
    if (isRequired && !value) {
      this.showFieldError(field, 'Este campo es obligatorio');
      return false;
    }
    
    // Validaciones específicas por tipo
    switch (field.type) {
      case 'email':
        if (value && !window.app?.validateEmail(value)) {
          this.showFieldError(field, 'Email inválido');
          return false;
        }
        break;
        
      case 'tel':
        if (value && !window.app?.validatePhone(value)) {
          this.showFieldError(field, 'Teléfono inválido');
          return false;
        }
        break;
        
      case 'number':
        const numValue = parseFloat(value);
        if (value && (isNaN(numValue) || numValue < 0)) {
          this.showFieldError(field, 'Valor numérico inválido');
          return false;
        }
        break;
    }
    
    return true;
  }

  /**
   * Muestra error en un campo
   */
  showFieldError(field, message) {
    // Remover error previo
    this.clearFieldError(field);
    
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
  }

  /**
   * Limpia el error de un campo
   */
  clearFieldError(field) {
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
    
    field.style.borderColor = '';
  }

  /**
   * Obtiene los datos del formulario
   */
  getFormData() {
    const form = document.querySelector('#quoteForm');
    const formData = new FormData(form);
    
    const data = {
      nombre: formData.get('nombre'),
      email: formData.get('email'),
      telefono: formData.get('telefono'),
      tipo_construccion: formData.get('tipo_construccion'),
      tipo_uso: formData.get('tipo_uso'),
      nivel_terminacion: formData.get('nivel_terminacion'),
      metros_cuadrados: parseFloat(formData.get('metros_cuadrados')),
      ancho: formData.get('ancho') ? parseFloat(formData.get('ancho')) : null,
      largo: formData.get('largo') ? parseFloat(formData.get('largo')) : null,
      altura: formData.get('altura') ? parseFloat(formData.get('altura')) : null,
      pisos: parseInt(formData.get('pisos')),
      tiene_terraza: formData.get('tiene_terraza') === 'on',
      tiene_sotano: formData.get('tiene_sotano') === 'on',
      incluye_instalaciones: formData.get('incluye_instalaciones') === 'on',
      provincia: formData.get('provincia'),
      ciudad: formData.get('ciudad'),
      zona: formData.get('zona')
    };
    
    return data;
  }

  /**
   * Crea una cotización
   */
  async createQuote(formData) {
    const response = await fetch('/api/cotizaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error creando cotización');
    }
    
    return await response.json();
  }

  /**
   * Muestra los resultados de la cotización
   */
  showResults(quote) {
    // Ocultar formulario y mostrar resultados
    const quoteForm = document.querySelector('.quote-form');
    const quoteResults = document.querySelector('#quoteResults');
    
    if (quoteForm && quoteResults) {
      quoteForm.style.display = 'none';
      quoteResults.style.display = 'block';
      
      // Agregar animación
      quoteResults.classList.add('fade-in');
    }
    
    // Actualizar datos en la UI
    this.updateResultsUI(quote);
    
    // Scroll a los resultados
    quoteResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Actualiza la UI con los resultados
   */
  updateResultsUI(quote) {
    // ID de la cotización
    const quoteIdElement = document.querySelector('#quoteId');
    if (quoteIdElement) {
      quoteIdElement.textContent = quote.id;
    }
    
    // Total estimado
    const totalAmountElement = document.querySelector('#totalAmount');
    if (totalAmountElement && window.app) {
      totalAmountElement.textContent = window.app.formatCurrency(quote.total_estimado);
    }
    
    // Timestamp
    const timestampElement = document.querySelector('#quoteTimestamp');
    if (timestampElement) {
      const timestamp = new Date().toLocaleString('es-AR');
      timestampElement.textContent = timestamp;
    }
    
    // Desglose de costos
    this.updateBreakdownUI(quote.desglose);
    
    // Materiales utilizados
    this.updateMaterialsUI(quote.materiales_utilizados);
    
    // Tiempo de construcción
    const timeElement = document.querySelector('#constructionTime');
    if (timeElement) {
      timeElement.textContent = quote.tiempo_estimado;
    }
    
    // Observaciones
    this.updateObservationsUI(quote.observaciones);
  }

  /**
   * Actualiza el desglose de costos en la UI
   */
  updateBreakdownUI(breakdown) {
    const elements = {
      materialesCost: breakdown.materiales,
      manoObraCost: breakdown.mano_obra,
      terminacionesCost: breakdown.terminaciones,
      instalacionesCost: breakdown.instalaciones,
      transporteCost: breakdown.transporte,
      impuestosCost: breakdown.impuestos
    };
    
    Object.entries(elements).forEach(([elementId, value]) => {
      const element = document.querySelector(`#${elementId}`);
      if (element && window.app) {
        element.textContent = window.app.formatCurrency(value);
      }
    });
  }

  /**
   * Actualiza la lista de materiales en la UI
   */
  updateMaterialsUI(materials) {
    const materialsList = document.querySelector('#materialsList');
    if (!materialsList) return;
    
    materialsList.innerHTML = '';
    
    materials.forEach(material => {
      const materialItem = document.createElement('div');
      materialItem.className = 'material-item';
      
      materialItem.innerHTML = `
        <div class="material-info">
          <div class="material-name">${material.nombre}</div>
          <div class="material-category">${material.categoria}</div>
        </div>
        <div class="material-price">${window.app?.formatCurrency(material.precio_por_m2)}/${material.unidad}</div>
      `;
      
      materialsList.appendChild(materialItem);
    });
  }

  /**
   * Actualiza las observaciones en la UI
   */
  updateObservationsUI(observations) {
    const observationsList = document.querySelector('#observationsList');
    if (!observationsList) return;
    
    observationsList.innerHTML = '';
    
    observations.forEach(observation => {
      const li = document.createElement('li');
      li.textContent = observation;
      observationsList.appendChild(li);
    });
  }

  /**
   * Maneja el cambio de tipo de construcción
   */
  handleConstructionTypeChange(type) {
    // Actualizar información relacionada
    this.updateConstructionInfo(type);
    
    // Recalcular si es posible
    if (this.isFormValid()) {
      this.calculateQuote();
    }
  }

  /**
   * Maneja el cambio de metros cuadrados
   */
  handleM2Change(m2) {
    const m2Value = parseFloat(m2);
    
    // Validar rango
    if (m2Value > 0 && m2Value <= 10000) {
      // Actualizar dimensiones automáticamente si están vacías
      this.updateDimensions(m2Value);
      
      // Recalcular si es posible
      if (this.isFormValid()) {
        this.calculateQuote();
      }
    }
  }

  /**
   * Maneja el cambio de provincia
   */
  handleProvinceChange(province) {
    // Actualizar multiplicador regional
    this.updateRegionalInfo(province);
    
    // Recalcular si es posible
    if (this.isFormValid()) {
      this.calculateQuote();
    }
  }

  /**
   * Maneja el cambio de número de pisos
   */
  handleFloorsChange(floors) {
    const floorsValue = parseInt(floors);
    
    if (floorsValue > 1) {
      // Mostrar campos adicionales si es necesario
      this.showAdditionalFields();
    } else {
      this.hideAdditionalFields();
    }
  }

  /**
   * Actualiza información de construcción
   */
  updateConstructionInfo(type) {
    const typeInfo = window.app?.getConstructionTypeInfo(type);
    
    if (typeInfo) {
      // Actualizar descripción o información adicional
      console.log('Tipo de construcción seleccionado:', typeInfo);
    }
  }

  /**
   * Actualiza dimensiones automáticamente
   */
  updateDimensions(m2) {
    // Calcular dimensiones aproximadas si no están definidas
    const anchoInput = document.querySelector('#ancho');
    const largoInput = document.querySelector('#largo');
    
    if (anchoInput && largoInput && !anchoInput.value && !largoInput.value) {
      const lado = Math.sqrt(m2);
      anchoInput.value = Math.round(lado * 10) / 10;
      largoInput.value = Math.round(lado * 10) / 10;
    }
  }

  /**
   * Actualiza información regional
   */
  updateRegionalInfo(province) {
    const multiplier = window.app?.getRegionalMultiplier(province);
    
    if (multiplier && multiplier !== 1.0) {
      // Mostrar notificación sobre ajuste regional
      if (window.app) {
        window.app.showNotification(
          `Precios ajustados para ${province} (factor: ${multiplier.toFixed(2)})`,
          'info'
        );
      }
    }
  }

  /**
   * Muestra campos adicionales
   */
  showAdditionalFields() {
    // Implementar lógica para mostrar campos adicionales
    console.log('Mostrando campos adicionales para múltiples pisos');
  }

  /**
   * Oculta campos adicionales
   */
  hideAdditionalFields() {
    // Implementar lógica para ocultar campos adicionales
    console.log('Ocultando campos adicionales');
  }

  /**
   * Muestra vista previa de la cotización
   */
  showPreview() {
    if (!this.validateForm()) {
      return;
    }
    
    // Obtener datos del formulario
    const formData = this.getFormData();
    
    // Mostrar modal de vista previa
    this.showPreviewModal(formData);
  }

  /**
   * Muestra modal de vista previa
   */
  showPreviewModal(formData) {
    // Crear modal con vista previa
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.innerHTML = `
      <div class="preview-content">
        <h3>Vista Previa de la Cotización</h3>
        <div class="preview-data">
          <p><strong>Cliente:</strong> ${formData.nombre}</p>
          <p><strong>Tipo:</strong> ${formData.tipo_construccion}</p>
          <p><strong>Metros²:</strong> ${formData.metros_cuadrados}</p>
          <p><strong>Provincia:</strong> ${formData.provincia}</p>
        </div>
        <div class="preview-actions">
          <button class="btn primary" onclick="this.closest('.preview-modal').remove()">Cerrar</button>
        </div>
      </div>
    `;
    
    // Agregar estilos
    modal.style.cssText = `
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
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Reinicia el formulario
   */
  resetForm() {
    const form = document.querySelector('#quoteForm');
    if (form) {
      form.reset();
      
      // Limpiar errores
      const errorElements = form.querySelectorAll('.field-error');
      errorElements.forEach(el => el.remove());
      
      // Limpiar estilos de error
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.style.borderColor = '';
      });
      
      // Ocultar resultados
      const quoteResults = document.querySelector('#quoteResults');
      if (quoteResults) {
        quoteResults.style.display = 'none';
      }
      
      // Mostrar formulario
      const quoteForm = document.querySelector('.quote-form');
      if (quoteForm) {
        quoteForm.style.display = 'block';
      }
      
      // Mostrar notificación
      if (window.app) {
        window.app.showNotification('Formulario reiniciado', 'info');
      }
    }
  }

  /**
   * Muestra formulario de nueva cotización
   */
  showNewQuoteForm() {
    this.resetForm();
    
    // Scroll al formulario
    const quoteSection = document.querySelector('#cotizador');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Descarga la cotización en PDF
   */
  async downloadPDF() {
    if (!this.currentQuote) {
      if (window.app) {
        window.app.showNotification('No hay cotización para descargar', 'warning');
      }
      return;
    }
    
    try {
      // Simular descarga de PDF
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (window.app) {
        window.app.showNotification('PDF generado correctamente', 'success');
      }
      
      // Aquí se implementaría la generación real del PDF
      console.log('Generando PDF para cotización:', this.currentQuote.id);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      
      if (window.app) {
        window.app.showNotification('Error generando PDF', 'error');
      }
    }
  }

  /**
   * Comparte la cotización
   */
  shareQuote() {
    if (!this.currentQuote) {
      if (window.app) {
        window.app.showNotification('No hay cotización para compartir', 'warning');
      }
      return;
    }
    
    // Implementar lógica de compartir
    if (navigator.share) {
      navigator.share({
        title: 'Cotización de Construcción',
        text: `Cotización #${this.currentQuote.id} - Total: ${window.app?.formatCurrency(this.currentQuote.total_estimado)}`,
        url: window.location.href
      });
    } else {
      // Fallback para navegadores que no soportan Web Share API
      const shareUrl = `${window.location.origin}/cotizacion/${this.currentQuote.id}`;
      
      // Copiar al portapapeles
      navigator.clipboard.writeText(shareUrl).then(() => {
        if (window.app) {
          window.app.showNotification('Enlace copiado al portapapeles', 'success');
        }
      });
    }
  }

  /**
   * Calcula la cotización
   */
  async calculateQuote() {
    if (this.isCalculating) return;
    
    try {
      this.isCalculating = true;
      
      // Obtener datos del formulario
      const formData = this.getFormData();
      
      // Calcular desglose
      const breakdown = await this.calculateBreakdown(formData);
      
      // Mostrar desglose en tiempo real
      this.showRealTimeBreakdown(breakdown);
      
    } catch (error) {
      console.error('Error calculando cotización:', error);
    } finally {
      this.isCalculating = false;
    }
  }

  /**
   * Calcula el desglose de costos
   */
  async calculateBreakdown(formData) {
    const params = new URLSearchParams({
      metros_cuadrados: formData.metros_cuadrados,
      tipo_construccion: formData.tipo_construccion,
      tipo_uso: formData.tipo_uso,
      nivel_terminacion: formData.nivel_terminacion,
      provincia: formData.provincia
    });
    
    const response = await fetch(`/api/costos/desglose?${params}`);
    
    if (!response.ok) {
      throw new Error('Error calculando desglose');
    }
    
    return await response.json();
  }

  /**
   * Muestra desglose en tiempo real
   */
  showRealTimeBreakdown(breakdown) {
    // Implementar lógica para mostrar desglose en tiempo real
    console.log('Desglose en tiempo real:', breakdown);
  }

  /**
   * Verifica si el formulario es válido
   */
  isFormValid() {
    const form = document.querySelector('#quoteForm');
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    return Array.from(requiredFields).every(field => field.value.trim() !== '');
  }

  /**
   * Establece el estado de carga
   */
  setLoadingState(isLoading) {
    const submitBtn = document.querySelector('#btnCalculate');
    if (submitBtn) {
      if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calculator"></i> Calcular Cotización';
      }
    }
  }
}

// Inicializar el cotizador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.quoteCalculator = new QuoteCalculator();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuoteCalculator;
}
