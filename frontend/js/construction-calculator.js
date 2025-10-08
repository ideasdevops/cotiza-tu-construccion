/**
 * Calculadora de Construcción Simplificada
 * Basada en la lógica exitosa del cotizador solar
 */

class ConstructionCalculator {
    constructor() {
        console.log('🔧 Inicializando ConstructionCalculator...');
        
        this.form = document.getElementById('constructionForm');
        this.estimateBtn = document.getElementById('estimate-btn');
        this.currentEstimation = null;
        this.currentQuote = null;
        
        if (!this.form) {
            console.error('❌ No se encontró el formulario con ID constructionForm');
            return;
        }
        
        if (!this.estimateBtn) {
            console.error('❌ No se encontró el botón de estimación con ID estimate-btn');
            return;
        }
        
        this.submitBtn = this.form.querySelector('button[type="submit"]');
        
        console.log('✅ Elementos del formulario encontrados correctamente');
        this.init();
    }

    init() {
        console.log('🚀 Inicializando Calculadora de Construcción...');
        
        // Event listeners
        this.estimateBtn.addEventListener('click', () => this.performQuickEstimate());
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Inicializar tiempo de formulario (si existe el campo)
        const formStartTimeField = this.form.querySelector('#formStartTime');
        if (formStartTimeField) {
            formStartTimeField.value = Date.now();
        }
        
        console.log('✅ Calculadora de Construcción inicializada');
    }

    async performQuickEstimate() {
        console.log('⚡ Iniciando estimación rápida...');
        
        try {
            // Validar datos mínimos
            const formData = this.getFormData();
            if (!this.validateMinimalData(formData)) {
                this.showError('Por favor completa los campos requeridos para la estimación rápida.');
                return;
            }

            // Mostrar loading
            this.showLoading('Calculando estimación rápida...');

            // Llamar al endpoint de estimación rápida
            console.log('📤 Enviando datos al backend:', formData);
            const response = await fetch('/api/construction/estimate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error del servidor:', response.status, errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('📊 Respuesta recibida:', responseData);

            // Mostrar modal de estimación rápida
            this.showQuickEstimateModal(responseData);

        } catch (error) {
            console.error('❌ Error en estimación rápida:', error);
            this.showError('Error al calcular la estimación rápida. Intenta nuevamente.');
        } finally {
            this.hideLoading();
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        console.log('📋 Procesando formulario de cotización completa...');

        try {
            // Validar formulario completo
            const formData = this.getFormData();
            if (!this.validateFormData(formData)) {
                this.showError('Por favor completa todos los campos requeridos.');
                return;
            }

            // Mostrar loading
            this.showLoading('Calculando cotización completa...');

            // Llamar al endpoint de cotización completa
            console.log('📤 Enviando datos de cotización detallada:', formData);
            const response = await fetch('/api/construction/quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error del servidor en cotización detallada:', response.status, errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('📊 Respuesta completa recibida:', responseData);

            // Mostrar modal de cotización completa
            this.showDetailedQuoteModal(responseData);

        } catch (error) {
            console.error('❌ Error en cotización completa:', error);
            this.showError('Error al calcular la cotización completa. Intenta nuevamente.');
        } finally {
            this.hideLoading();
        }
    }

    getFormData() {
        console.log('📋 Obteniendo datos del formulario...');
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
            console.log(`📋 Campo: ${key} = ${value}`);
        }

        // Agregar tiempo de envío
        data.formSubmissionTime = Date.now();
        
        // Mapear nombres de campos del HTML a los esperados por el backend
        const mappedData = {
            clientName: data.clientName || '',
            clientEmail: data.clientEmail || '',
            clientPhone: data.clientPhone || '',
            location: data.location || '',
            constructionType: data.constructionType || '',
            squareMeters: data.squareMeters || '',
            floors: data.floors || '1',
            usageType: data.usageType || '',
            finishLevel: data.finishLevel || '',
            formStartTime: data.formStartTime || Date.now(),
            formSubmissionTime: data.formSubmissionTime || Date.now()
        };
        
        console.log('📋 Datos mapeados:', mappedData);
        
        console.log('📋 Datos del formulario:', mappedData);
        return mappedData;
    }

    validateMinimalData(data) {
        console.log('🔍 Validando datos mínimos:', data);
        const required = ['clientName', 'clientEmail', 'clientPhone', 'location', 'constructionType', 'squareMeters'];
        
        for (let field of required) {
            if (!data[field] || data[field].trim() === '') {
                console.warn(`⚠️ Campo requerido faltante: ${field} (valor: ${data[field]})`);
                return false;
            }
        }
        
        console.log('✅ Validación mínima exitosa');
        return true;
    }

    validateFormData(data) {
        console.log('🔍 Validando datos del formulario:', data);
        
        // Validar datos mínimos
        if (!this.validateMinimalData(data)) {
            console.warn('❌ Validación mínima falló');
            return false;
        }

        // Validar campos adicionales para cotización completa
        const additionalRequired = ['usageType', 'finishLevel'];
        
        for (let field of additionalRequired) {
            if (!data[field] || data[field].trim() === '') {
                console.warn(`⚠️ Campo requerido faltante: ${field} (valor: ${data[field]})`);
                return false;
            }
        }
        
        console.log('✅ Validación de formulario exitosa');

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.clientEmail)) {
            console.warn('⚠️ Email inválido');
            return false;
        }

        // Validar teléfono
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(data.clientPhone)) {
            console.warn('⚠️ Teléfono inválido');
            return false;
        }

        return true;
    }

    showQuickEstimateModal(response_data) {
        console.log('📊 Mostrando modal de estimación rápida...');
        console.log('📊 Datos recibidos:', response_data);
        
        const modal = document.getElementById('quickEstimateModal');
        const content = document.getElementById('quickEstimateContent');
        
        if (!modal || !content) {
            console.error('❌ Modal o contenido no encontrado');
            return;
        }
        
        // Extraer estimation de la respuesta
        const estimation = response_data.estimation || response_data;
        console.log('📋 Estimation extraído:', estimation);
        
        // Guardar estimation actual para PDF
        this.currentEstimation = estimation;
        
        // Validar y extraer datos de manera segura
        const area = estimation?.area || 'N/A';
        const constructionType = estimation?.construction_type || 'N/A';
        const cost = estimation?.estimated_cost || 'N/A';
        const time = estimation?.estimated_time || 'N/A';
        const location = estimation?.location || 'N/A';
        const usageType = estimation?.usage_type || 'N/A';
        const finishLevel = estimation?.finish_level || 'N/A';
        
        console.log('📊 Datos extraídos:', { area, constructionType, cost, time, location, usageType, finishLevel });
        
        content.innerHTML = `
            <div class="quick-estimate-summary">
                <div class="estimate-card">
                    <h3><i class="fas fa-building"></i> Área</h3>
                    <div class="value">${area}</div>
                    <div class="label">Metros Cuadrados</div>
                </div>
                <div class="estimate-card">
                    <h3><i class="fas fa-home"></i> Tipo</h3>
                    <div class="value">${constructionType}</div>
                    <div class="label">Construcción</div>
                </div>
                <div class="estimate-card">
                    <h3><i class="fas fa-dollar-sign"></i> Costo</h3>
                    <div class="value">${cost}</div>
                    <div class="label">Estimado</div>
                </div>
                <div class="estimate-card">
                    <h3><i class="fas fa-clock"></i> Tiempo</h3>
                    <div class="value">${time}</div>
                    <div class="label">Estimado</div>
                </div>
            </div>
            <div class="quote-section">
                <h3><i class="fas fa-info-circle"></i> Información de la Estimación</h3>
                <p><strong>Área:</strong> ${area}</p>
                <p><strong>Ubicación:</strong> ${location}</p>
                <p><strong>Tipo de uso:</strong> ${usageType}</p>
                <p><strong>Nivel de terminación:</strong> ${finishLevel}</p>
            </div>
        `;

        // Mostrar modal
        modal.style.display = 'flex';
    }

    showDetailedQuoteModal(response_data) {
        console.log('📊 Mostrando modal de cotización completa...');
        console.log('📊 Datos recibidos:', response_data);
        
        const modal = document.getElementById('detailedQuoteModal');
        const content = document.getElementById('detailedQuoteContent');
        
        if (!modal || !content) {
            console.error('❌ Modal o contenido no encontrado');
            return;
        }
        
        // Extraer quote de la respuesta
        const quote = response_data.quote || response_data;
        console.log('📋 Quote extraído:', quote);
        
        // Guardar quote actual para PDF
        this.currentQuote = quote;
        
        // Validar y extraer datos de manera segura
        const clientName = quote?.client_name || 'N/A';
        const constructionType = quote?.construction_type || 'N/A';
        const area = quote?.area || 'N/A';
        const floors = quote?.floors || 'N/A';
        const totalCost = quote?.total_cost || 'N/A';
        const estimatedTime = quote?.estimated_time || 'N/A';
        const finishLevel = quote?.finish_level || 'N/A';
        const location = quote?.location || 'N/A';
        const usageType = quote?.usage_type || 'N/A';
        const breakdown = quote?.breakdown || [];
        
        console.log('📊 Datos extraídos:', { clientName, constructionType, area, floors, totalCost, estimatedTime, finishLevel, location, usageType, breakdown });
        
        content.innerHTML = `
            <div class="detailed-quote-summary">
                <div class="quote-section">
                    <h3><i class="fas fa-building"></i> Información del Proyecto</h3>
                    <div class="quote-grid">
                        <div class="quote-item">
                            <span class="label">Cliente:</span>
                            <span class="value">${clientName}</span>
                        </div>
                        <div class="quote-item">
                            <span class="label">Tipo de Construcción:</span>
                            <span class="value">${constructionType}</span>
                        </div>
                        <div class="quote-item">
                            <span class="label">Área:</span>
                            <span class="value">${area}</span>
                        </div>
                        <div class="quote-item">
                            <span class="label">Pisos:</span>
                            <span class="value">${floors}</span>
                        </div>
                        <div class="quote-item">
                            <span class="label">Ubicación:</span>
                            <span class="value">${location}</span>
                        </div>
                        <div class="quote-item">
                            <span class="label">Tipo de Uso:</span>
                            <span class="value">${usageType}</span>
                        </div>
                        <div class="quote-item">
                            <span class="label">Nivel de Terminación:</span>
                            <span class="value">${finishLevel}</span>
                        </div>
                        <div class="quote-item">
                            <span class="label">Tiempo Estimado:</span>
                            <span class="value">${estimatedTime}</span>
                        </div>
                    </div>
                </div>

                <div class="quote-section">
                    <h3><i class="fas fa-calculator"></i> Desglose de Costos</h3>
                    <div class="breakdown-list">
                        ${breakdown.map(item => `
                            <div class="breakdown-item">
                                <span class="breakdown-label">${item.category || 'Categoría'}:</span>
                                <span class="breakdown-value">${item.cost || 'N/A'}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="quote-total">
                        <span class="total-label">Total Estimado:</span>
                        <span class="total-value">${totalCost}</span>
                    </div>
                </div>
            </div>
        `;

        // Configurar botones de email y PDF
        this.setupQuoteModalButtons(quote);

        // Mostrar modal
        modal.style.display = 'flex';
    }

    populateCostBreakdown(breakdown) {
        const breakdownList = document.getElementById('quoteBreakdown');
        breakdownList.innerHTML = '';

        if (!breakdown || breakdown.length === 0) {
            breakdownList.innerHTML = '<p>No hay desglose de costos disponible.</p>';
            return;
        }

        breakdown.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'breakdown-item';
            itemDiv.innerHTML = `
                <span class="breakdown-label">${item.category || 'Categoría'}:</span>
                <span class="breakdown-value">${item.cost || 'N/A'}</span>
            `;
            breakdownList.appendChild(itemDiv);
        });
    }

    setupQuoteModalButtons(quote) {
        console.log('🔧 Configurando botones del modal de cotización...');
        
        // Botón de descargar PDF
        const downloadBtn = document.getElementById('btnDownloadPDF');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                console.log('📄 Descargando PDF...');
                downloadConstructionQuotePDF(quote);
            };
        }
        
        // Botón de WhatsApp
        const whatsappBtn = document.getElementById('btnWhatsApp');
        if (whatsappBtn) {
            whatsappBtn.onclick = () => {
                console.log('📱 Redirigiendo a WhatsApp...');
                this.requestPersonalizedQuote(quote);
            };
        }
        
        // Mostrar mensaje de que el email se envió automáticamente
        console.log('📧 Email enviado automáticamente al cliente');
        this.showSuccess('Cotización enviada por email automáticamente');
    }

    requestPersonalizedQuote(quote) {
        console.log('📱 Redirigiendo a WhatsApp para cotización personalizada...');
        
        const whatsappNumber = '+5492617110120';
        const message = `Hola! Me interesa una cotización personalizada para mi proyecto de construcción:

📋 *Detalles del Proyecto:*
• Tipo: ${quote.construction_type || 'N/A'}
• Área: ${quote.area || 'N/A'}
• Pisos: ${quote.floors || 'N/A'}
• Terminación: ${quote.finish_level || 'N/A'}
• Ubicación: ${quote.location || 'N/A'}

💰 *Cotización Estimada:*
• Total: ${quote.total_cost || 'N/A'}
• Tiempo: ${quote.estimated_time || 'N/A'}

👤 *Mis Datos:*
• Nombre: ${quote.client_name || 'N/A'}
• Email: ${quote.client_email || 'N/A'}
• Teléfono: ${quote.client_phone || 'N/A'}

¿Podrían contactarme para coordinar una reunión y discutir los detalles? ¡Gracias!`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    }

    showLoading(message) {
        // Crear overlay de loading si no existe
        let loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loadingOverlay';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        } else {
            loadingOverlay.querySelector('.loading-message').textContent = message;
        }
        
        loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showError(message) {
        // Crear notificación de error
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Funciones globales para los modales
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function downloadQuickEstimatePDF() {
    console.log('📄 Generando PDF de estimación rápida...');
    
    // Crear contenido HTML para el PDF
    const content = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6B2E3A; margin: 0;">SUMPETROL</h1>
                <h2 style="color: #6B2E3A; margin: 10px 0;">Estimación Rápida de Construcción</h2>
                <p style="color: #666; margin: 0;">Generado el ${new Date().toLocaleDateString('es-AR')}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #6B2E3A; margin-top: 0;">Resumen del Proyecto</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div><strong>Área del Proyecto:</strong> ${document.getElementById('quickArea').textContent}</div>
                    <div><strong>Tipo de Construcción:</strong> ${document.getElementById('quickType').textContent}</div>
                    <div><strong>Costo Estimado:</strong> ${document.getElementById('quickCost').textContent}</div>
                    <div><strong>Tiempo Estimado:</strong> ${document.getElementById('quickTime').textContent}</div>
                </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0;"><strong>Nota:</strong> Esta es una estimación rápida basada en parámetros estándar. Para una cotización detallada con materiales específicos, contacta con nuestro equipo de ventas.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p><strong>SUMPETROL</strong> - Construcción y Servicios Industriales</p>
                <p>Email: ventas@sumpetrol.com.ar | Teléfono: +54 9 261 7110120</p>
                <p>Mendoza: Acceso Sur - Lateral Este 4585, Luján de Cuyo</p>
                <p>Río Negro: Vicente Lazaretti 903 - Cipolletti</p>
            </div>
        </div>
    `;
    
    // Crear ventana para imprimir
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Estimación Rápida - SUMPETROL</title>
                <style>
                    body { margin: 0; padding: 20px; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function downloadDetailedQuotePDF() {
    console.log('📄 Generando PDF de cotización completa...');
    
    // Crear contenido HTML para el PDF
    const content = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6B2E3A; margin: 0;">SUMPETROL</h1>
                <h2 style="color: #6B2E3A; margin: 10px 0;">Cotización Completa de Construcción</h2>
                <p style="color: #666; margin: 0;">Generado el ${new Date().toLocaleDateString('es-AR')}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #6B2E3A; margin-top: 0;">Resumen del Proyecto</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div><strong>Cliente:</strong> ${document.getElementById('quoteClientName').textContent}</div>
                    <div><strong>Tipo:</strong> ${document.getElementById('quoteConstructionType').textContent}</div>
                    <div><strong>Área:</strong> ${document.getElementById('quoteArea').textContent}</div>
                    <div><strong>Pisos:</strong> ${document.getElementById('quoteFloors').textContent}</div>
                    <div><strong>Tiempo:</strong> ${document.getElementById('quoteTime').textContent}</div>
                    <div><strong>Terminación:</strong> ${document.getElementById('quoteFinishLevel').textContent}</div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #6B2E3A; margin-top: 0;">Desglose de Costos</h3>
                <div id="pdf-breakdown">
                    ${document.getElementById('quoteBreakdown').innerHTML}
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #6B2E3A;">
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                        <span>Total Estimado:</span>
                        <span style="color: #6B2E3A;">${document.getElementById('quoteTotal').textContent}</span>
                    </div>
                </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0;"><strong>Nota:</strong> Esta cotización es válida por 30 días desde la fecha de emisión. Los precios están sujetos a cambios sin previo aviso.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p><strong>SUMPETROL</strong> - Construcción y Servicios Industriales</p>
                <p>Email: ventas@sumpetrol.com.ar | Teléfono: +54 9 261 7110120</p>
                <p>Mendoza: Acceso Sur - Lateral Este 4585, Luján de Cuyo</p>
                <p>Río Negro: Vicente Lazaretti 903 - Cipolletti</p>
            </div>
        </div>
    `;
    
    // Crear ventana para imprimir
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Cotización Completa - SUMPETROL</title>
                <style>
                    body { margin: 0; padding: 20px; }
                    .breakdown-item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .breakdown-label { font-weight: bold; }
                    .breakdown-value { color: #6B2E3A; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function openWhatsAppForQuote() {
    console.log('📱 Abriendo WhatsApp para cotización...');
    
    const formData = new FormData(document.getElementById('constructionForm'));
    const clientName = formData.get('clientName') || 'Cliente';
    const clientPhone = formData.get('clientPhone') || '';
    const location = formData.get('location') || '';
    const constructionType = formData.get('constructionType') || '';
    const squareMeters = formData.get('squareMeters') || '';
    
    const message = `Hola! Soy ${clientName} y me interesa solicitar una cotización personalizada para construcción.

📋 Detalles del proyecto:
• Tipo: ${constructionType}
• Área: ${squareMeters} m²
• Ubicación: ${location}
• Teléfono: ${clientPhone}

¿Podrían contactarme para coordinar una reunión y recibir una cotización detallada?`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5492617110120?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

function requestPersonalizedQuote() {
    console.log('📧 Solicitando cotización personalizada...');
    
    const formData = new FormData(document.getElementById('constructionForm'));
    const clientName = formData.get('clientName') || 'Cliente';
    const clientPhone = formData.get('clientPhone') || '';
    const location = formData.get('location') || '';
    const constructionType = formData.get('constructionType') || '';
    const squareMeters = formData.get('squareMeters') || '';
    const usageType = formData.get('usageType') || '';
    const finishLevel = formData.get('finishLevel') || '';
    const floors = formData.get('floors') || '1';
    
    const message = `Hola! Soy ${clientName} y me interesa solicitar una cotización personalizada para construcción.

📋 Detalles del proyecto:
• Tipo: ${constructionType}
• Uso: ${usageType}
• Área: ${squareMeters} m²
• Pisos: ${floors}
• Terminación: ${finishLevel}
• Ubicación: ${location}
• Teléfono: ${clientPhone}

¿Podrían contactarme para coordinar una reunión y recibir una cotización detallada?`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5492617110120?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

function submitClientInfo() {
    console.log('📝 Enviando información del cliente...');
    
    const form = document.getElementById('clientInfoForm');
    const formData = new FormData(form);
    
    const clientData = {
        name: formData.get('clientInfoName'),
        email: formData.get('clientInfoEmail'),
        phone: formData.get('clientInfoPhone'),
        message: formData.get('clientInfoMessage')
    };
    
    // Validar datos
    if (!clientData.name || !clientData.email || !clientData.phone) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
        alert('Por favor ingresa un email válido.');
        return;
    }
    
    // Validar teléfono
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(clientData.phone)) {
        alert('Por favor ingresa un teléfono válido.');
        return;
    }
    
    // Enviar datos
    fetch('/contacto/enviar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('¡Información enviada exitosamente! Te contactaremos pronto.');
            closeModal('clientInfoModal');
            form.reset();
        } else {
            alert('Error al enviar la información. Intenta nuevamente.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al enviar la información. Intenta nuevamente.');
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ConstructionCalculator();
    
    // Event listeners para cerrar modales
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
    });
});

// ============================================================================
// FUNCIONES DE EMAIL
// ============================================================================

/**
 * Envía email de cotización de construcción
 */
async function sendConstructionQuoteEmail(quoteData) {
    try {
        console.log('📧 Enviando email de cotización de construcción...');
        
        // Preparar datos para el email
        const emailData = {
            nombre: quoteData.client_name || 'Cliente',
            email: quoteData.client_email || '',
            telefono: quoteData.client_phone || '',
            whatsapp: quoteData.client_phone || '',
            provincia: quoteData.location || '',
            tipo_construccion: quoteData.construction_type || '',
            metros_cuadrados: quoteData.area ? parseFloat(quoteData.area.replace(' m²', '')) : 0,
            pisos: quoteData.floors || 1,
            tipo_uso: quoteData.usage_type || '',
            nivel_terminacion: quoteData.finish_level || '',
            total_estimado: quoteData.total_cost || 'N/A',
            materiales: quoteData.breakdown || [],
            observaciones: `Proyecto de ${quoteData.construction_type} en ${quoteData.location}`,
            tiempo_estimado: quoteData.estimated_time || 'N/A'
        };
        
        console.log('📋 Datos del email:', emailData);
        
        // Enviar email usando servicio de Node.js
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: emailData.email,
                subject: `🏗️ Cotización de Construcción - ${emailData.nombre}`,
                html: generateConstructionEmailHTML(emailData)
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Email enviado exitosamente:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        throw error;
    }
}

/**
 * Descarga PDF de cotización
 */
function downloadConstructionQuotePDF(quoteData) {
    try {
        console.log('📄 Generando PDF de cotización de construcción...');
        
        // Crear contenido HTML para el PDF
        const content = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #dc2626; margin-bottom: 10px;">SUMPETROL</h1>
                    <h2 style="color: #dc2626; margin-bottom: 5px;">Cotización Completa de Construcción</h2>
                    <p style="color: #666; margin: 0;">Generado el ${new Date().toLocaleDateString('es-AR')}</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #dc2626; margin-top: 0;">Resumen del Proyecto</h3>
                    <p><strong>Cliente:</strong> ${quoteData.client_name || 'N/A'}</p>
                    <p><strong>Área:</strong> ${quoteData.area || 'N/A'}</p>
                    <p><strong>Tiempo:</strong> ${quoteData.estimated_time || 'N/A'}</p>
                    <p><strong>Tipo:</strong> ${quoteData.construction_type || 'N/A'}</p>
                    <p><strong>Pisos:</strong> ${quoteData.floors || 'N/A'}</p>
                    <p><strong>Terminación:</strong> ${quoteData.finish_level || 'N/A'}</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #dc2626; margin-top: 0;">Desglose de Costos</h3>
                    ${quoteData.breakdown ? quoteData.breakdown.map(item => 
                        `<p><strong>${item.category}:</strong> ${item.cost}</p>`
                    ).join('') : '<p>No hay desglose de costos disponible.</p>'}
                    <hr style="border: 1px solid #dc2626; margin: 15px 0;">
                    <p style="font-size: 1.2em; font-weight: bold; color: #dc2626;">
                        <strong>Total Estimado:</strong> ${quoteData.total_cost || 'N/A'}
                    </p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>Nota:</strong> Esta cotización es válida por 30 días desde la fecha de emisión. 
                        Los precios están sujetos a cambios sin previo aviso.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p><strong>SUMPETROL - Construcción y Servicios Industriales</strong></p>
                    <p>Email: ventas@sumpetrol.com.ar | Teléfono: +54 9 261 7110120</p>
                    <p>Mendoza: Acceso Sur - Lateral Este 4585, Luján de Cuyo</p>
                    <p>Río Negro: Vicente Lazaretti 903 - Cipolletti</p>
                </div>
            </div>
        `;
        
        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cotización de Construcción - Sumpetrol</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                            @page { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        console.log('✅ PDF generado exitosamente');
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        alert('Error generando PDF. Intenta nuevamente.');
    }
}

/**
 * Genera HTML para email de cotización de construcción
 */
function generateConstructionEmailHTML(emailData) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cotización de Construcción - Sumpetrol</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .quote-summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .quote-item { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
            .quote-label { font-weight: 600; color: #374151; }
            .quote-value { color: #1f2937; font-weight: 700; }
            .cta-button { background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .contact-info { background: #e5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏗️ Cotización de Construcción Personalizada</h1>
                <p>Estimado/a ${emailData.nombre}</p>
            </div>
            
            <div class="content">
                <p>Gracias por confiar en Sumpetrol para tu proyecto de construcción. Hemos preparado una cotización personalizada basada en tus necesidades específicas.</p>
                
                <div class="quote-summary">
                    <h3>📊 Resumen de tu Proyecto</h3>
                    <div class="quote-item">
                        <span class="quote-label">Tipo de Construcción:</span>
                        <span class="quote-value">${emailData.tipo_construccion || 'N/A'}</span>
                    </div>
                    <div class="quote-item">
                        <span class="quote-label">Área Total:</span>
                        <span class="quote-value">${emailData.metros_cuadrados || 'N/A'} m²</span>
                    </div>
                    <div class="quote-item">
                        <span class="quote-label">Número de Pisos:</span>
                        <span class="quote-value">${emailData.pisos || 'N/A'}</span>
                    </div>
                    <div class="quote-item">
                        <span class="quote-label">Nivel de Terminación:</span>
                        <span class="quote-value">${emailData.nivel_terminacion || 'N/A'}</span>
                    </div>
                    <div class="quote-item">
                        <span class="quote-label">Ubicación:</span>
                        <span class="quote-value">${emailData.provincia || 'N/A'}</span>
                    </div>
                    <div class="quote-item">
                        <span class="quote-label">Tiempo Estimado:</span>
                        <span class="quote-value">${emailData.tiempo_estimado || 'N/A'}</span>
                    </div>
                    <div class="quote-item">
                        <span class="quote-label">Inversión Total:</span>
                        <span class="quote-value">${emailData.total_estimado || 'N/A'}</span>
                    </div>
                </div>
                
                <p>Esta cotización es válida por 30 días y incluye:</p>
                <ul>
                    <li>✅ Estructura básica de alta calidad</li>
                    <li>✅ Materiales certificados</li>
                    <li>✅ Mano de obra especializada</li>
                    <li>✅ Instalaciones completas</li>
                    <li>✅ Garantía extendida</li>
                    <li>✅ Supervisión profesional</li>
                </ul>
                
                <div class="contact-info">
                    <h4>📞 ¿Tienes preguntas?</h4>
                    <p>Nuestro equipo de expertos está listo para ayudarte:</p>
                    <p><strong>Teléfono:</strong> +54 9 261 7110120</p>
                    <p><strong>Email:</strong> ventas@sumpetrol.com.ar</p>
                    <p><strong>WhatsApp:</strong> Disponible 24/7</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://sumpetrol.com.ar" class="cta-button">Ver más información</a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Sumpetrol Argentina</strong></p>
                <p>Acceso Sur - Lateral Este 4585, Luján de Cuyo, Mendoza</p>
                <p>Vicente Lazaretti 903 - Cipolletti, Río Negro</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Funciones globales para modales
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function downloadQuickEstimatePDF() {
    if (window.constructionCalculator && window.constructionCalculator.currentEstimation) {
        // Generar PDF de estimación rápida usando jsPDF
        const estimation = window.constructionCalculator.currentEstimation;
        
        // Crear contenido HTML para el PDF
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #f97316; text-align: center;">SUMPETROL</h1>
                <h2 style="text-align: center;">Estimación Rápida de Construcción</h2>
                
                <div style="margin: 20px 0;">
                    <h3>Información del Proyecto:</h3>
                    <p><strong>Área:</strong> ${estimation.area || 'N/A'}</p>
                    <p><strong>Tipo de Construcción:</strong> ${estimation.construction_type || 'N/A'}</p>
                    <p><strong>Ubicación:</strong> ${estimation.location || 'N/A'}</p>
                    <p><strong>Tipo de Uso:</strong> ${estimation.usage_type || 'N/A'}</p>
                    <p><strong>Nivel de Terminación:</strong> ${estimation.finish_level || 'N/A'}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Estimación de Costos:</h3>
                    <p><strong>Costo Estimado:</strong> ${estimation.estimated_cost || 'N/A'}</p>
                    <p><strong>Tiempo Estimado:</strong> ${estimation.estimated_time || 'N/A'}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Información Adicional:</h3>
                    <p><strong>Precio Base por m²:</strong> ${estimation.base_price_per_m2 || 'N/A'}</p>
                    <p><strong>Multiplicador de Ubicación:</strong> ${estimation.location_multiplier || 'N/A'}</p>
                    <p><strong>Multiplicador de Pisos:</strong> ${estimation.floor_multiplier || 'N/A'}</p>
                </div>
                
                <div style="margin: 20px 0; text-align: center;">
                    <p><strong>Esta es una estimación rápida basada en parámetros estándar.</strong></p>
                    <p>Para una cotización detallada con materiales específicos, contacta con nuestro equipo.</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4>📞 ¿Tienes preguntas?</h4>
                    <p><strong>Teléfono:</strong> +54 9 261 7110120</p>
                    <p><strong>Email:</strong> ventas@sumpetrol.com.ar</p>
                    <p><strong>WhatsApp:</strong> Disponible 24/7</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p><strong>Sumpetrol Argentina</strong></p>
                    <p>Acceso Sur - Lateral Este 4585, Luján de Cuyo, Mendoza</p>
                    <p>Vicente Lazaretti 903 - Cipolletti, Río Negro</p>
                </div>
            </div>
        `;
        
        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Estimación de Construcción - Sumpetrol</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                            @page { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>${htmlContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        console.log('✅ PDF de estimación rápida generado exitosamente');
    }
}

function downloadDetailedQuotePDF() {
    if (window.constructionCalculator && window.constructionCalculator.currentQuote) {
        // Generar PDF de cotización detallada usando jsPDF
        const quote = window.constructionCalculator.currentQuote;
        
        // Crear contenido HTML para el PDF
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #f97316; text-align: center;">SUMPETROL</h1>
                <h2 style="text-align: center;">Cotización Detallada de Construcción</h2>
                
                <div style="margin: 20px 0;">
                    <h3>Información del Cliente:</h3>
                    <p><strong>Cliente:</strong> ${quote.client_name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${quote.client_email || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${quote.client_phone || 'N/A'}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Información del Proyecto:</h3>
                    <p><strong>Área:</strong> ${quote.area || 'N/A'}</p>
                    <p><strong>Tipo de Construcción:</strong> ${quote.construction_type || 'N/A'}</p>
                    <p><strong>Pisos:</strong> ${quote.floors || 'N/A'}</p>
                    <p><strong>Ubicación:</strong> ${quote.location || 'N/A'}</p>
                    <p><strong>Tipo de Uso:</strong> ${quote.usage_type || 'N/A'}</p>
                    <p><strong>Nivel de Terminación:</strong> ${quote.finish_level || 'N/A'}</p>
                    <p><strong>Tiempo Estimado:</strong> ${quote.estimated_time || 'N/A'}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Desglose de Costos:</h3>
                    ${quote.breakdown ? quote.breakdown.map(item => `
                        <p><strong>${item.category || 'Categoría'}:</strong> ${item.cost || 'N/A'}</p>
                    `).join('') : '<p>No hay desglose disponible</p>'}
                    <p style="font-size: 18px; font-weight: bold; margin-top: 15px;">
                        <strong>Total Estimado: ${quote.total_cost || 'N/A'}</strong>
                    </p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Información Adicional:</h3>
                    <p><strong>Costo Base:</strong> ${quote.base_cost || 'N/A'}</p>
                    <p><strong>Costos Adicionales:</strong> ${quote.additional_costs || 'N/A'}</p>
                    <p><strong>Fecha de Cotización:</strong> ${quote.quote_date || 'N/A'}</p>
                    <p><strong>Válida hasta:</strong> ${quote.valid_until || 'N/A'}</p>
                </div>
                
                <div style="margin: 20px 0; text-align: center;">
                    <p><strong>Esta cotización es válida por 30 días a partir de la fecha de emisión.</strong></p>
                    <p>Para proceder con el proyecto, contacta con nuestro equipo de ventas.</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4>📞 ¿Tienes preguntas?</h4>
                    <p><strong>Teléfono:</strong> +54 9 261 7110120</p>
                    <p><strong>Email:</strong> ventas@sumpetrol.com.ar</p>
                    <p><strong>WhatsApp:</strong> Disponible 24/7</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p><strong>Sumpetrol Argentina</strong></p>
                    <p>Acceso Sur - Lateral Este 4585, Luján de Cuyo, Mendoza</p>
                    <p>Vicente Lazaretti 903 - Cipolletti, Río Negro</p>
                </div>
            </div>
        `;
        
        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cotización de Construcción - Sumpetrol</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                            @page { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>${htmlContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        console.log('✅ PDF de cotización detallada generado exitosamente');
    }
}

function requestDetailedQuote() {
    if (window.constructionCalculator) {
        window.constructionCalculator.requestDetailedQuote();
    }
}

function requestPersonalizedQuote() {
    if (window.constructionCalculator && window.constructionCalculator.currentQuote) {
        const quote = window.constructionCalculator.currentQuote;
        const message = `Hola! Me interesa solicitar una cotización personalizada para mi proyecto de construcción. Aquí están los detalles:

📋 Información del Proyecto:
• Área: ${quote.area || 'N/A'}
• Tipo: ${quote.construction_type || 'N/A'}
• Pisos: ${quote.floors || 'N/A'}
• Ubicación: ${quote.location || 'N/A'}
• Tipo de Uso: ${quote.usage_type || 'N/A'}
• Nivel de Terminación: ${quote.finish_level || 'N/A'}

💰 Costo Estimado: ${quote.total_cost || 'N/A'}

Por favor, contactame para coordinar una reunión y discutir los detalles específicos del proyecto.

¡Gracias!`;

        const whatsappUrl = `https://wa.me/5492617110120?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
}
