/**
 * Скрипт для страницы товаров и движений
 */
let products = [];
let deliverySchedule = [];

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
    loadProducts();
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
            }
        });
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadProducts(searchInput.value, filterSelect?.value);
        }, 300));
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            loadProducts(searchInput?.value, filterSelect.value);
        });
    }
    
    const scheduleSearchInput = document.getElementById('scheduleSearchInput');
    const scheduleFilterSelect = document.getElementById('scheduleFilterSelect');
    
    if (scheduleSearchInput) {
        scheduleSearchInput.addEventListener('input', debounce(() => {
            renderScheduleTable(
                scheduleSearchInput.value,
                scheduleFilterSelect?.value
            );
        }, 300));
    }

    if (scheduleFilterSelect) {
        scheduleFilterSelect.addEventListener('change', () => {
            renderScheduleTable(
                scheduleSearchInput?.value,
                scheduleFilterSelect.value
            );
        });
    }
}

async function loadProducts(search = '', filter = 'all') {
    try {
        products = await api.getProducts();
        
        // ✅ Сохраняем товары глобально для использования в отгрузке
        window.products = products;
        
        console.log('✅ Загружено товаров:', products.length);
        
        let filteredProducts = [...products];
        
        if (search) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        if (filter === 'critical') {
            filteredProducts = filteredProducts.filter(p => 
                p.criticalBalance > 0
            );
        }
        
        renderProductsTable(filteredProducts);
    } catch (error) {
        console.error('Load products error:', error);
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
        const isCritical = product.criticalBalance > 0;
        return `
            <tr class="${isCritical ? 'critical' : ''}">
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td><span class="unit-badge">${product.unit?.name || '-'}</span></td>
                <td>
                    <span class="status-badge status-${isCritical ? 'warning' : 'normal'}">
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
        const searchInput = document.getElementById('scheduleSearchInput');
        const filterSelect = document.getElementById('scheduleFilterSelect');
        renderScheduleTable(
            searchInput?.value || '',
            filterSelect?.value || 'all'
        );
        updateReceiptButton();
    } catch (error) {
        const tbody = document.getElementById('scheduleTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="error">Ошибка загрузки</td></tr>';
        }
        console.error('Load schedule error:', error);
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

function renderScheduleTable(search = '', filter = 'all') {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    if (!deliverySchedule.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Нет данных</td></tr>';
        return;
    }

    let filteredSchedule = [...deliverySchedule];
    
    if (search) {
        filteredSchedule = filteredSchedule.filter(entry => 
            entry.product?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (filter !== 'all') {
        if (filter === 'received') {
            filteredSchedule = filteredSchedule.filter(entry => 
                entry.relatedReceipt !== null && entry.relatedReceipt !== undefined
            );
        } else {
            filteredSchedule = filteredSchedule.filter(entry => {
                const status = getScheduleStatus(entry.date);
                return status.key === filter;
            });
        }
    }
    
    const sorted = filteredSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Нет данных по фильтру</td></tr>';
        return;
    }
    
    const groupedByContract = {};
    sorted.forEach(entry => {
        const contractId = entry.contract;
        if (!groupedByContract[contractId]) {
            groupedByContract[contractId] = [];
        }
        groupedByContract[contractId].push(entry);
    });
    
    tbody.innerHTML = sorted.map(entry => {
        const status = getScheduleStatus(entry.date);
        const isReceived = entry.relatedReceipt !== null && entry.relatedReceipt !== undefined;
        const unitName = entry.product?.unit?.name || 'шт.';
        const quantityWithUnit = `${entry.count} ${unitName}`;
        
        const contractEntries = groupedByContract[entry.contract] || [];
        const allProductsInContract = contractEntries.map(e => 
            `${e.product?.name || 'Товар #' + e.product}: ${e.count} ${e.product?.unit?.name || 'шт.'}`
        ).join('\n');
        
        return `
            <tr class="schedule-row ${isReceived ? 'received' : ''}" data-id="${entry.id}">
                <td>
                    <input type="checkbox" 
                           class="schedule-select" 
                           value="${entry.id}" 
                           ${isReceived ? 'disabled' : ''}
                           onchange="updateReceiptButton()">
                </td>
                <td>${new Date(entry.date).toLocaleDateString('ru-RU')}</td>
                <td title="${allProductsInContract}">${entry.product?.name || 'Товар #' + entry.product}</td>
                <td>${quantityWithUnit}</td>
                <td>
                    <a href="#" class="contract-link" onclick="openContractFromSchedule(${entry.contract}); return false;" title="${allProductsInContract}">
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
    
    updateReceiptButton();
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
            <div class="receipt-product-row" style="background: #0a0a0a; padding: 15px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333;">
                    <h4 style="margin: 0; color: white;">📦 ${item.productName}</h4>
                    <span style="color: #b0b0b0; font-size: 13px;">Ед. изм.: ${item.unitName}</span>
                </div>
                
                ${item.entries.map((entry) => `
                    <div class="receipt-entry-row" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 15px; align-items: end; margin-bottom: 10px; padding: 10px; background: #1a1a1a; border-radius: 3px;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="color: #b0b0b0; font-size: 12px;">Поставка #${entry.id}</label>
                            <div style="color: #e0e0e0; font-size: 13px;">
                                📅 ${new Date(entry.date).toLocaleDateString('ru-RU')}
                            </div>
                            <input type="hidden" class="entry-id" value="${entry.id}">
                            <input type="hidden" class="entry-contract" value="${entry.contract}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="color: #b0b0b0; font-size: 12px;">Плановое количество</label>
                            <input type="text" value="${entry.plannedCount} ${item.unitName}" disabled 
                                   style="background: #2d2d2d; color: #9e9e9e; border: 1px solid #444; padding: 8px; border-radius: 3px; width: 100%;">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="color: #b0b0b0; font-size: 12px;">Фактическое количество *</label>
                            <input type="number" class="actual-count" min="0" value="${entry.plannedCount}" 
                                   style="background: #1a1a1a; color: #e0e0e0; border: 1px solid #4caf50; padding: 8px; border-radius: 3px; width: 100%;">
                        </div>
                    </div>
                `).join('')}
                
                <input type="hidden" class="product-id" value="${item.productId}">
                <input type="hidden" class="product-name" value="${item.productName}">
            </div>
        `;
    }).join('');
    
    const modalContent = {
        title: '📥 Оформление поступления',
        body: `
            <form id="receiptForm">
                <div style="margin-bottom: 20px; padding: 15px; background: #0a0a0a; border-radius: 5px; border-left: 4px solid #4caf50;">
                    <p style="margin: 0; color: #b0b0b0; font-size: 14px;">
                        ℹ️ Выбрано поставок: <strong style="color: white;">${selectedEntries.length}</strong> | 
                        Товаров: <strong style="color: white;">${Object.keys(groupedByProduct).length}</strong>
                    </p>
                </div>
                
                <div id="receiptProductsContainer">
                    ${productRows}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #0a0a0a; border-radius: 5px; border: 1px solid #333;">
                    <div style="display: flex; justify-content: space-between; color: #e0e0e0;">
                        <span>Итого позиций:</span>
                        <span id="totalItems">${selectedEntries.length}</span>
                    </div>
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
    
    if (receiptItems.length === 0) {
        showNotification('Нет позиций для оформления', 'error');
        return;
    }
    
    const receiptData = [];
    
    for (const item of receiptItems) {
        const entryIdInput = item.querySelector('.entry-id');
        const actualCountInput = item.querySelector('.actual-count');
        
        if (!entryIdInput?.value || !actualCountInput?.value) {
            continue;
        }
        
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
        showNotification('Заполните количество для всех позиций', 'error');
        return;
    }
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Обработка...';
        }
        
        const result = await api.createReceiptOrder(receiptData);
        
        modal.hide();
        await loadDeliverySchedule();
        await loadProducts();
        
        showNotification(`Поступление оформлено! Создано ордеров: ${Array.isArray(result) ? result.length : 1}`, 'success');
        
    } catch (error) {
        console.error('Create receipt error:', error);
        showNotification(error.message || 'Ошибка при оформлении поступления', 'error');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✅ Подтвердить поступление';
        }
    }
}

// ✅ ИСПРАВЛЕНА ФУНКЦИЯ: Отгрузка товаров
async function openOutcomeModal() {
    try {
        // ✅ Загружаем товары напрямую и сохраняем глобально
        const loadedProducts = await api.getProducts();
        window.products = loadedProducts;
        products = loadedProducts;
        
        console.log('✅ Загружено товаров для отгрузки:', loadedProducts.length);
        
        if (!loadedProducts || loadedProducts.length === 0) {
            showNotification('Нет товаров для отгрузки. Добавьте товары в панели менеджера.', 'warning');
            return;
        }

        const productOptions = loadedProducts.map(product => {
            const stock = product.criticalBalance || 0;
            const unitName = product.unit?.name || 'шт.';
            const productName = product.name || `Товар #${product.id}`;
            
            return `
                <option value="${product.id}" 
                        data-name="${productName}" 
                        data-stock="${stock}"
                        data-unit="${unitName}">
                    ${productName} (Доступно: ${stock} ${unitName})
                </option>
            `;
        }).join('');

        const modalContent = {
            title: '📤 Отгрузка товаров',
            body: `
                <form id="outcomeForm">
                    <div style="margin-bottom: 20px; padding: 15px; background: #0a0a0a; border-radius: 5px; border-left: 4px solid #f56565;">
                        <p style="margin: 0; color: #b0b0b0; font-size: 14px;">
                            ⚠️ Система проверит остатки и заблокирует отгрузку, если товара недостаточно
                        </p>
                    </div>
                    
                    <div id="outcomeItemsContainer"></div>
                    
                    <button type="button" class="btn btn-secondary" onclick="addOutcomeItem()" style="margin-top: 10px; width: 100%;">
                        ➕ Добавить товар
                    </button>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                        <button type="submit" class="btn btn-danger">📤 Подтвердить отгрузку</button>
                    </div>
                </form>
            `
        };
        
        modal.show(modalContent);
        window.outcomeItemCounter = 0;
        
        // Добавляем первую позицию
        addOutcomeItem();
        
        // Обработчик формы
        document.getElementById('outcomeForm').addEventListener('submit', handleOutcomeSubmit);
        
    } catch (error) {
        console.error('Open outcome modal error:', error);
        showNotification('Ошибка загрузки данных для отгрузки: ' + error.message, 'error');
    }
}

// ✅ ИСПРАВЛЕНА ФУНКЦИЯ: Добавление позиции отгрузки
function addOutcomeItem() {
    // ✅ Берём товары из глобальной переменной
    const products = window.products || [];
    
    console.log('addOutcomeItem - товаров:', products.length);
    
    if (!products || products.length === 0) {
        showNotification('Нет товаров для добавления. Обновите страницу.', 'error');
        return;
    }
    
    const itemId = `outcome_item_${window.outcomeItemCounter++}`;
    
    const productOptions = products.map(product => {
        const stock = product.criticalBalance || 0;
        const unitName = product.unit?.name || 'шт.';
        const productName = product.name || `Товар #${product.id}`;
        
        return `
            <option value="${product.id}" 
                    data-name="${productName}" 
                    data-stock="${stock}"
                    data-unit="${unitName}">
                ${productName} (Доступно: ${stock} ${unitName})
            </option>
        `;
    }).join('');

    const itemHtml = `
        <div class="outcome-item" id="${itemId}" style="background: #0a0a0a; padding: 15px; border-radius: 5px; margin-top: 10px; border: 1px solid #333;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: white;">Товар #${window.outcomeItemCounter}</strong>
                <button type="button" class="btn btn-danger" onclick="removeOutcomeItem('${itemId}')" style="padding: 5px 10px;">🗑️</button>
            </div>
            <div class="form-row" style="grid-template-columns: 1fr 1fr auto;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="color: #b0b0b0;">Товар *</label>
                    <select class="outcome-product" required onchange="onOutcomeProductSelect('${itemId}')">
                        <option value="">Выберите товар</option>
                        ${productOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="color: #b0b0b0;">Количество *</label>
                    <input type="number" class="outcome-count" min="1" required placeholder="Шт." style="background: #1a1a1a; color: #e0e0e0; border: 1px solid #333;">
                    <div class="stock-warning" style="color: #f44336; font-size: 11px; margin-top: 4px; display: none;"></div>
                </div>
                <div class="form-group" style="margin-bottom: 0; display: flex; align-items: end;">
                    <button type="button" class="btn btn-danger" onclick="removeOutcomeItem('${itemId}')" style="padding: 10px 15px; height: 42px;">🗑️</button>
                </div>
            </div>
            <input type="hidden" class="product-id" value="">
            <input type="hidden" class="product-name" value="">
            <input type="hidden" class="product-stock" value="0">
        </div>
    `;
    
    const container = document.getElementById('outcomeItemsContainer');
    if (container) {
        container.insertAdjacentHTML('beforeend', itemHtml);
    } else {
        console.error('outcomeItemsContainer не найден');
    }
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
    
    if (!selectedOption || !selectedOption.value) {
        return;
    }
    
    const stock = parseInt(selectedOption.dataset.stock || '0');
    const unit = selectedOption.dataset.unit || 'шт.';
    
    productIdInput.value = selectedOption.value;
    productNameInput.value = selectedOption.dataset.name;
    productStockInput.value = stock;
    
    countInput.placeholder = `Доступно: ${stock} ${unit}`;
    countInput.max = stock;
    
    countInput.oninput = () => {
        const count = parseInt(countInput.value || '0');
        if (count > stock) {
            stockWarning.style.display = 'block';
            stockWarning.textContent = `⚠️ Недостаточно товара! Доступно: ${stock} ${unit}`;
            countInput.style.borderColor = '#f44336';
        } else {
            stockWarning.style.display = 'none';
            countInput.style.borderColor = '#333';
        }
    };
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
        showNotification('Добавьте хотя бы один товар', 'error');
        return;
    }
    
    const shipmentData = [];
    let hasInsufficientStock = false;
    
    for (const item of outcomeItems) {
        const productIdInput = item.querySelector('.product-id');
        const countInput = item.querySelector('.outcome-count');
        const productStockInput = item.querySelector('.product-stock');
        
        if (!productIdInput?.value || !countInput?.value) {
            continue;
        }
        
        const count = parseInt(countInput.value);
        const stock = parseInt(productStockInput?.value || '0');
        
        if (count > stock) {
            hasInsufficientStock = true;
            const productName = item.querySelector('.product-name')?.value || 'Товар';
            showNotification(`Недостаточно товара "${productName}". Доступно: ${stock}`, 'error');
            continue;
        }
        
        shipmentData.push({
            product: parseInt(productIdInput.value),
            count: count
        });
    }
    
    if (shipmentData.length === 0) {
        showNotification('Нет товаров для отгрузки', 'error');
        return;
    }
    
    if (hasInsufficientStock) {
        showNotification('Отгрузка заблокирована: недостаточно товаров на складе', 'error');
        return;
    }
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Обработка...';
        }
        
        const result = await api.createShipment(shipmentData);
        
        modal.hide();
        await loadProducts();
        
        showNotification(`Отгрузка оформлена! ID: ${result}`, 'success');
        
    } catch (error) {
        console.error('Create shipment error:', error);
        showNotification(error.message || 'Ошибка при оформлении отгрузки', 'error');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '📤 Подтвердить отгрузку';
        }
    }
}

async function openContractFromSchedule(contractId) {
    showNotification('Просмотр договора доступен только менеджеру', 'info');
}

function toggleSelectAllSchedule() {
    const selectAll = document.getElementById('selectAllSchedule');
    const checkboxes = document.querySelectorAll('.schedule-select:not(:disabled)');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
    updateReceiptButton();
}

function openIncomeModal() {
    openReceiptModal();
}

window.openIncomeModal = openIncomeModal;
window.openOutcomeModal = openOutcomeModal;
window.loadDeliverySchedule = loadDeliverySchedule;
window.toggleSelectAllSchedule = toggleSelectAllSchedule;
window.openContractFromSchedule = openContractFromSchedule;
window.updateReceiptButton = updateReceiptButton;
window.openReceiptModal = openReceiptModal;
window.addOutcomeItem = addOutcomeItem;
window.removeOutcomeItem = removeOutcomeItem;
window.onOutcomeProductSelect = onOutcomeProductSelect;
