/**
 * Скрипт для страницы товаров и движений
 */
let products = [];
let deliverySchedule = [];
let receiptOrders = [];
let providers = [];
let shipments = [];
let productStock = {};

document.addEventListener('DOMContentLoaded', () => {
    if (!authService.isAuthenticated()) {
        authService.redirectToLogin();
        return;
    }
    
    const userRole = authService.getUserRole();
    if (userRole !== 'operator') {
        authService.redirectToRoleSelect();
        return;
    }

    updateUserInfo();
    loadAllData();
    setupEventListeners();
    setupTabs();
    
    initNavbarBrandClick();
    initThemeToggle();

    document.getElementById('logoutBtn').addEventListener('click', () => {
        authService.logout();
        authService.redirectToLogin();
    });
});

function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const userInfo = authService.getUserInfo();
        userNameElement.textContent = userInfo?.name || 'Оператор';
    }
}

async function loadAllData() {
    try {
        await Promise.all([
            loadProviders(),
            loadProducts(),
            loadShipments(),
            loadReceiptOrders()
        ]);
        calculateStock();
        renderProductsTable(products);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

async function loadProviders() {
    try {
        providers = await api.getProviders();
        window.providers = providers;
    } catch (error) {
        console.error('Ошибка загрузки поставщиков:', error);
    }
}

async function loadShipments() {
    try {
        shipments = await api.getShipments();
    } catch (error) {
        console.error('Ошибка загрузки отгрузок:', error);
        shipments = [];
    }
}

function calculateStock() {
    productStock = {};
    
    products.forEach(product => {
        productStock[product.id] = 0;
    });
    
    receiptOrders.forEach(order => {
        const productInfo = order.productInfo || [];
        productInfo.forEach(item => {
            const productId = item.product?.id || item.product;
            const count = item.count || 0;
            if (productStock[productId] !== undefined) {
                productStock[productId] += count;
            }
        });
    });
    
    shipments.forEach(shipment => {
        if (shipment.status === 1) {
            const productInfo = shipment.productInfo || [];
            productInfo.forEach(item => {
                const productId = item.product?.id || item.product;
                const count = item.count || 0;
                if (productStock[productId] !== undefined) {
                    productStock[productId] -= count;
                }
            });
        }
    });
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            if (tabId === 'schedule') {
                loadDeliverySchedule();
            } else if (tabId === 'receipts') {
                renderReceiptsTable();
            }
        });
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterProducts();
        }, 300));
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            filterProducts();
        });
    }
    
    const scheduleSearchInput = document.getElementById('scheduleSearchInput');
    const scheduleFilterSelect = document.getElementById('scheduleFilterSelect');
    
    if (scheduleSearchInput) {
        scheduleSearchInput.addEventListener('input', debounce(() => {
            filterSchedule();
        }, 300));
    }

    if (scheduleFilterSelect) {
        scheduleFilterSelect.addEventListener('change', () => {
            filterSchedule();
        });
    }
}

function filterProducts() {
    const search = document.getElementById('searchInput')?.value || '';
    const filter = document.getElementById('filterSelect')?.value || 'all';
    
    let filtered = [...products];
    
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (filter === 'critical') {
        filtered = filtered.filter(p => {
            const stock = productStock[p.id] || 0;
            return stock < p.criticalBalance;
        });
    } else if (filter === 'in-stock') {
        filtered = filtered.filter(p => (productStock[p.id] || 0) > 0);
    } else if (filter === 'out-of-stock') {
        filtered = filtered.filter(p => (productStock[p.id] || 0) === 0);
    }
    
    renderProductsTable(filtered);
}

async function loadProducts() {
    try {
        products = await api.getProducts();
        window.products = products;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.getElementById('productsTableBody').innerHTML = 
            '<tr><td colspan="4" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderProductsTable(productsToShow) {
    const tbody = document.getElementById('productsTableBody');
    
    if (!productsToShow || !productsToShow.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = productsToShow.map(product => {
        const stock = productStock[product.id] || 0;
        const isCritical = stock < product.criticalBalance;
        const unitName = product.unit?.name || 'шт.';
        
        return `
            <tr class="${isCritical ? 'critical' : ''}">
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td><span class="stock-badge">${stock} ${unitName}</span></td>
                <td>
                    <span class="status-badge ${isCritical ? 'status-warning' : 'status-normal'}">
                        ${isCritical ? '⚠️ Критический' : '✅ Норма'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadDeliverySchedule() {
    try {
        deliverySchedule = await api.getDeliverySchedule();
        filterSchedule();
        updateReceiptButton();
    } catch (error) {
        console.error('Ошибка загрузки графика:', error);
        document.getElementById('scheduleTableBody').innerHTML = 
            '<tr><td colspan="6" class="error">Ошибка загрузки</td></tr>';
    }
}

function getScheduleStatus(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(dateStr);
    scheduleDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((scheduleDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { class: 'status-overdue', icon: '🔴', text: 'Просрочка', key: 'overdue' };
    if (diffDays === 0) return { class: 'status-today', icon: '🟡', text: 'Сегодня', key: 'today' };
    if (diffDays <= 7) return { class: 'status-upcoming', icon: '🟢', text: 'Ожидается', key: 'upcoming' };
    return { class: 'status-future', icon: '⚪', text: 'Запланировано', key: 'future' };
}

function filterSchedule() {
    const search = document.getElementById('scheduleSearchInput')?.value || '';
    const filter = document.getElementById('scheduleFilterSelect')?.value || 'all';
    
    let filtered = [...deliverySchedule];
    
    if (search) {
        filtered = filtered.filter(entry => 
            entry.product?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (filter !== 'all') {
        if (filter === 'received') {
            filtered = filtered.filter(entry => 
                entry.relatedReceipt !== null && entry.relatedReceipt !== undefined
            );
        } else {
            filtered = filtered.filter(entry => {
                const status = getScheduleStatus(entry.date);
                return status.key === filter;
            });
        }
    }
    
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderScheduleTable(filtered);
}

function renderScheduleTable(scheduleData) {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    if (!scheduleData.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Нет данных</td></tr>';
        return;
    }
    
    tbody.innerHTML = scheduleData.map(entry => {
        const status = getScheduleStatus(entry.date);
        const isReceived = entry.relatedReceipt !== null && entry.relatedReceipt !== undefined;
        const unitName = entry.product?.unit?.name || 'шт.';
        const quantityWithUnit = `${entry.count} ${unitName}`;
        
        return `
            <tr class="schedule-row ${isReceived ? 'received' : ''}" data-id="${entry.id}">
                <td>
                    <input type="checkbox" class="schedule-select" value="${entry.id}" 
                           ${isReceived ? 'disabled' : ''} onchange="updateReceiptButton()">
                </td>
                <td>${new Date(entry.date).toLocaleDateString('ru-RU')}</td>
                <td>${entry.product?.name || 'Товар #' + entry.product}</td>
                <td>${quantityWithUnit}</td>
                <td>
                    <a href="#" class="contract-link" onclick="viewContract(${entry.contract}); return false;">
                        #${entry.contract}
                    </a>
                </td>
                <td>
                    <span class="status-badge ${status.class}">
                        ${isReceived ? '✅ Поступило' : status.icon + ' ' + status.text}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function updateReceiptButton() {
    const receiptButton = document.getElementById('receiptButton');
    if (!receiptButton) return;
    
    const checkboxes = document.querySelectorAll('.schedule-select:checked:not(:disabled)');
    const selectedCount = checkboxes.length;
    
    if (selectedCount > 0) {
        receiptButton.innerHTML = `📥 Поступление (${selectedCount})`;
        receiptButton.style.display = 'flex';
        receiptButton.disabled = false;
    } else {
        receiptButton.style.display = 'none';
        receiptButton.disabled = true;
    }
}

async function loadReceiptOrders() {
    try {
        receiptOrders = await api.getReceiptOrders();
        renderReceiptsTable();
    } catch (error) {
        console.error('Ошибка загрузки ордеров:', error);
        document.getElementById('receiptsTableBody').innerHTML = 
            '<tr><td colspan="5" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderReceiptsTable() {
    const tbody = document.getElementById('receiptsTableBody');
    if (!tbody) return;
    
    if (!receiptOrders || receiptOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = receiptOrders.map(order => {
        const productList = order.productInfo || [];
        const productCount = productList.length;
        
        const productNames = productList.map(info => {
            const productName = info.product?.name || `Товар #${info.product}`;
            const unitName = info.product?.unit?.name || 'шт.';
            return `${productName} (${info.count} ${unitName})`;
        });
        
        const maxVisible = 3;
        const visibleProducts = productNames.slice(0, maxVisible);
        const hiddenCount = productCount - maxVisible;
        
        let productsHtml = visibleProducts.map(name => 
            `<span class="product-tag">${name}</span>`
        ).join('');
        
        if (hiddenCount > 0) {
            productsHtml += `<span class="product-more">+${hiddenCount} ещё</span>`;
        }
        
        const tooltip = productNames.join('\n');
        
        let providerName = 'Не указан';
        if (order.provider) {
            if (typeof order.provider === 'object' && order.provider.name) {
                providerName = order.provider.name;
            } else if (typeof order.provider === 'number') {
                const provider = providers.find(p => p.id === order.provider);
                providerName = provider ? provider.name : `Поставщик #${order.provider}`;
            }
        }
        const timeStr = order.time ? new Date(order.time).toLocaleString('ru-RU') : '—';

        return `
            <tr>
                <td>${order.id}</td>
                <td>${timeStr}</td>
                <td>${providerName}</td>
                <td>
                    <div class="products-list" title="${tooltip}">
                        ${productsHtml}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="viewReceiptOrder(${order.id})">👁️</button>
                        <button class="btn-icon btn-print" onclick="printReceiptOrder(${order.id})">🖨️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewContract(contractId) {
    try {
        const contract = await api.getContract(contractId);
        showContractModal(contract);
    } catch (error) {
        showNotification('Ошибка загрузки договора: ' + error.message, 'error');
    }
}

function showContractModal(contract) {
    const productRows = (contract.productInfo || []).map(info => {
        const productName = info.product?.name || `Товар #${info.product}`;
        const unitName = info.product?.unit?.name || 'шт.';
        const total = (info.count * info.price).toFixed(2);
        return `
            <tr>
                <td>${productName}</td>
                <td>${info.count} ${unitName}</td>
                <td>${info.price.toFixed(2)}</td>
                <td>${total}</td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="4" style="text-align: center;">Нет товаров</td></tr>';

    const totalSum = (contract.productInfo || []).reduce((sum, info) => sum + (info.count * info.price), 0).toFixed(2);
    const providerName = contract.provider?.name || `Поставщик #${contract.provider}`;
    const statusName = CONFIG.CONTRACT_STATUSES[contract.status]?.name || 'Неизвестно';

    const modalContent = {
        title: `Договор №${contract.id}`,
        body: `
            <div class="contract-details">
                <p><strong>Поставщик:</strong> ${providerName}</p>
                <p><strong>Статус:</strong> 
                    <span class="status-badge status-${CONFIG.CONTRACT_STATUSES[contract.status]?.class || 'created'}">
                        ${statusName}
                    </span>
                </p>
                
                <h4>Товары в договоре:</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Товар</th>
                            <th>Количество</th>
                            <th>Цена</th>
                            <th>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>Итого:</strong></td>
                            <td><strong>${totalSum}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Закрыть</button>
                    <button type="button" class="btn btn-primary" onclick="printContract(${contract.id}); modal.hide();">
                        🖨️ Печать
                    </button>
                </div>
            </div>
        `
    };

    modal.show(modalContent);
}

async function printContract(contractId) {
    try {
        const contract = await api.getContract(contractId);
        const providerName = contract.provider?.name || `Поставщик #${contract.provider}`;
        const statusName = CONFIG.CONTRACT_STATUSES[contract.status]?.name || 'Неизвестно';
        
        const productRows = (contract.productInfo || []).map(info => {
            const productName = info.product?.name || `Товар #${info.product}`;
            const unitName = info.product?.unit?.name || 'шт.';
            const total = (info.count * info.price).toFixed(2);
            return `
                <tr>
                    <td>${productName}</td>
                    <td>${info.count} ${unitName}</td>
                    <td>${info.price.toFixed(2)} руб.</td>
                    <td>${total} руб.</td>
                </tr>
            `;
        }).join('');

        const totalSum = (contract.productInfo || []).reduce((sum, info) => sum + (info.count * info.price), 0).toFixed(2);
        const currentDate = new Date().toLocaleDateString('ru-RU');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Договор №${contractId}</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; padding: 30px; }
                        h1 { color: #333; text-align: center; margin-bottom: 10px; }
                        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
                        .info { margin-bottom: 25px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                        .info p { margin: 8px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #333; color: white; padding: 12px; text-align: left; }
                        td { padding: 10px; border-bottom: 1px solid #ddd; }
                        tfoot td { border-top: 2px solid #333; font-weight: bold; }
                        .footer { margin-top: 40px; text-align: right; font-style: italic; color: #666; }
                        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
                        .signature-item { text-align: center; }
                        .signature-line { width: 200px; border-top: 1px solid #333; margin: 5px 0; }
                        @media print {
                            body { padding: 10px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>ДОГОВОР ПОСТАВКИ №${contractId}</h1>
                    <div class="subtitle">от ${currentDate}</div>
                    
                    <div class="info">
                        <p><strong>Поставщик:</strong> ${providerName}</p>
                        <p><strong>Статус договора:</strong> ${statusName}</p>
                    </div>
                    
                    <h3>Спецификация товаров:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Наименование товара</th>
                                <th>Количество</th>
                                <th>Цена за единицу</th>
                                <th>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productRows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="text-align: right;"><strong>ИТОГО:</strong></td>
                                <td><strong>${totalSum} руб.</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="signature">
                        <div class="signature-item">
                            <div>Поставщик</div>
                            <div class="signature-line"></div>
                            <div>_____________ / ${providerName} /</div>
                            <div style="font-size: 12px; color: #666;">(должность) (подпись) (расшифровка)</div>
                        </div>
                        <div class="signature-item">
                            <div>Покупатель</div>
                            <div class="signature-line"></div>
                            <div>_____________ / Aboba Warehouse /</div>
                            <div style="font-size: 12px; color: #666;">(должность) (подпись) (расшифровка)</div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Документ сформирован: ${new Date().toLocaleString('ru-RU')}</p>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
                            🖨️ Печать
                        </button>
                        <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">
                            Закрыть
                        </button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        showNotification('Ошибка при подготовке печати: ' + error.message, 'error');
    }
}

async function viewReceiptOrder(id) {
    try {
        const order = await api.getReceiptOrder(id);
        showReceiptModal(order);
    } catch (error) {
        showNotification('Ошибка загрузки ордера: ' + error.message, 'error');
    }
}

function showReceiptModal(order) {
    let providerName = 'Не указан';
    if (order.provider) {
        if (typeof order.provider === 'object' && order.provider.name) {
            providerName = order.provider.name;
        } else if (typeof order.provider === 'number') {
            const provider = providers.find(p => p.id === order.provider);
            providerName = provider ? provider.name : `Поставщик #${order.provider}`;
        }
    }
    
    const productRows = (order.productInfo || []).map(info => {
        const productName = info.product?.name || `Товар #${info.product?.id || info.product}`;
        const unitName = info.product?.unit?.name || 'шт.';
        
        return `
            <tr>
                <td>${productName}</td>
                <td>${info.count} ${unitName}</td>
                <td>
                    <a href="#" class="contract-link" onclick="viewContract(${info.contract}); return false;">
                        #${info.contract}
                    </a>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="3" style="text-align: center;">Нет товаров</td></tr>';

    const modalContent = {
        title: `Приходный ордер №${order.id}`,
        body: `
            <div class="contract-details">
                <p><strong>Поставщик:</strong> ${providerName}</p>
                <p><strong>Время поставки:</strong> ${order.time ? new Date(order.time).toLocaleString('ru-RU') : '—'}</p>
                
                <h4>Товары в ордере:</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Товар</th>
                            <th>Количество</th>
                            <th>Договор</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                </table>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Закрыть</button>
                    <button type="button" class="btn btn-primary" onclick="printReceiptOrder(${order.id}); modal.hide();">
                        🖨️ Печать
                    </button>
                </div>
            </div>
        `
    };

    modal.show(modalContent);
}

async function printReceiptOrder(orderId) {
    try {
        const order = await api.getReceiptOrder(orderId);
        
        let providerName = 'Не указан';
        if (order.provider) {
            if (typeof order.provider === 'object' && order.provider.name) {
                providerName = order.provider.name;
            } else if (typeof order.provider === 'number') {
                const provider = providers.find(p => p.id === order.provider);
                providerName = provider ? provider.name : `Поставщик #${order.provider}`;
            }
        }

        const timeStr = order.time ? new Date(order.time).toLocaleString('ru-RU') : '—';
        const currentDate = new Date().toLocaleDateString('ru-RU');
        const operatorName = document.getElementById('userName').textContent;
        
        const productRows = (order.productInfo || []).map((info, index) => {
            const productName = info.product?.name || `Товар #${info.product?.id || info.product}`;
            const unitName = info.product?.unit?.name || 'шт.';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${productName}</td>
                    <td>${info.count} ${unitName}</td>
                    <td>Договор №${info.contract}</td>
                </tr>
            `;
        }).join('');

        const totalItems = (order.productInfo || []).length;
        const totalQuantity = (order.productInfo || []).reduce((sum, info) => sum + info.count, 0);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Приходный ордер №${orderId}</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; padding: 30px; }
                        h1 { color: #333; text-align: center; margin-bottom: 5px; }
                        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
                        .info { margin-bottom: 25px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                        .info-row { display: flex; margin-bottom: 8px; }
                        .info-label { width: 150px; font-weight: bold; }
                        .info-value { flex: 1; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #333; color: white; padding: 12px; text-align: left; }
                        td { padding: 10px; border-bottom: 1px solid #ddd; }
                        .summary { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
                        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
                        .signature-item { text-align: center; width: 45%; }
                        .signature-line { border-top: 1px solid #333; margin: 10px 0 5px; }
                        .signature-text { font-size: 12px; color: #666; margin-top: 5px; }
                        @media print {
                            body { padding: 10px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>ПРИХОДНЫЙ ОРДЕР №${orderId}</h1>
                    <div class="subtitle">от ${currentDate}</div>
                    
                    <div class="info">
                        <div class="info-row">
                            <div class="info-label">Поставщик:</div>
                            <div class="info-value">${providerName}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Склад получатель:</div>
                            <div class="info-value">Aboba Warehouse (основной склад)</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Дата и время поставки:</div>
                            <div class="info-value">${timeStr}</div>
                        </div>
                    </div>
                    
                    <h3>Принятые товары:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>№ п/п</th>
                                <th>Наименование товара</th>
                                <th>Количество</th>
                                <th>Основание</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productRows}
                        </tbody>
                    </table>
                    
                    <div class="summary">
                        <p><strong>Всего позиций:</strong> ${totalItems}</p>
                        <p><strong>Общее количество товаров:</strong> ${totalQuantity} единиц</p>
                    </div>
                    
                    <div class="signature">
                        <div class="signature-item">
                            <div><strong>ПРИНЯЛ</strong></div>
                            <div class="signature-line"></div>
                            <div>_______________ / ${operatorName} /</div>
                            <div class="signature-text">(должность) (подпись) (расшифровка подписи)</div>
                            <div style="margin-top: 5px; font-size: 12px;">Кладовщик</div>
                        </div>
                        <div class="signature-item">
                            <div><strong>СДАЛ</strong></div>
                            <div class="signature-line"></div>
                            <div>_______________ / ${providerName} /</div>
                            <div class="signature-text">(должность) (подпись) (расшифровка подписи)</div>
                            <div style="margin-top: 5px; font-size: 12px;">Представитель поставщика</div>
                        </div>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 40px;">
                        <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
                            🖨️ Печать
                        </button>
                        <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">
                            Закрыть
                        </button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        showNotification('Ошибка при подготовке печати: ' + error.message, 'error');
    }
}

function openReceiptModal() {
    const checkboxes = document.querySelectorAll('.schedule-select:checked:not(:disabled)');
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) {
        showNotification('Выберите хотя бы одну поставку', 'error');
        return;
    }
    
    const selectedEntries = deliverySchedule.filter(entry => 
        selectedIds.includes(entry.id) && 
        (entry.relatedReceipt === null || entry.relatedReceipt === undefined)
    );
    
    if (selectedEntries.length === 0) {
        showNotification('Выбранные поставки уже поступили', 'warning');
        return;
    }
    
    const groupedByProduct = {};
    selectedEntries.forEach(entry => {
        const productId = entry.product?.id || entry.product;
        const productName = entry.product?.name || `Товар #${productId}`;
        const unitName = entry.product?.unit?.name || 'шт.';
        
        if (!groupedByProduct[productId]) {
            groupedByProduct[productId] = {
                productId,
                productName,
                unitName,
                entries: []
            };
        }
        
        groupedByProduct[productId].entries.push({
            id: entry.id,
            date: entry.date,
            plannedCount: entry.count,
            contract: entry.contract
        });
    });
    
    const productRows = Object.values(groupedByProduct).map(item => {
        return `
            <div class="receipt-product-row">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                    <h4 style="margin: 0;">📦 ${item.productName}</h4>
                    <span style="color: var(--text-secondary); font-size: 13px;">Ед. изм.: ${item.unitName}</span>
                </div>
                
                ${item.entries.map((entry) => `
                    <div class="receipt-entry-row">
                        <div class="form-group">
                            <label>Поставка #${entry.id}</label>
                            <div style="color: var(--text-secondary); font-size: 13px;">
                                📅 ${new Date(entry.date).toLocaleDateString('ru-RU')}
                            </div>
                            <input type="hidden" class="entry-id" value="${entry.id}">
                            <input type="hidden" class="entry-contract" value="${entry.contract}">
                        </div>
                        <div class="form-group">
                            <label>Плановое количество</label>
                            <input type="text" value="${entry.plannedCount} ${item.unitName}" disabled>
                        </div>
                        <div class="form-group">
                            <label>Фактическое количество *</label>
                            <input type="number" class="actual-count" min="0" value="${entry.plannedCount}" required>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
    
    const modalContent = {
        title: '📥 Оформление поступления',
        body: `
            <form id="receiptForm">
                <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 5px; border-left: 4px solid var(--success-color);">
                    <p style="margin: 0;">
                        ℹ️ Выбрано поставок: <strong>${selectedEntries.length}</strong> | 
                        Товаров: <strong>${Object.keys(groupedByProduct).length}</strong>
                    </p>
                </div>
                
                <div id="receiptProductsContainer">
                    ${productRows}
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                    <button type="submit" class="btn btn-success">✅ Подтвердить поступление</button>
                </div>
            </form>
        `
    };
    
    modal.show(modalContent);
    document.getElementById('receiptForm').addEventListener('submit', handleReceiptSubmit);
}

async function handleReceiptSubmit(e) {
    e.preventDefault();
    
    const receiptItems = document.querySelectorAll('.receipt-entry-row');
    const receiptData = [];
    
    for (const item of receiptItems) {
        const entryIdInput = item.querySelector('.entry-id');
        const actualCountInput = item.querySelector('.actual-count');
        
        if (!entryIdInput?.value || !actualCountInput?.value) continue;
        
        const actualCount = parseInt(actualCountInput.value);
        if (actualCount < 0) {
            showNotification('Количество не может быть отрицательным', 'error');
            return;
        }
        
        receiptData.push({
            scheduledDelivery: parseInt(entryIdInput.value),
            count: actualCount
        });
    }
    
    if (receiptData.length === 0) {
        showNotification('Нет позиций для оформления', 'error');
        return;
    }
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Обработка...';
        }
        
        await api.createReceiptOrder(receiptData);
        modal.hide();
        
        await loadReceiptOrders();
        await loadDeliverySchedule();
        await loadShipments();
        calculateStock();
        renderProductsTable(products);
        
        showNotification('Поступление оформлено!', 'success');
    } catch (error) {
        console.error('Create receipt error:', error);
        showNotification(error.message || 'Ошибка при оформлении поступления', 'error');
    }
}

// ==================== Расход товара ====================
async function openOutcomeModal() {
    if (!products.length) {
        await loadProducts();
    }
    
    const availableProducts = products.filter(p => (productStock[p.id] || 0) > 0);
    
    if (availableProducts.length === 0) {
        showNotification('Нет товаров в наличии для расхода', 'warning');
        return;
    }

    const productOptions = availableProducts.map(product => {
        const stock = productStock[product.id] || 0;
        const unitName = product.unit?.name || 'шт.';
        return `<option value="${product.id}" data-name="${product.name}" data-stock="${stock}" data-unit="${unitName}">${product.name} (В наличии: ${stock} ${unitName})</option>`;
    }).join('');

    const modalContent = {
        title: '📤 Расход товара',
        body: `
            <form id="outcomeForm">
                <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 5px; border-left: 4px solid var(--danger-color);">
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                        ⚠️ Внимание! Будет зафиксирован расход товара со склада.
                    </p>
                </div>
                <div id="outcomeItemsContainer"></div>
                <button type="button" class="btn btn-secondary" onclick="addOutcomeItem()" style="margin-top: 10px; width: 100%;">➕ Добавить товар</button>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                    <button type="submit" class="btn btn-danger">📤 Подтвердить расход</button>
                </div>
            </form>
        `
    };
    
    modal.show(modalContent);
    window.outcomeItemCounter = 0;
    window.availableProductOptions = productOptions;
    addOutcomeItem();
    document.getElementById('outcomeForm').addEventListener('submit', handleOutcomeSubmit);
}

function addOutcomeItem() {
    const container = document.getElementById('outcomeItemsContainer');
    if (!container) return;
    
    const itemId = `outcome_item_${window.outcomeItemCounter++}`;

    const itemHtml = `
        <div class="outcome-item" id="${itemId}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <strong style="color: var(--text-primary);">Товар #${window.outcomeItemCounter}</strong>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeOutcomeItem('${itemId}')">🗑️ Удалить</button>
            </div>
            <div class="form-row" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group">
                    <label>Товар *</label>
                    <select class="outcome-product" required onchange="onOutcomeProductSelect('${itemId}')">
                        <option value="">Выберите товар</option>
                        ${window.availableProductOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Количество *</label>
                    <input type="number" class="outcome-count" min="1" value="1" required>
                    <div class="stock-warning" style="color: var(--danger-color); font-size: 12px; margin-top: 5px; display: none;"></div>
                </div>
            </div>
            <input type="hidden" class="product-id" value="">
            <input type="hidden" class="product-name" value="">
            <input type="hidden" class="product-stock" value="0">
            <input type="hidden" class="product-unit" value="">
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHtml);
}

function onOutcomeProductSelect(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return;
    
    const productSelect = item.querySelector('.outcome-product');
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const countInput = item.querySelector('.outcome-count');
    const stockWarning = item.querySelector('.stock-warning');
    const productIdInput = item.querySelector('.product-id');
    const productNameInput = item.querySelector('.product-name');
    const productStockInput = item.querySelector('.product-stock');
    const productUnitInput = item.querySelector('.product-unit');
    
    if (!selectedOption || !selectedOption.value) {
        productIdInput.value = '';
        productNameInput.value = '';
        productStockInput.value = '0';
        productUnitInput.value = '';
        countInput.placeholder = 'Выберите товар';
        countInput.max = 1;
        stockWarning.style.display = 'none';
        return;
    }
    
    const stock = parseInt(selectedOption.dataset.stock || '0');
    const unit = selectedOption.dataset.unit || 'шт.';
    const productName = selectedOption.dataset.name || 'Товар';
    
    productIdInput.value = selectedOption.value;
    productNameInput.value = productName;
    productStockInput.value = stock;
    productUnitInput.value = unit;
    
    countInput.placeholder = `Доступно: ${stock} ${unit}`;
    countInput.max = stock;
    countInput.value = Math.min(1, stock);
    
    checkOutcomeCount(countInput, stock, unit, stockWarning);
    
    countInput.oninput = () => {
        checkOutcomeCount(countInput, stock, unit, stockWarning);
    };
}

function checkOutcomeCount(countInput, stock, unit, stockWarning) {
    const count = parseInt(countInput.value || '0');
    if (count > stock) {
        stockWarning.style.display = 'block';
        stockWarning.textContent = `⚠️ Недостаточно товара! Доступно: ${stock} ${unit}`;
        countInput.style.borderColor = 'var(--danger-color)';
        return false;
    } else if (count <= 0) {
        stockWarning.style.display = 'block';
        stockWarning.textContent = `⚠️ Количество должно быть больше 0`;
        countInput.style.borderColor = 'var(--danger-color)';
        return false;
    } else {
        stockWarning.style.display = 'none';
        countInput.style.borderColor = '';
        return true;
    }
}

function removeOutcomeItem(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

async function handleOutcomeSubmit(e) {
    e.preventDefault();
    
    const outcomeItems = document.querySelectorAll('.outcome-item');
    if (outcomeItems.length === 0) {
        showNotification('Добавьте хотя бы один товар для расхода', 'error');
        return;
    }
    
    const shipmentData = [];
    let hasError = false;
    const usedProducts = new Set();
    
    for (const item of outcomeItems) {
        const productIdInput = item.querySelector('.product-id');
        const productNameInput = item.querySelector('.product-name');
        const countInput = item.querySelector('.outcome-count');
        const productStockInput = item.querySelector('.product-stock');
        const productUnitInput = item.querySelector('.product-unit');
        
        if (!productIdInput?.value) {
            showNotification('Выберите товар во всех позициях', 'error');
            hasError = true;
            break;
        }
        
        const productId = parseInt(productIdInput.value);
        const productName = productNameInput?.value || 'Товар';
        const count = parseInt(countInput?.value || '0');
        const stock = parseInt(productStockInput?.value || '0');
        const unit = productUnitInput?.value || 'шт.';
        
        if (usedProducts.has(productId)) {
            showNotification(`Товар "${productName}" выбран несколько раз. Объедините в одну позицию.`, 'error');
            hasError = true;
            break;
        }
        usedProducts.add(productId);
        
        if (!count || count <= 0) {
            showNotification(`Укажите корректное количество для товара "${productName}"`, 'error');
            hasError = true;
            break;
        }
        
        if (count > stock) {
            showNotification(`Недостаточно товара "${productName}". Доступно: ${stock} ${unit}`, 'error');
            hasError = true;
            break;
        }
        
        shipmentData.push({
            product: productId,
            count: count,
            price: 0
        });
    }
    
    if (hasError || shipmentData.length === 0) {
        return;
    }
    
    const confirmMessage = shipmentData.map(item => {
        const product = products.find(p => p.id === item.product);
        const unitName = product?.unit?.name || 'шт.';
        return `• ${product?.name || `Товар #${item.product}`}: ${item.count} ${unitName}`;
    }).join('\n');
    
    if (!confirm(`Подтвердите расход товаров:\n\n${confirmMessage}`)) {
        return;
    }
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Обработка...';
        }
        
        const shipmentId = await api.createShipment(shipmentData);
        console.log('Создана отгрузка с ID:', shipmentId);
        
        if (!shipmentId || shipmentId === 0) {
            console.warn('Некорректный ID отгрузки, пропускаем shipShipment');
            showNotification('⚠️ Отгрузка создана, но не отмечена как выполненная. Обновите статус вручную.', 'warning');
        } else {
            try {
                const shipResult = await api.shipShipment(shipmentId);
                if (shipResult !== null) {
                    console.log('Отгрузка отмечена как выполненная');
                }
            } catch (shipError) {
                console.warn('Не удалось отметить отгрузку как выполненную:', shipError);
                showNotification('⚠️ Отгрузка создана. Обновите статус в панели менеджера.', 'warning');
            }
        }
        
        modal.hide();
        
        await loadShipments();
        calculateStock();
        renderProductsTable(products);
        
        showNotification(`✅ Расход оформлен! ID отгрузки: ${shipmentId}`, 'success');
    } catch (error) {
        console.error('Create outcome error:', error);
        showNotification(error.message || '❌ Ошибка при оформлении расхода', 'error');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '📤 Подтвердить расход';
        }
    }
}

function toggleSelectAllSchedule() {
    const selectAll = document.getElementById('selectAllSchedule');
    const checkboxes = document.querySelectorAll('.schedule-select:not(:disabled)');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
    updateReceiptButton();
}

// Экспорт функций
window.openOutcomeModal = openOutcomeModal;
window.loadDeliverySchedule = loadDeliverySchedule;
window.toggleSelectAllSchedule = toggleSelectAllSchedule;
window.viewContract = viewContract;
window.updateReceiptButton = updateReceiptButton;
window.openReceiptModal = openReceiptModal;
window.addOutcomeItem = addOutcomeItem;
window.removeOutcomeItem = removeOutcomeItem;
window.onOutcomeProductSelect = onOutcomeProductSelect;
window.viewReceiptOrder = viewReceiptOrder;
window.printReceiptOrder = printReceiptOrder;
window.printContract = printContract;
window.loadReceiptOrders = loadReceiptOrders;
