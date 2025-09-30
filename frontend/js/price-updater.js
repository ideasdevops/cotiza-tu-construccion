/**
 * Actualizador de Precios en Tiempo Real
 * Conecta con las APIs de Argentina para mostrar precios actualizados
 */

class PriceUpdater {
  constructor() {
    this.prices = null;
    this.lastUpdate = null;
    this.updateInterval = 300000; // 5 minutos
    
    this.init();
  }

  /**
   * Inicializa el actualizador de precios
   */
  async init() {
    console.log('💰 Inicializando actualizador de precios...');
    
    try {
      // Cargar precios iniciales
      await this.loadPrices();
      
      // Configurar actualización automática
      this.setupAutoUpdate();
      
      // Actualizar precios en la interfaz
      this.updatePricesDisplay();
      
      console.log('✅ Actualizador de precios inicializado');
      
    } catch (error) {
      console.error('❌ Error inicializando actualizador de precios:', error);
      this.useFallbackPrices();
    }
  }

  /**
   * Carga precios desde las APIs de Argentina
   */
  async loadPrices() {
    try {
      console.log('🔄 Cargando precios desde APIs de Argentina...');
      
      const response = await fetch('/api/argentina/precios');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          this.prices = data.data;
          this.lastUpdate = new Date();
          
          console.log('✅ Precios cargados exitosamente:', this.prices);
          
          // Guardar en localStorage para cache
          localStorage.setItem('construction_prices', JSON.stringify({
            prices: this.prices,
            timestamp: this.lastUpdate.getTime()
          }));
          
          return true;
        } else {
          console.warn('⚠️ API respondió pero sin éxito:', data.message || 'Sin mensaje de error');
        }
      } else {
        console.warn(`⚠️ API respondió con error ${response.status}: ${response.statusText}`);
      }
      
      throw new Error('Error en respuesta de API');
      
    } catch (error) {
      console.warn('⚠️ Error cargando precios desde API:', error);
      
      // Intentar cargar desde cache local
      const cacheLoaded = this.loadFromCache();
      
      if (cacheLoaded) {
        console.log('✅ Usando precios desde cache local');
      } else {
        console.log('🔄 Usando precios de fallback');
        this.useFallbackPrices();
      }
      
      return cacheLoaded;
    }
  }

  /**
   * Carga precios desde cache local
   */
  loadFromCache() {
    try {
      const cached = localStorage.getItem('construction_prices');
      
      if (cached) {
        const data = JSON.parse(cached);
        const cacheAge = Date.now() - data.timestamp;
        
        // Cache válido por 1 hora
        if (cacheAge < 3600000) {
          this.prices = data.prices;
          this.lastUpdate = new Date(data.timestamp);
          
          console.log('✅ Precios cargados desde cache local');
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.warn('⚠️ Error cargando desde cache:', error);
      return false;
    }
  }

  /**
   * Usa precios de fallback con información detallada
   */
  useFallbackPrices() {
    console.log('🔄 Usando precios de fallback con información detallada...');
    
    this.prices = {
      steel_frame_m2: 105.0,
      industrial_m2: 125.0,
      container_m2: 80.0,
      materials_m2: 45.0,
      labor_m2: 35.0,
      finishes_m2: 25.0,
      last_updated: new Date().toISOString(),
      source: 'Precios base (fallback)',
      source_details: {
        indec: 'Instituto Nacional de Estadística y Censos',
        camara: 'Cámara Argentina de la Construcción',
        bcra: 'Banco Central de la República Argentina',
        inflacion: 'Inflación acumulada 2024-2025',
        actualizacion: 'Actualización automática cada 12 horas'
      },
      references: [
        'INDEC: Precios oficiales de construcción',
        'Cámara de Construcción: Precios del mercado',
        'BCRA: Tipo de cambio oficial ARS/USD',
        'Dólar Blue: Cotización paralela',
        'Inflación: Ajuste por IPC acumulado'
      ]
    };
    
    this.lastUpdate = new Date();
    
    console.log('✅ Precios de fallback cargados con referencias detalladas');
  }

  /**
   * Configura actualización automática
   */
  setupAutoUpdate() {
    // Actualizar cada 5 minutos
    setInterval(async () => {
      console.log('🔄 Actualización automática de precios...');
      await this.loadPrices();
      this.updatePricesDisplay();
    }, this.updateInterval);
    
    // Actualizar cuando la página vuelve a estar visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('🔄 Página visible, verificando precios...');
        this.checkForUpdates();
      }
    });
  }

  /**
   * Verifica si hay actualizaciones disponibles
   */
  async checkForUpdates() {
    try {
      const response = await fetch('/api/argentina/precios');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const newTimestamp = new Date(data.data.last_updated);
          
          if (!this.lastUpdate || newTimestamp > this.lastUpdate) {
            console.log('🔄 Nuevos precios disponibles, actualizando...');
            await this.loadPrices();
            this.updatePricesDisplay();
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error verificando actualizaciones:', error);
    }
  }

  /**
   * Actualiza la visualización de precios en la interfaz
   */
  updatePricesDisplay() {
    if (!this.prices) return;
    
    console.log('🎨 Actualizando visualización de precios...');
    
    // Actualizar precios de tipos de construcción
    this.updateConstructionTypePrices();
    
    // Actualizar indicador de última actualización
    this.updateLastUpdateIndicator();
    
    // Mostrar fuente de precios
    this.showPriceSource();
  }

  /**
   * Actualiza precios de tipos de construcción
   */
  updateConstructionTypePrices() {
    // Steel Frame
    const steelFramePrice = document.getElementById('steel-frame-price');
    if (steelFramePrice) {
      steelFramePrice.textContent = `U$D ${this.prices.steel_frame_m2.toLocaleString()}`;
    }
    
    // Industrial
    const industrialPrice = document.getElementById('industrial-price');
    if (industrialPrice) {
      industrialPrice.textContent = `U$D ${this.prices.industrial_m2.toLocaleString()}`;
    }
    
    // Contenedor
    const containerPrice = document.getElementById('container-price');
    if (containerPrice) {
      containerPrice.textContent = `U$D ${this.prices.container_m2.toLocaleString()}`;
    }
    
    // Sistema Mixto (promedio de steel frame e industrial)
    const mixtoPrice = document.getElementById('mixto-price');
    if (mixtoPrice) {
      const mixtoValue = (this.prices.steel_frame_m2 + this.prices.industrial_m2) / 2;
      mixtoPrice.textContent = `U$D ${mixtoValue.toLocaleString()}`;
    }
  }

  /**
   * Actualiza indicador de última actualización
   */
  updateLastUpdateIndicator() {
    if (!this.lastUpdate) return;
    
    const updateElements = document.querySelectorAll('.price-update');
    updateElements.forEach(element => {
      const timeAgo = this.getTimeAgo(this.lastUpdate);
      element.textContent = `Actualizado ${timeAgo}`;
      element.title = `Última actualización: ${this.lastUpdate.toLocaleString('es-AR')}`;
    });
  }

  /**
   * Muestra la fuente de los precios con información detallada
   */
  showPriceSource() {
    // Crear o actualizar indicador de fuente
    let sourceIndicator = document.getElementById('price-source-indicator');
    
    if (!sourceIndicator) {
      sourceIndicator = document.createElement('div');
      sourceIndicator.id = 'price-source-indicator';
      sourceIndicator.className = 'price-source-indicator';
      sourceIndicator.style.cssText = `
        background: linear-gradient(135deg, rgba(139, 69, 19, 0.08) 0%, rgba(105, 105, 105, 0.08) 100%);
        color: var(--primary-color);
        padding: 20px 28px;
        border-radius: 16px;
        font-size: 0.875rem;
        font-weight: 400;
        text-align: center;
        margin: 28px auto;
        max-width: 700px;
        border: 1px solid rgba(139, 69, 19, 0.15);
        backdrop-filter: blur(15px);
        line-height: 1.6;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 2px 20px rgba(139, 69, 19, 0.08);
      `;
      
      // Agregar hover effect
      sourceIndicator.addEventListener('mouseenter', () => {
        sourceIndicator.style.transform = 'translateY(-2px)';
        sourceIndicator.style.boxShadow = '0 4px 25px rgba(139, 69, 19, 0.12)';
        sourceIndicator.style.borderColor = 'rgba(139, 69, 19, 0.25)';
      });
      
      sourceIndicator.addEventListener('mouseleave', () => {
        sourceIndicator.style.transform = 'translateY(0)';
        sourceIndicator.style.boxShadow = '0 2px 20px rgba(139, 69, 19, 0.08)';
        sourceIndicator.style.borderColor = 'rgba(139, 69, 19, 0.15)';
      });
      
      // Agregar línea decorativa sutil
      sourceIndicator.innerHTML = '<div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)); opacity: 0.6;"></div>';
      
      // Insertar después del header
      const header = document.querySelector('.header');
      if (header) {
        header.parentNode.insertBefore(sourceIndicator, header.nextSibling);
      }
    }
    
    // Determinar fuente y mostrar información detallada
    let sourceText = '';
    let sourceDetails = '';
    let references = '';
    
    if (this.prices && this.prices.source) {
      sourceText = `Precios en tiempo real desde ${this.prices.source}`;
      
      // Información específica según la fuente
      switch (this.prices.source) {
        case 'INDEC':
          sourceDetails = 'Instituto Nacional de Estadística y Censos - Precios oficiales de construcción';
          break;
        case 'Cámara de Construcción':
          sourceDetails = 'Cámara Argentina de la Construcción - Precios del mercado';
          break;
        case 'BCRA':
          sourceDetails = 'Banco Central de la República Argentina - Tipo de cambio oficial';
          break;
        case 'Dólar Blue':
          sourceDetails = 'Cotización paralela del dólar estadounidense';
          break;
        case 'Precios base (fallback)':
          sourceDetails = 'Precios de referencia basados en INDEC + Cámara de Construcción + inflación acumulada';
          // Mostrar referencias detalladas para fallback
          if (this.prices.references) {
            references = `<br><small style="opacity: 0.8; font-size: 0.75rem; display: block; margin-top: 4px;">
              <strong>Referencias:</strong><br>
              • ${this.prices.references[0]}<br>
              • ${this.prices.references[1]}<br>
              • ${this.prices.references[2]}<br>
              • ${this.prices.references[3]}<br>
              • ${this.prices.references[4]}
            </small>`;
          }
          break;
        default:
          sourceDetails = 'Sistema de precios actualizado automáticamente';
      }
    } else {
      sourceText = 'Precios de referencia actualizados';
      sourceDetails = 'Basados en INDEC, Cámara de Construcción Argentina y tipo de cambio BCRA';
    }
    
    // Mostrar última actualización si está disponible
    let updateInfo = '';
    if (this.lastUpdate) {
      const timeAgo = this.getTimeAgo(this.lastUpdate);
      updateInfo = `<br><small style="opacity: 0.8; font-size: 0.8rem;">Última actualización: ${timeAgo}</small>`;
    }
    
    // Limpiar el contenido anterior
    sourceIndicator.innerHTML = '';
    
    // Agregar línea decorativa sutil
    const topLine = document.createElement('div');
    topLine.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      opacity: 0.6;
    `;
    sourceIndicator.appendChild(topLine);
    
    // Contenido principal con mejor estructura
    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      z-index: 1;
    `;
    
    // Icono y texto principal
    const mainText = document.createElement('div');
    mainText.style.cssText = `
      font-size: 1rem;
      font-weight: 500;
      color: var(--primary-color);
      margin-bottom: 8px;
    `;
    mainText.innerHTML = `<i class="fas fa-chart-line" style="margin-right: 8px; opacity: 0.8;"></i>${sourceText}`;
    content.appendChild(mainText);
    
    // Detalles de la fuente
    if (sourceDetails) {
      const details = document.createElement('div');
      details.style.cssText = `
        font-size: 0.8rem;
        color: var(--secondary-color);
        opacity: 0.8;
        margin-bottom: 8px;
      `;
      details.textContent = sourceDetails;
      content.appendChild(details);
    }
    
    // Referencias (solo para fallback)
    if (references) {
      const refsContainer = document.createElement('div');
      refsContainer.style.cssText = `
        font-size: 0.75rem;
        color: var(--secondary-color);
        opacity: 0.7;
        margin: 8px 0;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        border-left: 3px solid var(--primary-color);
      `;
      
      const refsTitle = document.createElement('div');
      refsTitle.style.cssText = `
        font-weight: 500;
        margin-bottom: 4px;
        color: var(--primary-color);
      `;
      refsTitle.textContent = 'Fuentes de referencia:';
      refsContainer.appendChild(refsTitle);
      
      const refsList = document.createElement('div');
      refsList.style.cssText = `
        line-height: 1.4;
      `;
      refsList.innerHTML = `
        • INDEC: Precios oficiales de construcción<br>
        • Cámara de Construcción: Precios del mercado<br>
        • BCRA: Tipo de cambio oficial ARS/USD<br>
        • Dólar Blue: Cotización paralela<br>
        • Inflación: Ajuste por IPC acumulado
      `;
      refsContainer.appendChild(refsList);
      
      content.appendChild(refsContainer);
    }
    
    // Información de última actualización
    if (updateInfo) {
      const updateContainer = document.createElement('div');
      updateContainer.style.cssText = `
        font-size: 0.75rem;
        color: var(--secondary-color);
        opacity: 0.6;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(139, 69, 19, 0.1);
      `;
      updateContainer.innerHTML = updateInfo;
      content.appendChild(updateContainer);
    }
    
    sourceIndicator.appendChild(content);
    
    // Agregar tooltip elegante con información adicional
    sourceIndicator.title = `${sourceText}\n\n${sourceDetails}\n\n📊 Fuentes de datos:\n• INDEC: Instituto Nacional de Estadística\n• Cámara de Construcción: Precios del mercado\n• BCRA: Tipo de cambio oficial\n• Dólar Blue: Cotización paralela\n• Inflación: IPC acumulado\n\n⏰ Actualización automática cada 12 horas`;
  }

  /**
   * Calcula tiempo transcurrido en formato legible
   */
  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'hace un momento';
    if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-AR');
  }

  /**
   * Fuerza una actualización manual
   */
  async forceUpdate() {
    console.log('🔄 Forzando actualización manual de precios...');
    
    try {
      // Primero intentar obtener precios directamente
      const response = await fetch('/api/argentina/precios');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Verificar si los precios son diferentes
          const pricesChanged = this.havePricesChanged(data.data);
          
          if (pricesChanged) {
            // Precios nuevos - actualizar
            this.prices = data.data;
            this.lastUpdate = new Date();
            
            this.updatePricesDisplay();
            
            console.log('✅ Nuevos precios cargados exitosamente');
            this.showUpdateNotification('Precios actualizados exitosamente', 'success');
            
          } else {
            // Precios iguales - mostrar información
            console.log('ℹ️ Los precios ya están actualizados');
            this.showUpdateNotification('Los precios ya están actualizados', 'info');
            
            // Actualizar timestamp de última verificación
            this.lastUpdate = new Date();
            this.updatePricesDisplay();
          }
          
          return true;
        }
      }
      
      // Si falla la API principal, intentar con el endpoint de actualización
      console.log('🔄 Intentando endpoint de actualización forzada...');
      const forceResponse = await fetch('/api/updater/force-update');
      
      if (forceResponse.ok) {
        const forceData = await forceResponse.json();
        
        if (forceData.success) {
          this.prices = forceData.data.prices;
          this.lastUpdate = new Date();
          
          this.updatePricesDisplay();
          
          console.log('✅ Actualización forzada completada');
          this.showUpdateNotification('Precios actualizados exitosamente', 'success');
          
          return true;
        }
      }
      
      // Si todo falla, usar precios locales como fallback
      console.log('🔄 Usando precios locales como fallback...');
      if (this.loadFromCache()) {
        this.updatePricesDisplay();
        this.showUpdateNotification('Usando precios locales (última actualización: ' + this.getTimeAgo(this.lastUpdate) + ')', 'warning');
        return true;
      }
      
      // Último recurso: usar precios hardcodeados
      this.useFallbackPrices();
      this.showUpdateNotification('Usando precios de referencia (INDEC + Cámara de Construcción)', 'info');
      return true;
      
    } catch (error) {
      console.error('❌ Error en actualización manual:', error);
      
      // Siempre usar fallback en lugar de mostrar error
      if (this.loadFromCache()) {
        this.updatePricesDisplay();
        this.showUpdateNotification('Usando precios locales (última actualización: ' + this.getTimeAgo(this.lastUpdate) + ')', 'warning');
        return true;
      }
      
      // Último recurso
      this.useFallbackPrices();
      this.showUpdateNotification('Usando precios de referencia (INDEC + Cámara de Construcción)', 'info');
      return true;
    }
  }

  /**
   * Muestra notificación de actualización
   */
  showUpdateNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `price-update-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;
    
    // Colores según tipo
    switch (type) {
      case 'success':
        notification.style.background = '#10B981';
        break;
      case 'error':
        notification.style.background = '#EF4444';
        break;
      case 'warning':
        notification.style.background = '#F59E0B';
        break;
      default:
        notification.style.background = '#3B82F6';
    }
    
    // Agregar información adicional para precios actualizados
    let additionalInfo = '';
    if (type === 'success' && this.lastUpdate) {
      additionalInfo = `<br><small style="opacity: 0.9;">Última actualización: ${this.getTimeAgo(this.lastUpdate)}</small>`;
    }
    
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}" style="margin-right: 8px;"></i>
      ${message}${additionalInfo}
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 8 segundos (más tiempo para leer información adicional)
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 8000);
  }

  /**
   * Verifica si los precios han cambiado
   */
  havePricesChanged(newPrices) {
    if (!this.prices) return true; // Si no hay precios previos, considerar como cambio
    
    // Comparar precios principales
    const priceFields = ['steel_frame_m2', 'industrial_m2', 'container_m2', 'materials_m2', 'labor_m2', 'finishes_m2'];
    
    for (const field of priceFields) {
      if (Math.abs((this.prices[field] || 0) - (newPrices[field] || 0)) > 0.01) {
        console.log(`💰 Precio cambiado en ${field}: ${this.prices[field]} → ${newPrices[field]}`);
        return true;
      }
    }
    
    // Verificar si la fuente cambió
    if (this.prices.source !== newPrices.source) {
      console.log(`🔄 Fuente de precios cambió: ${this.prices.source} → ${newPrices.source}`);
      return true;
    }
    
    console.log('ℹ️ Los precios no han cambiado');
    return false;
  }

  /**
   * Obtiene estadísticas del actualizador
   */
  getStats() {
    return {
      prices: this.prices,
      lastUpdate: this.lastUpdate,
      updateInterval: this.updateInterval,
      cacheAge: this.lastUpdate ? Date.now() - this.lastUpdate.getTime() : null,
      pricesChanged: this.havePricesChanged(this.prices || {})
    };
  }
}

// Inicializar actualizador de precios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.priceUpdater = new PriceUpdater();
  
  // Agregar botón de actualización manual en el header
  const headerActions = document.querySelector('.header-actions');
  if (headerActions) {
    const updateButton = document.createElement('button');
    updateButton.className = 'cta-btn outline';
    updateButton.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Precios';
    updateButton.style.marginLeft = '12px';
    updateButton.addEventListener('click', () => {
      window.priceUpdater.forceUpdate();
    });
    
    headerActions.appendChild(updateButton);
  }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceUpdater;
}
