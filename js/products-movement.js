/**
 * Скрипт для страницы товаров и движений
 */
let products = [];
let deliverySchedule = [];
let receiptOrders = [];
let providers = []; // кэш поставщиков

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
    loadProviders(); // загружаем поставщиков для кэша
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

async function loadProviders() {
    try {
        providers = await api.getProviders();
        window.providers = providers;
    } catch (error) {
        console.error('Ошибка загрузки поставщиков:', error);
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
            } else if (tabId === 'receipts') {
                loadReceiptOrders();
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

// ==================== Товары ====================
async function loadProducts(search = '', filter = 'all') {
    try {
        products = await api.getProducts();
        window.products = products;
        
        let filteredProducts = [...products];
        
        if (search) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        if (filter === 'critical') {
            filteredProducts = filteredProducts.filter(p => p.criticalBalance > 0);
        }
        
        renderProductsTable(filteredProducts);
    } catch (error) {
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

// ==================== График поставок ====================
async function loadDeliverySchedule() {
    try {
        deliverySchedule = await api.getDeliverySchedule();
        const searchInput = document.getElementById('scheduleSearchInput');
        const filterSelect = document.getElementById('scheduleFilterSelect');
        renderScheduleTable(searchInput?.value || '', filterSelect?.value || 'all');
        updateReceiptButton();
    } catch (error) {
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
        if (!groupedByContract[contractId]) groupedByContract[contractId] = [];
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
                    <input type="checkbox" class="schedule-select" value="${entry.id}" 
                           ${isReceived ? 'disabled' : ''} onchange="updateReceiptButton()">
                </td>
                <td>${new Date(entry.date).toLocaleDateString('ru-RU')}</td>
                <td title="${allProductsInContract}">${entry.product?.name || 'Товар #' + entry.product}</td>
                <td>${quantityWithUnit}</td>
                <td>
                    <a href="#" class="contract-link" onclick="openContractFromSchedule(${entry.contract}); return false;" 
                       title="${allProductsInContract}">#${entry.contract}</a>
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

// ==================== Приходные ордера ====================
async function loadReceiptOrders() {
    try {
        receiptOrders = await api.getReceiptOrders();
        renderReceiptsTable();
    } catch (error) {
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
        
        // Определяем имя поставщика
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
                        <button class="btn-icon btn-view" onclick="viewReceiptOrder(${order.id})">👁️ Просмотр</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Просмотр деталей приходного ордера
async function viewReceiptOrder(id) {
    try {
        const order = await api.getReceiptOrder(id);
        
        // Получаем имя поставщика
        let providerName = 'Не указан';
        if (order.provider) {
            if (typeof order.provider === 'object' && order.provider.name) {
                providerName = order.provider.name;
            } else if (typeof order.provider === 'number') {
                // Ищем в уже загруженных поставщиках
                let provider = providers.find(p => p.id === order.provider);
                if (!provider) {
                    // Если нет, пробуем загрузить индивидуально
                    try {
                        provider = await api.getProvider(order.provider);
                        if (provider) {
                            providers.push(provider);
                            providerName = provider.name;
                        } else {
                            providerName = `Поставщик #${order.provider}`;
                        }
                    } catch (e) {
                        providerName = `Поставщик #${order.provider}`;
                    }
                } else {
                    providerName = provider.name;
                }
            }
        }
        
        const productInfo = order.productInfo || [];
        showReceiptModal(order.id, providerName, order.time, productInfo);
    } catch (error) {
        showNotification(error.message || 'Ошибка загрузки ордера', 'error');
    }
}

function showReceiptModal(orderId, providerName, time, productInfo) {
    const productRows = productInfo.map(info => {
        const productName = info.product?.name || `Товар #${info.product?.id || info.product}`;
        const unitName = info.product?.unit?.name || 'шт.';
        const contractId = info.contract;
        
        return `
            <tr>
                <td>${productName}</td>
                <td>${info.count} ${unitName}</td>
                <td>
                    <a href="#" class="contract-link" onclick="openContractFromReceipt(${contractId}); return false;">
                        #${contractId}
                    </a>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="3" style="text-align: center;">Нет товаров</td></tr>';

    const modalContent = {
        title: `Приходный ордер №${orderId}`,
        body: `
            <div class="contract-details">
                <p><strong>Поставщик:</strong> ${providerName}</p>
                <p><strong>Время поставки:</strong> ${time ? new Date(time).toLocaleString('ru-RU') : '—'}</p>
                
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
                </div>
            </div>
        `
    };

    modal.show(modalContent);
}

function openContractFromReceipt(contractId) {
    showNotification(`Договор #${contractId}. Просмотр доступен в панели менеджера`, 'info');
}

// ==================== Модальные окна (без изменений) ====================
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
                    <h4 style="margin: 0; color: var(--text-primary);">📦 ${item.productName}</h4>
                    <span style="color: var(--text-secondary); font-size: 13px;">Ед. изм.: ${item.unitName}</span>
                </div>
                
                ${item.entries.map((entry) => `
                    <div class="receipt-entry-row">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Поставка #${entry.id}</label>
                            <div style="color: var(--text-secondary); font-size: 13px;">
                                📅 ${new Date(entry.date).toLocaleDateString('ru-RU')}
                            </div>
                            <input type="hidden" class="entry-id" value="${entry.id}">
                            <input type="hidden" class="entry-contract" value="${entry.contract}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Плановое количество</label>
                            <input type="text" value="${entry.plannedCount} ${item.unitName}" disabled>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Фактическое количество *</label>
                            <input type="number" class="actual-count" min="0" value="${entry.plannedCount}">
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
                <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 5px; border-left: 4px solid var(--success-color);">
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                        ℹ️ Выбрано поставок: <strong>${selectedEntries.length}</strong> | 
                        Товаров: <strong>${Object.keys(groupedByProduct).length}</strong>
                    </p>
                </div>
                
                <div id="receiptProductsContainer">
                    ${productRows}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 5px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; color: var(--text-primary);">
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

async function openOutcomeModal() {
    try {
        const loadedProducts = await api.getProducts();
        window.products = loadedProducts;
        products = loadedProducts;
        
        if (!loadedProducts || loadedProducts.length === 0) {
            showNotification('Нет товаров для отгрузки. Добавьте товары в панели менеджера.', 'warning');
            return;
        }

        const productOptions = loadedProducts.map(product => {
            const stock = product.stock || product.criticalBalance || 0;
            const unitName = product.unit?.name || 'шт.';
            const productName = product.name || `Товар #${product.id}`;
            return `<option value="${product.id}" data-name="${productName}" data-stock="${stock}" data-unit="${unitName}">${productName} (Доступно: ${stock} ${unitName})</option>`;
        }).join('');

        const modalContent = {
            title: '📤 Отгрузка товаров',
            body: `
                <form id="outcomeForm">
                    <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 5px; border-left: 4px solid var(--danger-color);">
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                            ⚠️ Система проверит остатки и заблокирует отгрузку, если товара недостаточно
                        </p>
                    </div>
                    <div id="outcomeItemsContainer"></div>
                    <button type="button" class="btn btn-secondary" onclick="addOutcomeItem()" style="margin-top: 10px; width: 100%;">➕ Добавить товар</button>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                        <button type="submit" class="btn btn-danger">📤 Подтвердить отгрузку</button>
                    </div>
                </form>
            `
        };
        
        modal.show(modalContent);
        window.outcomeItemCounter = 0;
        addOutcomeItem();
        document.getElementById('outcomeForm').addEventListener('submit', handleOutcomeSubmit);
    } catch (error) {
        showNotification('Ошибка загрузки данных для отгрузки: ' + error.message, 'error');
    }
}

function addOutcomeItem() {
    const products = window.products || [];
    if (!products || products.length === 0) {
        showNotification('Нет товаров для добавления. Обновите страницу.', 'error');
        return;
    }
    
    const itemId = `outcome_item_${window.outcomeItemCounter++}`;
    const productOptions = products.map(product => {
        const stock = product.stock || product.criticalBalance || 0;
        const unitName = product.unit?.name || 'шт.';
        const productName = product.name || `Товар #${product.id}`;
        return `<option value="${product.id}" data-name="${productName}" data-stock="${stock}" data-unit="${unitName}">${productName} (Доступно: ${stock} ${unitName})</option>`;
    }).join('');

    const itemHtml = `
        <div class="outcome-item" id="${itemId}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: var(--text-primary);">Товар #${window.outcomeItemCounter}</strong>
                <button type="button" class="btn btn-danger" onclick="removeOutcomeItem('${itemId}')" style="padding: 5px 10px;">🗑️</button>
            </div>
            <div class="form-row" style="grid-template-columns: 1fr 1fr auto;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Товар *</label>
                    <select class="outcome-product" required onchange="onOutcomeProductSelect('${itemId}')">
                        <option value="">Выберите товар</option>
                        ${productOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Количество *</label>
                    <input type="number" class="outcome-count" min="1" required placeholder="Шт.">
                    <div class="stock-warning" style="color: var(--danger-color); font-size: 11px; margin-top: 4px; display: none;"></div>
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
    
    document.getElementById('outcomeItemsContainer')?.insertAdjacentHTML('beforeend', itemHtml);
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
    
    if (!selectedOption || !selectedOption.value) return;
    
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
            countInput.style.borderColor = 'var(--danger-color)';
        } else {
            stockWarning.style.display = 'none';
            countInput.style.borderColor = 'var(--border-color)';
        }
    };
}

function removeOutcomeItem(id) {
    document.getElementById(id)?.remove();
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
        
        if (!productIdInput?.value || !countInput?.value) continue;
        
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

// Глобальные функции
window.openOutcomeModal = openOutcomeModal;
window.loadDeliverySchedule = loadDeliverySchedule;
window.toggleSelectAllSchedule = toggleSelectAllSchedule;
window.openContractFromSchedule = openContractFromSchedule;
window.updateReceiptButton = updateReceiptButton;
window.openReceiptModal = openReceiptModal;
window.addOutcomeItem = addOutcomeItem;
window.removeOutcomeItem = removeOutcomeItem;
window.onOutcomeProductSelect = onOutcomeProductSelect;
window.loadReceiptOrders = loadReceiptOrders;
window.viewReceiptOrder = viewReceiptOrder;
window.openContractFromReceipt = openContractFromReceipt;
