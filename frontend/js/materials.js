/**
 * Cotizador de Construcción - Módulo de Materiales
 * Maneja la visualización y filtrado de materiales de construcción
 */

class MaterialsManager {
  constructor() {
    this.materials = [];
    this.filteredMaterials = [];
    this.currentCategory = 'todos';
    this.currentSearch = '';
    
    this.init();
  }

  /**
   * Inicializa el gestor de materiales
   */
  async init() {
    try {
      await this.loadMaterials();
      this.initFilters();
      this.initSearch();
      this.renderMaterials();
      
      console.log('✅ Gestor de materiales inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gestor de materiales:', error);
    }
  }

  /**
   * Carga los materiales desde la API
   */
  async loadMaterials() {
    try {
      const response = await fetch('/api/materiales/precios');
      
      if (!response.ok) {
        throw new Error('Error cargando materiales');
      }
      
      const data = await response.json();
      this.materials = data.materiales || [];
      this.filteredMaterials = [...this.materials];
      
      console.log(`📦 ${this.materials.length} materiales cargados`);
      
    } catch (error) {
      console.error('Error cargando materiales:', error);
      
      // Usar datos de respaldo si la API falla
      this.loadFallbackMaterials();
    }
  }

  /**
   * Carga materiales de respaldo en caso de fallo de la API
   */
  loadFallbackMaterials() {
    this.materials = [
      {
        nombre: 'Acero Estructural',
        precio_por_m2: 1500,
        unidad: 'kg',
        categoria: 'estructura'
      },
      {
        nombre: 'Perfil Steel Frame',
        precio_por_m2: 800,
        unidad: 'm2',
        categoria: 'estructura'
      },
      {
        nombre: 'Hierro Redondo',
        precio_por_m2: 1200,
        unidad: 'kg',
        categoria: 'estructura'
      },
      {
        nombre: 'Chapa Acanalada',
        precio_por_m2: 450,
        unidad: 'm2',
        categoria: 'cubierta'
      },
      {
        nombre: 'Lana Mineral',
        precio_por_m2: 120,
        unidad: 'm2',
        categoria: 'aislamiento'
      },
      {
        nombre: 'Placa de Yeso',
        precio_por_m2: 180,
        unidad: 'm2',
        categoria: 'interior'
      },
      {
        nombre: 'Pintura Interior',
        precio_por_m2: 85,
        unidad: 'm2',
        categoria: 'terminacion'
      },
      {
        nombre: 'Pintura Exterior',
        precio_por_m2: 120,
        unidad: 'm2',
        categoria: 'terminacion'
      },
      {
        nombre: 'Cerámica',
        precio_por_m2: 350,
        unidad: 'm2',
        categoria: 'terminacion'
      },
      {
        nombre: 'Porcelanato',
        precio_por_m2: 650,
        unidad: 'm2',
        categoria: 'terminacion'
      }
    ];
    
    this.filteredMaterials = [...this.materials];
    console.log('📦 Materiales de respaldo cargados');
  }

  /**
   * Inicializa los filtros de categoría
   */
  initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const category = button.dataset.category;
        this.filterByCategory(category);
        
        // Actualizar estado activo de los botones
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }

  /**
   * Inicializa la búsqueda de materiales
   */
  initSearch() {
    // Crear campo de búsqueda si no existe
    this.createSearchField();
    
    const searchInput = document.querySelector('#materialsSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentSearch = e.target.value.trim().toLowerCase();
        this.applyFilters();
      });
    }
  }

  /**
   * Crea el campo de búsqueda
   */
  createSearchField() {
    const materialsContainer = document.querySelector('.materials-container');
    if (!materialsContainer) return;
    
    // Verificar si ya existe el campo de búsqueda
    if (document.querySelector('#materialsSearch')) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'materials-search';
    searchContainer.style.cssText = `
      margin-bottom: var(--spacing-lg);
      text-align: center;
    `;
    
    searchContainer.innerHTML = `
      <div class="search-input-container">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          id="materialsSearch" 
          placeholder="Buscar materiales..." 
          class="search-input"
        >
      </div>
    `;
    
    // Insertar antes de los filtros
    const filtersContainer = materialsContainer.querySelector('.materials-filters');
    if (filtersContainer) {
      filtersContainer.parentNode.insertBefore(searchContainer, filtersContainer);
    }
    
    // Agregar estilos para el campo de búsqueda
    this.addSearchStyles();
  }

  /**
   * Agrega estilos para el campo de búsqueda
   */
  addSearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .materials-search {
        margin-bottom: var(--spacing-lg);
        text-align: center;
      }
      
      .search-input-container {
        position: relative;
        max-width: 400px;
        margin: 0 auto;
      }
      
      .search-icon {
        position: absolute;
        left: var(--spacing-md);
        top: 50%;
        transform: translateY(-50%);
        color: var(--gray-400);
        z-index: 1;
      }
      
      .search-input {
        width: 100%;
        padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-md) * 2 + 16px);
        border: 2px solid var(--gray-200);
        border-radius: var(--border-radius-lg);
        font-size: 1rem;
        transition: all var(--transition-fast);
        background: var(--white);
      }
      
      .search-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }
      
      .search-input::placeholder {
        color: var(--gray-400);
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Filtra materiales por categoría
   */
  filterByCategory(category) {
    this.currentCategory = category;
    this.applyFilters();
  }

  /**
   * Aplica todos los filtros activos
   */
  applyFilters() {
    this.filteredMaterials = this.materials.filter(material => {
      // Filtro por categoría
      const categoryMatch = this.currentCategory === 'todos' || 
                           material.categoria === this.currentCategory;
      
      // Filtro por búsqueda
      const searchMatch = !this.currentSearch || 
                         material.nombre.toLowerCase().includes(this.currentSearch) ||
                         material.categoria.toLowerCase().includes(this.currentSearch);
      
      return categoryMatch && searchMatch;
    });
    
    this.renderMaterials();
    this.updateResultsCount();
  }

  /**
   * Renderiza los materiales filtrados
   */
  renderMaterials() {
    const materialsGrid = document.querySelector('#materialsGrid');
    if (!materialsGrid) return;
    
    // Limpiar grid
    materialsGrid.innerHTML = '';
    
    if (this.filteredMaterials.length === 0) {
      this.showNoResults();
      return;
    }
    
    // Renderizar cada material
    this.filteredMaterials.forEach(material => {
      const materialCard = this.createMaterialCard(material);
      materialsGrid.appendChild(materialCard);
    });
    
    // Agregar animaciones
    this.addMaterialAnimations();
  }

  /**
   * Crea una tarjeta de material
   */
  createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    // Formatear precio
    const formattedPrice = window.app?.formatCurrency(material.precio_por_m2) || 
                          `$${material.precio_por_m2.toLocaleString('es-AR')}`;
    
    card.innerHTML = `
      <div class="material-header">
        <div class="material-name">${material.nombre}</div>
        <div class="material-category">${this.getCategoryDisplayName(material.categoria)}</div>
      </div>
      
      <div class="material-price">
        ${formattedPrice}
        <span class="material-unit">/${material.unidad}</span>
      </div>
      
      <div class="material-details">
        <div class="material-info-item">
          <i class="fas fa-tag"></i>
          <span>Categoría: ${this.getCategoryDisplayName(material.categoria)}</span>
        </div>
        <div class="material-info-item">
          <i class="fas fa-ruler"></i>
          <span>Unidad: ${material.unidad}</span>
        </div>
      </div>
      
      <div class="material-actions">
        <button class="btn outline small" onclick="materialsManager.showMaterialDetails('${material.nombre}')">
          <i class="fas fa-info-circle"></i> Detalles
        </button>
        <button class="btn primary small" onclick="materialsManager.addToQuote('${material.nombre}')">
          <i class="fas fa-plus"></i> Agregar
        </button>
      </div>
    `;
    
    return card;
  }

  /**
   * Obtiene el nombre de visualización de una categoría
   */
  getCategoryDisplayName(category) {
    const categoryNames = {
      'estructura': 'Estructura',
      'cubierta': 'Cubierta',
      'aislamiento': 'Aislamiento',
      'interior': 'Interior',
      'terminacion': 'Terminación'
    };
    
    return categoryNames[category] || category;
  }

  /**
   * Muestra mensaje cuando no hay resultados
   */
  showNoResults() {
    const materialsGrid = document.querySelector('#materialsGrid');
    if (!materialsGrid) return;
    
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.style.cssText = `
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--spacing-3xl);
      color: var(--gray-500);
    `;
    
    noResults.innerHTML = `
      <i class="fas fa-search fa-3x" style="margin-bottom: var(--spacing-lg); opacity: 0.5;"></i>
      <h3>No se encontraron materiales</h3>
      <p>Intenta ajustar los filtros o la búsqueda</p>
    `;
    
    materialsGrid.appendChild(noResults);
  }

  /**
   * Actualiza el contador de resultados
   */
  updateResultsCount() {
    // Crear o actualizar contador de resultados
    let resultsCounter = document.querySelector('.materials-results-count');
    
    if (!resultsCounter) {
      resultsCounter = document.createElement('div');
      resultsCounter.className = 'materials-results-count';
      resultsCounter.style.cssText = `
        text-align: center;
        margin-bottom: var(--spacing-lg);
        color: var(--gray-600);
        font-size: 0.875rem;
      `;
      
      const materialsContainer = document.querySelector('.materials-container');
      if (materialsContainer) {
        const filtersContainer = materialsContainer.querySelector('.materials-filters');
        if (filtersContainer) {
          filtersContainer.parentNode.insertBefore(resultsCounter, filtersContainer);
        }
      }
    }
    
    const total = this.materials.length;
    const filtered = this.filteredMaterials.length;
    
    if (this.currentCategory === 'todos' && !this.currentSearch) {
      resultsCounter.textContent = `Mostrando ${filtered} de ${total} materiales`;
    } else {
      resultsCounter.textContent = `${filtered} materiales encontrados de ${total} total`;
    }
  }

  /**
   * Agrega animaciones a las tarjetas de materiales
   */
  addMaterialAnimations() {
    const materialCards = document.querySelectorAll('.material-card');
    
    materialCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  /**
   * Muestra detalles de un material
   */
  showMaterialDetails(materialName) {
    const material = this.materials.find(m => m.nombre === materialName);
    if (!material) return;
    
    // Crear modal de detalles
    const modal = document.createElement('div');
    modal.className = 'material-details-modal';
    
    const formattedPrice = window.app?.formatCurrency(material.precio_por_m2) || 
                          `$${material.precio_por_m2.toLocaleString('es-AR')}`;
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${material.nombre}</h3>
          <button class="modal-close" onclick="this.closest('.material-details-modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="material-detail-item">
            <strong>Categoría:</strong> ${this.getCategoryDisplayName(material.categoria)}
          </div>
          <div class="material-detail-item">
            <strong>Precio:</strong> ${formattedPrice}/${material.unidad}
          </div>
          <div class="material-detail-item">
            <strong>Descripción:</strong> Material de construcción ${material.categoria} de alta calidad
          </div>
          
          <div class="material-usage">
            <h4>Uso Recomendado:</h4>
            <p>${this.getMaterialUsageDescription(material)}</p>
          </div>
          
          <div class="material-specs">
            <h4>Especificaciones:</h4>
            <ul>
              ${this.getMaterialSpecifications(material).map(spec => `<li>${spec}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn outline" onclick="this.closest('.material-details-modal').remove()">
            Cerrar
          </button>
          <button class="btn primary" onclick="materialsManager.addToQuote('${material.nombre}')">
            Agregar a Cotización
          </button>
        </div>
      </div>
    `;
    
    // Agregar estilos del modal
    this.addModalStyles();
    
    // Agregar al DOM
    document.body.appendChild(modal);
    
    // Mostrar modal con animación
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);
  }

  /**
   * Obtiene descripción de uso del material
   */
  getMaterialUsageDescription(material) {
    const usageDescriptions = {
      'estructura': 'Ideal para estructuras principales, soportes y elementos de carga.',
      'cubierta': 'Perfecto para techos, cubiertas y elementos de protección superior.',
      'aislamiento': 'Excelente para aislamiento térmico y acústico de construcciones.',
      'interior': 'Ideal para divisiones interiores, cielorrasos y revestimientos.',
      'terminacion': 'Perfecto para acabados finales y decorativos de la construcción.'
    };
    
    return usageDescriptions[material.categoria] || 'Material de construcción de alta calidad.';
  }

  /**
   * Obtiene especificaciones del material
   */
  getMaterialSpecifications(material) {
    const baseSpecs = [
      'Cumple con normas de calidad vigentes',
      'Resistente a condiciones ambientales',
      'Fácil instalación y manipulación'
    ];
    
    const categorySpecs = {
      'estructura': [
        'Alta resistencia mecánica',
        'Durabilidad garantizada',
        'Certificación de calidad estructural'
      ],
      'cubierta': [
        'Resistente a la intemperie',
        'Protección UV incluida',
        'Sistema de fijación incluido'
      ],
      'aislamiento': [
        'Coeficiente térmico optimizado',
        'Resistencia acústica certificada',
        'Material no inflamable'
      ],
      'interior': [
        'Superficie lisa y uniforme',
        'Fácil pintado y decoración',
        'Resistente a la humedad'
      ],
      'terminacion': [
        'Acabado premium',
        'Variedad de colores disponible',
        'Resistente al desgaste'
      ]
    };
    
    return [...baseSpecs, ...(categorySpecs[material.categoria] || [])];
  }

  /**
   * Agrega estilos del modal
   */
  addModalStyles() {
    if (document.querySelector('#materialModalStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'materialModalStyles';
    style.textContent = `
      .material-details-modal {
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
        opacity: 0;
        transition: opacity 0.3s ease-out;
      }
      
      .material-details-modal.show {
        opacity: 1;
      }
      
      .modal-content {
        background: var(--white);
        border-radius: var(--border-radius-lg);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: var(--shadow-xl);
        transform: scale(0.9);
        transition: transform 0.3s ease-out;
      }
      
      .material-details-modal.show .modal-content {
        transform: scale(1);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--gray-200);
      }
      
      .modal-header h3 {
        margin: 0;
        color: var(--gray-800);
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: var(--gray-500);
        cursor: pointer;
        padding: var(--spacing-sm);
        border-radius: 50%;
        transition: all var(--transition-fast);
      }
      
      .modal-close:hover {
        background: var(--gray-100);
        color: var(--gray-700);
      }
      
      .modal-body {
        padding: var(--spacing-lg);
      }
      
      .material-detail-item {
        margin-bottom: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--gray-50);
        border-radius: var(--border-radius-md);
      }
      
      .material-usage,
      .material-specs {
        margin-top: var(--spacing-lg);
      }
      
      .material-usage h4,
      .material-specs h4 {
        color: var(--gray-800);
        margin-bottom: var(--spacing-sm);
      }
      
      .material-specs ul {
        list-style: none;
        padding: 0;
      }
      
      .material-specs li {
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--gray-200);
        position: relative;
        padding-left: var(--spacing-lg);
      }
      
      .material-specs li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: var(--success);
        font-weight: bold;
      }
      
      .modal-footer {
        padding: var(--spacing-lg);
        border-top: 1px solid var(--gray-200);
        display: flex;
        gap: var(--spacing-md);
        justify-content: flex-end;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Agrega un material a la cotización
   */
  addToQuote(materialName) {
    const material = this.materials.find(m => m.nombre === materialName);
    if (!material) return;
    
    // Mostrar notificación
    if (window.app) {
      window.app.showNotification(
        `${material.nombre} agregado a la cotización`,
        'success'
      );
    }
    
    // Aquí se implementaría la lógica para agregar el material a la cotización
    console.log('Material agregado a cotización:', material);
    
    // Cerrar modal si está abierto
    const modal = document.querySelector('.material-details-modal');
    if (modal) {
      modal.remove();
    }
    
    // Scroll a la sección de cotización
    const quoteSection = document.querySelector('#cotizador');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Obtiene estadísticas de materiales
   */
  getMaterialsStats() {
    const stats = {
      total: this.materials.length,
      byCategory: {},
      priceRange: {
        min: Infinity,
        max: -Infinity,
        average: 0
      }
    };
    
    // Contar por categoría
    this.materials.forEach(material => {
      const category = material.categoria;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Calcular rango de precios
      if (material.precio_por_m2 < stats.priceRange.min) {
        stats.priceRange.min = material.precio_por_m2;
      }
      if (material.precio_por_m2 > stats.priceRange.max) {
        stats.priceRange.max = material.precio_por_m2;
      }
    });
    
    // Calcular promedio
    const totalPrice = this.materials.reduce((sum, m) => sum + m.precio_por_m2, 0);
    stats.priceRange.average = totalPrice / this.materials.length;
    
    return stats;
  }

  /**
   * Exporta materiales a CSV
   */
  exportToCSV() {
    const headers = ['Nombre', 'Categoría', 'Precio', 'Unidad'];
    const csvContent = [
      headers.join(','),
      ...this.filteredMaterials.map(material => [
        `"${material.nombre}"`,
        `"${material.categoria}"`,
        material.precio_por_m2,
        `"${material.unidad}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'materiales_construccion.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Inicializar el gestor de materiales cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.materialsManager = new MaterialsManager();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialsManager;
}
