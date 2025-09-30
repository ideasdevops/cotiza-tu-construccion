/**
 * Gestor de Materiales para Cotización
 * Maneja la selección y gestión de materiales en la cotización
 */

class MaterialsQuoteManager {
  constructor() {
    this.selectedMaterials = [];
    this.materialsTotal = 0;
    this.init();
  }

  init() {
    this.initEventListeners();
    this.loadMaterialsFromAPI();
    console.log('✅ Gestor de materiales para cotización inicializado');
  }

  initEventListeners() {
    // Botón agregar material
    const btnAddMaterial = document.getElementById('btnAddMaterial');
    if (btnAddMaterial) {
      btnAddMaterial.addEventListener('click', () => this.showMaterialsModal());
    }

    // Botón calcular cotización
    const btnCalculate = document.getElementById('btnCalculate');
    if (btnCalculate) {
      btnCalculate.addEventListener('click', () => this.validateMaterialsBeforeCalculation());
    }
  }

  async loadMaterialsFromAPI() {
    try {
      const response = await fetch('/api/materiales/precios');
      if (response.ok) {
        const data = await response.json();
        this.availableMaterials = data.materiales || [];
        console.log(`📦 ${this.availableMaterials.length} materiales cargados desde API`);
      } else {
        this.loadFallbackMaterials();
      }
    } catch (error) {
      console.error('Error cargando materiales desde API:', error);
      this.loadFallbackMaterials();
    }
  }

  loadFallbackMaterials() {
    this.availableMaterials = [
      {
        id: 1,
        nombre: 'Acero Estructural',
        precio_por_m2: 1500,
        unidad: 'kg',
        categoria: 'estructura',
        descripcion: 'Acero de alta resistencia para estructuras'
      },
      {
        id: 2,
        nombre: 'Perfil Steel Frame',
        precio_por_m2: 800,
        unidad: 'm2',
        categoria: 'estructura',
        descripcion: 'Perfiles galvanizados para steel frame'
      },
      {
        id: 3,
        nombre: 'Hierro Redondo',
        precio_por_m2: 1200,
        unidad: 'kg',
        categoria: 'estructura',
        descripcion: 'Hierro redondo para refuerzos'
      },
      {
        id: 4,
        nombre: 'Chapa Acanalada',
        precio_por_m2: 450,
        unidad: 'm2',
        categoria: 'cubierta',
        descripcion: 'Chapa galvanizada para techos'
      },
      {
        id: 5,
        nombre: 'Lana Mineral',
        precio_por_m2: 120,
        unidad: 'm2',
        categoria: 'aislamiento',
        descripcion: 'Aislamiento térmico y acústico'
      },
      {
        id: 6,
        nombre: 'Placa de Yeso',
        precio_por_m2: 180,
        unidad: 'm2',
        categoria: 'interior',
        descripcion: 'Placas para cielorrasos y tabiques'
      },
      {
        id: 7,
        nombre: 'Pintura Interior',
        precio_por_m2: 85,
        unidad: 'm2',
        categoria: 'terminacion',
        descripcion: 'Pintura látex para interiores'
      },
      {
        id: 8,
        nombre: 'Cerámica',
        precio_por_m2: 320,
        unidad: 'm2',
        categoria: 'terminacion',
        descripcion: 'Cerámica para pisos y revestimientos'
      }
    ];
    console.log(`📦 ${this.availableMaterials.length} materiales de respaldo cargados`);
  }

  showMaterialsModal() {
    const modal = this.createMaterialsModal();
    document.body.appendChild(modal);
    
    // Mostrar modal con animación
    setTimeout(() => modal.classList.add('show'), 10);
  }

  createMaterialsModal() {
    const modal = document.createElement('div');
    modal.className = 'materials-modal';
    modal.innerHTML = `
      <div class="materials-modal-content">
        <div class="materials-modal-header">
          <h3><i class="fas fa-tools"></i> Seleccionar Materiales</h3>
          <button class="close-btn" onclick="this.closest('.materials-modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="materials-modal-body">
          <div class="materials-filters">
            <button class="filter-btn active" data-category="todos">Todos</button>
            <button class="filter-btn" data-category="estructura">Estructura</button>
            <button class="filter-btn" data-category="cubierta">Cubierta</button>
            <button class="filter-btn" data-category="aislamiento">Aislamiento</button>
            <button class="filter-btn" data-category="interior">Interior</button>
            <button class="filter-btn" data-category="terminacion">Terminación</button>
          </div>
          
          <div class="materials-search">
            <input type="text" placeholder="Buscar materiales..." id="materialsSearch">
            <i class="fas fa-search"></i>
          </div>
          
          <div class="materials-list" id="materialsModalList">
            ${this.renderMaterialsList(this.availableMaterials)}
          </div>
        </div>
        
        <div class="materials-modal-footer">
          <div class="selected-summary">
            <span>Materiales seleccionados: <strong id="selectedCount">${this.selectedMaterials.length}</strong></span>
            <span>Total: <strong id="selectedTotal">U$D ${this.materialsTotal.toLocaleString()}</strong></span>
          </div>
          <button class="btn primary" onclick="this.closest('.materials-modal').remove()">
            Confirmar Selección
          </button>
        </div>
      </div>
    `;

    // Agregar estilos
    this.addModalStyles();
    
    // Configurar filtros y búsqueda
    this.setupModalFunctionality(modal);
    
    return modal;
  }

  renderMaterialsList(materials) {
    return materials.map(material => `
      <div class="material-item" data-category="${material.categoria}">
        <div class="material-info">
          <h4>${material.nombre}</h4>
          <p>${material.descripcion}</p>
          <div class="material-details">
            <span class="category">${material.categoria}</span>
            <span class="price">U$D ${material.precio_por_m2.toLocaleString()}/${material.unidad}</span>
          </div>
        </div>
        <div class="material-actions">
          <div class="quantity-input">
            <label>Cantidad:</label>
            <input type="number" min="1" value="1" class="material-quantity" data-material-id="${material.id}">
            <span class="unit">${material.unidad}</span>
          </div>
          <button class="btn secondary add-material-btn" data-material='${JSON.stringify(material)}'>
            <i class="fas fa-plus"></i> Agregar
          </button>
        </div>
      </div>
    `).join('');
  }

  setupModalFunctionality(modal) {
    // Filtros por categoría
    const filterBtns = modal.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterMaterials(modal, e.target.dataset.category);
      });
    });

    // Búsqueda
    const searchInput = modal.querySelector('#materialsSearch');
    searchInput.addEventListener('input', (e) => {
      this.searchMaterials(modal, e.target.value);
    });

    // Botones agregar material
    const addBtns = modal.querySelectorAll('.add-material-btn');
    addBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const materialData = JSON.parse(e.target.dataset.material);
        const quantityInput = e.target.closest('.material-item').querySelector('.material-quantity');
        const quantity = parseInt(quantityInput.value) || 1;
        this.addMaterialToQuote(materialData, quantity);
        this.updateModalSummary(modal);
      });
    });
  }

  filterMaterials(modal, category) {
    const materialsList = modal.querySelector('#materialsModalList');
    const materials = materialsList.querySelectorAll('.material-item');
    
    materials.forEach(material => {
      if (category === 'todos' || material.dataset.category === category) {
        material.style.display = 'block';
      } else {
        material.style.display = 'none';
      }
    });
  }

  searchMaterials(modal, searchTerm) {
    const materialsList = modal.querySelector('#materialsModalList');
    const materials = materialsList.querySelectorAll('.material-item');
    
    materials.forEach(material => {
      const materialName = material.querySelector('h4').textContent.toLowerCase();
      const materialDesc = material.querySelector('p').textContent.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      if (materialName.includes(search) || materialDesc.includes(search)) {
        material.style.display = 'block';
      } else {
        material.style.display = 'none';
      }
    });
  }

  addMaterialToQuote(material, quantity) {
    console.log('🔄 Agregando material a la cotización:', material, 'cantidad:', quantity);
    
    // Verificar si el material ya está seleccionado
    const existingIndex = this.selectedMaterials.findIndex(m => m.id === material.id);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad
      this.selectedMaterials[existingIndex].cantidad += quantity;
      this.selectedMaterials[existingIndex].total = this.selectedMaterials[existingIndex].cantidad * material.precio_por_m2;
      console.log('📝 Material existente actualizado:', this.selectedMaterials[existingIndex]);
    } else {
      // Agregar nuevo material
      const materialToAdd = {
        ...material,
        cantidad: quantity,
        precio_unitario: material.precio_por_m2,
        total: quantity * material.precio_por_m2
      };
      this.selectedMaterials.push(materialToAdd);
      console.log('➕ Nuevo material agregado:', materialToAdd);
    }
    
    console.log('📊 Materiales seleccionados:', this.selectedMaterials);
    
    this.updateMaterialsTotal();
    this.renderSelectedMaterials();
    
    // Mostrar notificación
    this.showNotification(`${material.nombre} agregado a la cotización`, 'success');
  }

  removeMaterialFromQuote(materialId) {
    this.selectedMaterials = this.selectedMaterials.filter(m => m.id !== materialId);
    this.updateMaterialsTotal();
    this.renderSelectedMaterials();
  }

  updateMaterialsTotal() {
    this.materialsTotal = this.selectedMaterials.reduce((sum, material) => sum + material.total, 0);
    
    // Actualizar display del total
    const totalElement = document.getElementById('materialsTotal');
    if (totalElement) {
      totalElement.textContent = `U$D ${this.materialsTotal.toLocaleString()}`;
      console.log('💰 Total actualizado:', `U$D ${this.materialsTotal.toLocaleString()}`);
    }
    
    // También actualizar el total en el modal si está abierto
    const modal = document.querySelector('.materials-modal');
    if (modal) {
      this.updateModalSummary(modal);
    }
    
    // Verificar que todos los elementos de total usen USD
    const allTotalElements = document.querySelectorAll('[id*="total"], [id*="Total"]');
    allTotalElements.forEach(element => {
      if (element.textContent.includes('$') && !element.textContent.includes('U$D')) {
        element.textContent = element.textContent.replace('$', 'U$D ');
        console.log('🔄 Moneda corregida en:', element);
      }
    });
  }

  renderSelectedMaterials() {
    console.log('🎨 Renderizando materiales seleccionados...');
    const materialsList = document.getElementById('selectedMaterialsList');
    if (!materialsList) {
      console.error('❌ Elemento selectedMaterialsList no encontrado');
      return;
    }

    console.log('📋 Materiales a renderizar:', this.selectedMaterials);

    if (this.selectedMaterials.length === 0) {
      materialsList.innerHTML = `
        <div class="no-materials-message">
          <i class="fas fa-info-circle"></i>
          <p>No has agregado materiales aún. Haz clic en "Agregar Material" para comenzar.</p>
        </div>
      `;
      console.log('📭 No hay materiales para mostrar');
      return;
    }

    const htmlContent = this.selectedMaterials.map(material => `
      <div class="material-item-selected" data-material-id="${material.id}">
        <div class="material-info">
          <h4>${material.nombre}</h4>
          <p>${material.descripcion}</p>
        </div>
        <div class="material-details">
          <span class="quantity">${material.cantidad} ${material.unidad}</span>
          <span class="price">U$D ${material.precio_unitario.toLocaleString()}/${material.unidad}</span>
          <span class="total">U$D ${material.total.toLocaleString()}</span>
        </div>
        <button class="remove-material-btn" onclick="materialsQuoteManager.removeMaterialFromQuote(${material.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
    
    materialsList.innerHTML = htmlContent;
    console.log('✅ Materiales renderizados correctamente');
  }

  updateModalSummary(modal) {
    const selectedCount = modal.querySelector('#selectedCount');
    const selectedTotal = modal.querySelector('#selectedTotal');
    
    if (selectedCount) selectedCount.textContent = this.selectedMaterials.length;
    if (selectedTotal) selectedTotal.textContent = `U$D ${this.materialsTotal.toLocaleString()}`;
  }

  validateMaterialsBeforeCalculation() {
    if (this.selectedMaterials.length === 0) {
      this.showMaterialsError('Debes agregar al menos un material antes de calcular la cotización. Haz clic en "Agregar Material" para comenzar.');
      return false;
    }
    return true;
  }

  showMaterialsError(message) {
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
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  addModalStyles() {
    if (document.getElementById('materials-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'materials-modal-styles';
    styles.textContent = `
      .materials-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .materials-modal.show {
        opacity: 1;
      }
      
      .materials-modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }
      
      .materials-modal-header {
        background: var(--primary-color);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .materials-modal-header h3 {
        margin: 0;
        font-size: 1.5rem;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
      }
      
      .materials-modal-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .materials-filters {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      
      .filter-btn {
        padding: 8px 16px;
        border: 1px solid var(--gray-300);
        background: white;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .filter-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
      
      .materials-search {
        position: relative;
        margin-bottom: 20px;
      }
      
      .materials-search input {
        width: 100%;
        padding: 12px 40px 12px 16px;
        border: 1px solid var(--gray-300);
        border-radius: 8px;
        font-size: 1rem;
      }
      
      .materials-search i {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--gray-500);
      }
      
      .material-item {
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }
      
      .material-info h4 {
        margin: 0 0 8px 0;
        color: var(--gray-800);
      }
      
      .material-info p {
        margin: 0 0 12px 0;
        color: var(--gray-600);
        font-size: 0.9rem;
      }
      
      .material-details {
        display: flex;
        gap: 16px;
      }
      
      .category {
        background: var(--primary-color);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        text-transform: capitalize;
      }
      
      .price {
        color: var(--primary-color);
        font-weight: 600;
      }
      
      .material-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
      }
      
      .quantity-input {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .quantity-input label {
        font-size: 0.9rem;
        color: var(--gray-600);
      }
      
      .material-quantity {
        width: 60px;
        padding: 4px 8px;
        border: 1px solid var(--gray-300);
        border-radius: 4px;
        text-align: center;
      }
      
      .unit {
        font-size: 0.8rem;
        color: var(--gray-500);
      }
      
      .materials-modal-footer {
        background: var(--gray-50);
        padding: 20px;
        border-top: 1px solid var(--gray-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .selected-summary {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .selected-summary span {
        font-size: 0.9rem;
        color: var(--gray-600);
      }
      
      .selected-summary strong {
        color: var(--primary-color);
      }
      
      .material-item-selected {
        background: var(--gray-50);
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      
      .remove-material-btn {
        background: var(--error);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s ease;
      }
      
      .remove-material-btn:hover {
        background: var(--error-dark);
      }
      
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }
      
      .notification.show {
        transform: translateX(0);
      }
      
      .notification-success {
        border-left: 4px solid var(--success);
      }
      
      .notification-info {
        border-left: 4px solid var(--info);
      }
      
      @media (max-width: 768px) {
        .materials-modal-content {
          width: 95%;
          margin: 20px;
        }
        
        .material-item {
          flex-direction: column;
          align-items: stretch;
        }
        
        .material-actions {
          flex-direction: row;
          justify-content: space-between;
        }
        
        .materials-modal-footer {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  // Getters para acceder a los datos desde otros módulos
  getSelectedMaterials() {
    return this.selectedMaterials;
  }

  getMaterialsTotal() {
    return this.materialsTotal;
  }

  clearSelection() {
    this.selectedMaterials = [];
    this.materialsTotal = 0;
    this.renderSelectedMaterials();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.materialsQuoteManager = new MaterialsQuoteManager();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialsQuoteManager;
}
