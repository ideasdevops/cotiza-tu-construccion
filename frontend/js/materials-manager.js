// Gestor de Materiales para Cotizador de Construcción
class MaterialsManager {
    constructor() {
        this.materials = [];
        this.grid = document.getElementById("materialsGrid");
        this.init();
    }

    async init() {
        console.log("🔧 Inicializando gestor de materiales...");
        await this.loadMaterials();
    }

    async loadMaterials() {
        try {
            console.log("📦 Cargando materiales...");
            this.showLoading();
            
            const response = await fetch("/api/materiales/precios");
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            console.log("📦 Materiales cargados:", data);
            
            this.materials = this.processMaterials(data);
            this.renderMaterials();
            
            console.log(`✅ ${this.materials.length} materiales cargados exitosamente`);
            
        } catch (error) {
            console.error("❌ Error cargando materiales:", error);
            this.showError("Error al cargar los materiales. Mostrando materiales por defecto.");
            
            // Cargar materiales por defecto en caso de error
            this.materials = this.getDefaultMaterials();
            this.renderMaterials();
        }
    }

    processMaterials(data) {
        if (data && Array.isArray(data)) {
            return data.map(material => ({
                id: material.id || Math.random().toString(36).substr(2, 9),
                name: material.nombre || material.name || "Material",
                category: material.categoria || material.category || "general",
                description: material.descripcion || material.description || "Descripción no disponible",
                price: material.precio || material.price || 0,
                unit: material.unidad || material.unit || "unidad"
            }));
        }
        return this.getDefaultMaterials();
    }

    getDefaultMaterials() {
        return [
            {
                id: "1",
                name: "Perfil C 100x50x2mm",
                category: "estructura",
                description: "Perfil de acero galvanizado para estructura steel frame",
                price: 25.50,
                unit: "metro lineal"
            },
            {
                id: "2",
                name: "Panel OSB 15mm",
                category: "estructura",
                description: "Panel estructural OSB para revestimiento",
                price: 18.75,
                unit: "m²"
            },
            {
                id: "3",
                name: "Aislante Lana de Vidrio 100mm",
                category: "aislamiento",
                description: "Aislante térmico y acústico de lana de vidrio",
                price: 8.90,
                unit: "m²"
            }
        ];
    }

    renderMaterials() {
        if (!this.grid) return;
        this.grid.innerHTML = this.materials.map(material => `
            <div class="material-card">
                <div class="material-header">
                    <div class="material-name">${material.name}</div>
                    <div class="material-category">${this.formatCategory(material.category)}</div>
                </div>
                <div class="material-description">${material.description}</div>
                <div class="material-price">
                    <span class="price-value">U$D ${material.price.toFixed(2)}</span>
                    <span class="price-unit">por ${material.unit}</span>
                </div>
            </div>
        `).join("");
    }

    formatCategory(category) {
        const categories = {
            "estructura": "Estructura",
            "cubierta": "Cubierta",
            "aislamiento": "Aislamiento",
            "interior": "Interior",
            "terminacion": "Terminación"
        };
        return categories[category] || category;
    }

    showLoading() {
        if (this.grid) {
            this.grid.innerHTML = "<div class=\"materials-loading\"><p>Cargando materiales...</p></div>";
        }
    }

    showError(message) {
        if (this.grid) {
            this.grid.innerHTML = `<div class=\"materials-error\"><p>${message}</p></div>`;
        }
    }
}

function openWhatsAppForMaterials() {
    const message = "Hola! Me interesa solicitar una cotización de materiales de construcción.";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5492617110120?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
    new MaterialsManager();
});
