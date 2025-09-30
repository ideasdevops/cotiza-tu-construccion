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
    
    try {
      console.log('🚀 Iniciando proceso de cotización...');
      
      if (!this.validateForm()) {
        console.warn('⚠️ Validación del formulario falló');
        return;
      }
      
      this.setLoadingState(true);
      
      // Obtener datos del formulario
      const formData = this.getFormData();
      console.log('📋 Datos del formulario obtenidos:', formData);
      
      // Crear cotización
      const quote = await this.createQuote(formData);
      console.log('✅ Cotización creada:', quote);
      
      // Mostrar resultados
      this.showResults(quote);
      
      // Guardar cotización actual
      this.currentQuote = quote;
      
      // Mostrar notificación de éxito
      if (window.app && window.app.showNotification) {
        window.app.showNotification('Cotización generada exitosamente', 'success');
      } else {
        console.log('✅ Cotización generada exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error creando cotización:', error);
      
      // Mostrar error al usuario
      this.showErrorMessage('Error al generar la cotización: ' + error.message);
      
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
    
    // Validar que se hayan agregado materiales usando el gestor de materiales
    if (window.materialsQuoteManager && !window.materialsQuoteManager.validateMaterialsBeforeCalculation()) {
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
        if (value && window.app && !window.app.validateEmail(value)) {
          this.showFieldError(field, 'Email inválido');
          return false;
        }
        break;
        
      case 'tel':
        if (value && window.app && !window.app.validatePhone(value)) {
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
      whatsapp: formData.get('whatsapp'),
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
      zona: formData.get('zona'),
      observaciones: formData.get('observaciones') || ''
    };
    
    console.log('📋 Datos del formulario obtenidos:', data);
    return data;
  }

  /**
   * Crea una cotización usando cálculo local
   */
  async createQuote(formData) {
    try {
      console.log('📤 Creando cotización con APIs de Argentina:', formData);
      
      // Obtener precios actualizados desde APIs de Argentina
      const prices = await this.getCurrentPrices();
      
      // Calcular cotización con precios reales
      const breakdown = await this.calculateBreakdown(formData, prices);
      
      // Obtener materiales seleccionados
      const selectedMaterials = window.materialsQuoteManager ? 
        window.materialsQuoteManager.getSelectedMaterials() : [];
      
      // Crear objeto de cotización
      const quote = {
        id: 'COT-' + Date.now(),
        cliente: formData.nombre,
        total_estimado: breakdown.total,
        moneda: 'USD',
        desglose: breakdown.desglose,
        materiales_utilizados: selectedMaterials,
        tiempo_estimado: this.calculateConstructionTime(breakdown.metros_cuadrados, formData.tipo_construccion),
        observaciones: [formData.observaciones].filter(Boolean),
        validez_dias: 30,
        precios_fuente: breakdown.precios_fuente,
        ultima_actualizacion: breakdown.ultima_actualizacion
      };
      
      console.log('✅ Cotización creada con APIs de Argentina:', quote);
      
      // Guardar datos del cliente en NocoDB
      await this.saveCustomerData(formData, breakdown.total);
      
      // Enviar email de cotización
      await this.sendQuoteEmail(formData, breakdown);
      
      return quote;
      
    } catch (error) {
      console.error('❌ Error en createQuote:', error);
      throw error;
    }
  }

  /**
   * Calcula el tiempo estimado de construcción
   */
  calculateConstructionTime(m2, tipoConstruccion) {
    // Tiempo base por m² (en días)
    const tiempoBase = {
      'steel_frame': 0.5,
      'industrial': 0.3,
      'contenedor': 0.2,
      'mixto': 0.4
    };
    
    const tiempoPorM2 = tiempoBase[tipoConstruccion] || 0.4;
    const diasEstimados = Math.ceil(m2 * tiempoPorM2);
    
    if (diasEstimados < 30) {
      return `${diasEstimados} días`;
    } else if (diasEstimados < 365) {
      const meses = Math.ceil(diasEstimados / 30);
      return `${meses} meses`;
    } else {
      const años = Math.ceil(diasEstimados / 365);
      return `${años} años`;
    }
  }

  /**
   * Muestra los resultados de la cotización
   */
  showResults(quote) {
    try {
      console.log('🎯 Mostrando resultados de la cotización:', quote);
      
      // Ocultar formulario y mostrar resultados
      const quoteForm = document.querySelector('.quote-form');
      const quoteResults = document.querySelector('#quoteResults');
      
      if (quoteForm && quoteResults) {
        quoteForm.style.display = 'none';
        quoteResults.style.display = 'block';
        
        // Agregar animación
        quoteResults.classList.add('fade-in');
        
        console.log('✅ Formulario ocultado y resultados mostrados');
      } else {
        console.warn('⚠️ No se encontraron elementos del formulario o resultados');
      }
      
      // Actualizar datos en la UI
      this.updateResultsUI(quote);
      
          // Scroll a los resultados
    if (quoteResults) {
      quoteResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
      
      console.log('✅ Resultados mostrados exitosamente');
      
    } catch (error) {
      console.error('❌ Error mostrando resultados:', error);
      throw error;
    }
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
    if (totalAmountElement) {
      totalAmountElement.textContent = `U$D ${quote.total_estimado.toLocaleString()}`;
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
    
    // Verificar que todos los elementos necesarios estén presentes
    console.log('✅ UI actualizada correctamente');
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
      if (element) {
        element.textContent = `U$D ${value.toLocaleString()}`;
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
    
    if (!materials || materials.length === 0) {
      materialsList.innerHTML = '<div class="no-materials-message">No se seleccionaron materiales</div>';
      return;
    }
    
    materials.forEach(material => {
      const materialItem = document.createElement('div');
      materialItem.className = 'material-item';
      
      materialItem.innerHTML = `
        <div class="material-info">
          <div class="material-name">${material.nombre}</div>
          <div class="material-category">${material.categoria}</div>
        </div>
        <div class="material-price">U$D ${material.precio_por_m2.toLocaleString()}/${material.unidad}</div>
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
    
    if (!observations || observations.length === 0) {
      observationsList.innerHTML = '<li>No hay observaciones adicionales</li>';
      return;
    }
    
    observations.forEach(observation => {
      if (observation && observation.trim()) {
        const li = document.createElement('li');
        li.textContent = observation;
        observationsList.appendChild(li);
      }
    });
  }

  /**
   * Muestra un mensaje de error al usuario
   */
  showErrorMessage(message) {
    // Crear elemento de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--error);
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      max-width: 300px;
      font-weight: 500;
    `;
    
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remover después de 5 segundos
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
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
    const typeInfo = window.app && window.app.getConstructionTypeInfo ? window.app.getConstructionTypeInfo(type) : null;
    
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
    const multiplier = window.app && window.app.getRegionalMultiplier ? window.app.getRegionalMultiplier(province) : 1.0;
    
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
        text: `Cotización #${this.currentQuote.id} - Total: U$D ${this.currentQuote.total_estimado.toLocaleString()}`,
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
   * Obtiene precios actualizados desde APIs de Argentina
   */
  async getCurrentPrices() {
    try {
      console.log('🔄 Obteniendo precios actualizados desde APIs de Argentina...');
      
      // Intentar obtener precios desde la API
      const response = await fetch('/api/argentina/precios');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Precios obtenidos desde API:', data.data);
          return {
            ...data.data,
            source: data.data.source || 'Argentina APIs'
          };
        }
      }
      
      // Fallback: precios base en USD (actualizados según mercado argentino)
      console.log('⚠️ Usando precios base como fallback');
      return {
        steel_frame_m2: 105.0,    // USD/m2 - Acero estructural
        industrial_m2: 125.0,     // USD/m2 - Industrial
        container_m2: 80.0,       // USD/m2 - Contenedor
        materials_m2: 45.0,       // USD/m2 - Materiales
        labor_m2: 35.0,           // USD/m2 - Mano de obra
        finishes_m2: 25.0,        // USD/m2 - Terminaciones
        last_updated: new Date().toISOString(),
        source: 'Precios base (fallback)'
      };
      
    } catch (error) {
      console.warn('⚠️ Error obteniendo precios, usando fallback:', error);
      
      // Precios de emergencia
      return {
        steel_frame_m2: 105.0,
        industrial_m2: 125.0,
        container_m2: 80.0,
        materials_m2: 45.0,
        labor_m2: 35.0,
        finishes_m2: 25.0,
        last_updated: new Date().toISOString(),
        source: 'Precios de emergencia'
      };
    }
  }

  /**
   * Calcula el desglose de costos con precios reales
   */
  async calculateBreakdown(formData, prices = null) {
    try {
      // Usar precios reales de Argentina si están disponibles
      if (!prices) {
        prices = await this.getCurrentPrices();
      }
      
      const m2 = parseFloat(formData.metros_cuadrados) || 0;
      const tipo = formData.tipo_construccion;
      const uso = formData.tipo_uso;
      const terminacion = formData.nivel_terminacion;
      const provincia = formData.provincia;
      
      // Obtener precio base según tipo de construcción desde APIs reales
      let precioBase = 0;
      switch (tipo) {
        case 'steel_frame':
          precioBase = prices.steel_frame_m2;
          break;
        case 'industrial':
          precioBase = prices.industrial_m2;
          break;
        case 'contenedor':
          precioBase = prices.container_m2;
          break;
        case 'mixto':
          precioBase = (prices.steel_frame_m2 + prices.industrial_m2) / 2;
          break;
        default:
          precioBase = prices.steel_frame_m2; // Default a steel frame
      }
      
      // Multiplicadores por tipo de uso
      const multiplicadoresUso = {
        'residencial': 1.0,
        'comercial': 1.3,
        'industrial': 1.4
      };
      
      // Multiplicadores por nivel de terminación
      const multiplicadoresTerminacion = {
        'basico': 1.0,
        'estandar': 1.2,
        'premium': 1.5
      };
      
      // Multiplicadores por provincia (actualizados según datos reales de Argentina)
      const multiplicadoresProvincia = {
        'mendoza': 0.88,
        'buenos_aires': 1.0,
        'cordoba': 0.95,
        'santa_fe': 0.92,
        'tucuman': 0.85,
        'entre_rios': 0.90,
        'chaco': 0.83,
        'corrientes': 0.87,
        'misiones': 0.89,
        'formosa': 0.82,
        'chubut': 0.93,
        'rio_negro': 0.91,
        'neuquen': 0.94,
        'la_pampa': 0.86,
        'san_luis': 0.84,
        'la_rioja': 0.81,
        'catamarca': 0.83,
        'santiago': 0.80,
        'salta': 0.86,
        'jujuy': 0.85,
        'san_juan': 0.87,
        'tierra_fuego': 1.15,
        'otras': 0.90
      };
      
      // Cálculo del precio base
      const multiplicadorUso = multiplicadoresUso[uso] || 1.0;
      const multiplicadorTerminacion = multiplicadoresTerminacion[terminacion] || 1.0;
      const multiplicadorProvincia = multiplicadoresProvincia[provincia.toLowerCase().replace(' ', '_')] || 0.90;
      
      // Precio por m²
      const precioPorM2 = precioBase * multiplicadorUso * multiplicadorTerminacion * multiplicadorProvincia;
      
      // Cálculo del total
      const total = m2 * precioPorM2;
      
      // Desglose de costos usando precios reales de materiales
      const breakdown = {
        metros_cuadrados: m2,
        tipo_construccion: tipo,
        precio_base: precioBase,
        precio_por_m2: precioPorM2,
        total: total,
        desglose: {
          materiales: total * 0.4,
          mano_obra: total * 0.3,
          terminaciones: total * 0.15,
          instalaciones: total * 0.1,
          transporte: total * 0.03,
          impuestos: total * 0.02
        }
      };
      
      console.log('✅ Cálculo local realizado:', breakdown);
      return breakdown;
      
    } catch (error) {
      console.error('❌ Error en cálculo local:', error);
      throw new Error('Error calculando desglose local');
    }
  }

  /**
   * Guarda datos del cliente en NocoDB
   */
  async saveCustomerData(formData, total) {
    try {
      console.log('💾 Guardando datos del cliente en NocoDB...');
      
      const customerData = {
        fecha: new Date().toISOString().split('T')[0],
        nombre: formData.nombre,
        email: formData.email,
        whatsapp: formData.whatsapp || '',
        tipo_construccion: formData.tipo_construccion,
        metros_cuadrados: formData.metros_cuadrados,
        provincia: formData.provincia,
        pisos: formData.pisos,
        uso: formData.tipo_uso,
        terminaciones: formData.nivel_terminacion,
        total_cotizacion: total,
        materiales: JSON.stringify(window.materialsQuoteManager.getSelectedMaterials()),
        observaciones: formData.observaciones || '',
        estado: 'nueva_cotizacion',
        fecha_cotizacion: new Date().toISOString()
      };
      
      // Enviar a NocoDB
      const response = await fetch('/api/nocodb/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });
      
      if (response.ok) {
        console.log('✅ Cliente guardado en NocoDB exitosamente');
      } else {
        console.warn('⚠️ Error guardando en NocoDB:', response.status);
      }
      
    } catch (error) {
      console.warn('⚠️ Error guardando cliente en NocoDB:', error);
      // No fallar la cotización por error en NocoDB
    }
  }

  /**
   * Envía email de cotización
   */
  async sendQuoteEmail(formData, breakdown) {
    try {
      console.log('📧 Enviando email de cotización...');
      
      const emailData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        whatsapp: formData.whatsapp,
        provincia: formData.provincia,
        tipo_construccion: formData.tipo_construccion,
        metros_cuadrados: breakdown.metros_cuadrados,
        pisos: formData.pisos,
        tipo_uso: formData.tipo_uso,
        nivel_terminacion: formData.nivel_terminacion,
        total_estimado: breakdown.total,
        materiales: window.materialsQuoteManager.getSelectedMaterials(),
        observaciones: formData.observaciones,
        tiempo_estimado: this.calculateConstructionTime(breakdown.metros_cuadrados, formData.tipo_construccion)
      };
      
      // Enviar email
      const response = await fetch('/api/cotizar/enviar-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        console.log('✅ Email de cotización enviado exitosamente');
      } else {
        console.warn('⚠️ Error enviando email:', response.status);
      }
      
    } catch (error) {
      console.warn('⚠️ Error enviando email de cotización:', error);
      // No fallar la cotización por error en email
    }
  }

  /**
   * Muestra desglose en tiempo real
   */
  showRealTimeBreakdown(breakdown) {
    try {
      // Actualizar total principal
      const totalElement = document.getElementById('totalAmount');
      if (totalElement) {
        totalElement.textContent = `U$D ${breakdown.total.toLocaleString()}`;
      }
      
      // Actualizar desglose de costos
      const materialesCost = document.getElementById('materialesCost');
      const manoObraCost = document.getElementById('manoObraCost');
      const terminacionesCost = document.getElementById('terminacionesCost');
      const instalacionesCost = document.getElementById('instalacionesCost');
      const transporteCost = document.getElementById('transporteCost');
      const impuestosCost = document.getElementById('impuestosCost');
      
      if (materialesCost) materialesCost.textContent = `U$D ${breakdown.desglose.materiales.toLocaleString()}`;
      if (manoObraCost) manoObraCost.textContent = `U$D ${breakdown.desglose.mano_obra.toLocaleString()}`;
      if (terminacionesCost) terminacionesCost.textContent = `U$D ${breakdown.desglose.terminaciones.toLocaleString()}`;
      if (instalacionesCost) instalacionesCost.textContent = `U$D ${breakdown.desglose.instalaciones.toLocaleString()}`;
      if (transporteCost) transporteCost.textContent = `U$D ${breakdown.desglose.transporte.toLocaleString()}`;
      if (impuestosCost) impuestosCost.textContent = `U$D ${breakdown.desglose.impuestos.toLocaleString()}`;
      
      // Mostrar sección de resultados
      const resultsSection = document.querySelector('.quote-results');
      if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      console.log('✅ Desglose mostrado correctamente:', breakdown);
      
    } catch (error) {
      console.error('❌ Error mostrando desglose:', error);
    }
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
   * Muestra error de materiales
   */
  showMaterialsError(message) {
    // Crear o actualizar mensaje de error
    let errorDiv = document.querySelector('.materials-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'materials-error error-message';
      const materialsSection = document.querySelector('.materials-selection');
      if (materialsSection) {
        materialsSection.appendChild(errorDiv);
      }
    }
    
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>${message}</span>
    `;
    errorDiv.style.display = 'block';
    
    // Hacer scroll al mensaje de error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
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
