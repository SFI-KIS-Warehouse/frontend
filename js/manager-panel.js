/**
 * Скрипт для панели менеджера
 */
let providers = [];
let products = [];
let units = [];
let contracts = [];
let deliverySchedule = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!authService.isAuthenticated()) {
        authService.redirectToLogin();
        return;
    }
    
    const userRole = authService.getUserRole();
    if (userRole !== 'manager') {
        authService.redirectToRoleSelect();
        return;
    }

    setupTabs();
    updateUserInfo();
    loadAllData();
    
    initNavbarBrandClick();
    initThemeToggle();

    document.getElementById('logoutBtn').addEventListener('click', () => {
        authService.logout();
        authService.redirectToLogin();
    });
});

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

function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const userInfo = authService.getUserInfo();
        userNameElement.textContent = userInfo?.name || 'Менеджер';
    }
}

async function loadAllData() {
    try {
        await Promise.all([
            loadProviders(),
            loadUnits(),
            loadProducts(),
            loadContracts()
        ]);
    } catch (error) {
        showNotification('Ошибка загрузки данных', 'error');
    }
}

// ==================== Поставщики ====================
async function loadProviders() {
    try {
        providers = await api.getProviders();
        renderProvidersTable();
    } catch (error) {
        const tbody = document.getElementById('providersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="error">Ошибка загрузки</td></tr>';
        }
    }
}

function renderProvidersTable() {
    const tbody = document.getElementById('providersTableBody');
    if (!tbody) return;
    
    if (!providers.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = providers.map(provider => {
        const inn = (provider.itn !== null && provider.itn !== undefined && provider.itn !== 0) 
            ? String(provider.itn) 
            : '-';
        
        const bic = (provider.bic !== null && provider.bic !== undefined && provider.bic !== 0) 
            ? String(provider.bic) 
            : '-';
        
        const account = (provider.settlementAccount !== null && provider.settlementAccount !== undefined) 
            ? String(provider.settlementAccount) 
            : '-';
        
        return `
            <tr>
                <td>${provider.id ?? '-'}</td>
                <td>${provider.name ?? '-'}</td>
                <td>${inn}</td>
                <td>${bic}</td>
                <td>${account}</td>
                <td>${provider.directorFullName ?? '-'}</td>
                <td>${provider.accountantFullName ?? '-'}</td>
            </tr>
        `;
    }).join('');
}

function showAddProviderModal() {
    const modalContent = {
        title: 'Добавление поставщика',
        body: `
            <form id="addProviderForm">
                <div class="form-group">
                    <label>Наименование *</label>
                    <input type="text" id="providerName" required>
                </div>
                <div class="form-group">
                    <label>ИНН * (10 или 12 цифр)</label>
                    <input type="text" id="providerItn" required placeholder="Только цифры, 10 или 12">
                    <div class="error-message" id="itnError"></div>
                </div>
                <div class="form-group">
                    <label>БИК * (9 цифр)</label>
                    <input type="text" id="providerBic" required placeholder="Только цифры, ровно 9">
                    <div class="error-message" id="bicError"></div>
                </div>
                <div class="form-group">
                    <label>Расчетный счет *</label>
                    <input type="text" id="providerAccount" required>
                </div>
                <div class="form-group">
                    <label>ФИО Директора *</label>
                    <input type="text" id="providerDirector" required>
                </div>
                <div class="form-group">
                    <label>ФИО Бухгалтера *</label>
                    <input type="text" id="providerAccountant" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        `
    };
    
    modal.show(modalContent);

    const form = document.getElementById('addProviderForm');
    const innInput = document.getElementById('providerItn');
    const bicInput = document.getElementById('providerBic');
    const itnError = document.getElementById('itnError');
    const bicError = document.getElementById('bicError');

    function validateInn(value) {
        const digits = value.replace(/\D/g, '');
        return digits.length === 10 || digits.length === 12;
    }

    function validateBic(value) {
        const digits = value.replace(/\D/g, '');
        return digits.length === 9;
    }

    innInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        itnError.style.display = 'none';
        this.classList.remove('error');
    });

    bicInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        bicError.style.display = 'none';
        this.classList.remove('error');
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const innValue = innInput.value.trim();
        const bicValue = bicInput.value.trim();
        
        let hasError = false;

        if (!validateInn(innValue)) {
            itnError.textContent = 'ИНН должен содержать 10 или 12 цифр';
            itnError.style.display = 'block';
            innInput.classList.add('error');
            hasError = true;
        }

        if (!validateBic(bicValue)) {
            bicError.textContent = 'БИК должен содержать ровно 9 цифр';
            bicError.style.display = 'block';
            bicInput.classList.add('error');
            hasError = true;
        }

        if (hasError) {
            showNotification('Проверьте правильность заполнения полей', 'error');
            return;
        }

        const name = document.getElementById('providerName').value.trim();
        const account = document.getElementById('providerAccount').value.trim();
        const director = document.getElementById('providerDirector').value.trim();
        const accountant = document.getElementById('providerAccountant').value.trim();

        if (!name || !account || !director || !accountant) {
            showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        const providerData = {
            name: name,
            itn: parseInt(innValue, 10),
            bic: parseInt(bicValue, 10),
            settlementAccount: account.toString(),
            directorFullName: director,
            accountantFullName: accountant
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        try {
            const id = await api.addProvider(providerData);
            modal.hide();
            await loadProviders();
            showNotification(`Поставщик добавлен с ID: ${id}`, 'success');
        } catch (error) {
            console.error('Add provider error:', error);
            showNotification(error.message || 'Ошибка при добавлении поставщика', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ==================== Единицы измерения ====================
async function loadUnits() {
    try {
        units = await api.getUnits();
        renderUnitsTable();
    } catch (error) {
        const tbody = document.getElementById('unitsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2" class="error">Ошибка загрузки</td></tr>';
        }
    }
}

function renderUnitsTable() {
    const tbody = document.getElementById('unitsTableBody');
    if (!tbody) return;
    
    if (!units.length) {
        tbody.innerHTML = '<tr><td colspan="2" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = units.map(unit => `
        <tr>
            <td>${unit.id}</td>
            <td>${unit.name}</td>
        </tr>
    `).join('');
}

function showAddUnitModal() {
    const modalContent = {
        title: 'Добавление единицы измерения',
        body: `
            <form id="addUnitForm">
                <div class="form-group">
                    <label>Наименование *</label>
                    <input type="text" id="unitName" placeholder="шт., кг., л." required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        `
    };
    
    modal.show(modalContent);

    document.getElementById('addUnitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('unitName').value;

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Сохранение...';
            }

            const id = await api.addUnit(name);
            modal.hide();
            await loadUnits();
            showNotification(`Единица измерения добавлена с ID: ${id}`, 'success');
        } catch (error) {
            if (error.message.includes('Conflict')) {
                showNotification('Такая единица измерения уже существует', 'error');
            } else {
                showNotification(error.message, 'error');
            }
        }
    });
}

// ==================== Товары ====================
async function loadProducts() {
    try {
        products = await api.getProducts();
        renderProductsTable();
    } catch (error) {
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="error">Ошибка загрузки</td></tr>';
        }
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.unit?.name || '-'}</td>
            <td>${product.criticalBalance ?? 0}</td>
        </tr>
    `).join('');
}

function showAddProductModal() {
    if (!units || units.length === 0) {
        loadUnits().then(() => showAddProductModal());
        return;
    }
    
    const unitOptions = units.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    
    const modalContent = {
        title: 'Добавление товара',
        body: `
            <form id="addProductForm">
                <div class="form-group">
                    <label>Наименование *</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label>Единица измерения *</label>
                    <select id="productUnit" required>
                        <option value="">Выберите единицу измерения</option>
                        ${unitOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Критический остаток *</label>
                    <input type="number" id="productCriticalBalance" min="0" value="0" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        `
    };

    modal.show(modalContent);

    const form = document.getElementById('addProductForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('productName').value,
                unit: parseInt(document.getElementById('productUnit').value),
                criticalBalance: parseInt(document.getElementById('productCriticalBalance').value)
            };

            try {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Сохранение...';
                }

                const id = await api.addProduct(productData);
                modal.hide();
                await loadProducts();
                showNotification(`Товар добавлен с ID: ${id}`, 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }
}

// ==================== Договоры ====================
async function loadContracts() {
    try {
        contracts = await api.getContracts();
        renderContractsTable();
    } catch (error) {
        const tbody = document.getElementById('contractsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="error">Ошибка загрузки</td></tr>';
        }
    }
}

function renderContractsTable() {
    const tbody = document.getElementById('contractsTableBody');
    if (!tbody) return;
    
    if (!contracts.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = contracts.map(contract => {
        const productList = contract.productInfo || [];
        const productCount = productList.length;
        const productNames = productList.map(info => 
            info.product?.name || `Товар #${info.product}`
        );
        
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

        return `
            <tr>
                <td>${contract.id}</td>
                <td>${contract.provider?.name || '-'}</td>
                <td>
                    <span class="status-badge status-${CONFIG.CONTRACT_STATUSES[contract.status]?.class || 'created'}">
                        ${CONFIG.CONTRACT_STATUSES[contract.status]?.name || 'Неизвестно'}
                    </span>
                </td>
                <td>
                    <div class="products-list" title="${tooltip}">
                        ${productsHtml}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="viewContract(${contract.id})">👁️ Просмотр</button>
                        <button class="btn-icon btn-success" onclick="openAddScheduleModal(${contract.id})">📅 График</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewContract(id) {
    try {
        const contract = await api.getContract(id);
        showContractModal(contract);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function showContractModal(contract) {
    const productRows = contract.productInfo?.map(info => `
        <tr>
            <td>${info.product?.name || 'ID: ' + info.product}</td>
            <td>${info.count}</td>
            <td>${info.price}</td>
            <td>${(info.count * info.price).toFixed(2)}</td>
        </tr>
    `).join('') || '';
    
    const total = contract.productInfo?.reduce((sum, info) => 
        sum + (info.count * info.price), 0
    ).toFixed(2) || 0;

    const modalContent = {
        title: `Договор №${contract.id}`,
        body: `
            <div class="contract-details">
                <p><strong>Поставщик:</strong> ${contract.provider?.name || '-'}</p>
                <p><strong>Статус:</strong> 
                    <span class="status-badge status-${CONFIG.CONTRACT_STATUSES[contract.status]?.class || 'created'}">
                        ${CONFIG.CONTRACT_STATUSES[contract.status]?.name || 'Неизвестно'}
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
                            <td><strong>${total}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <h4>Изменить статус:</h4>
                <select id="changeStatusSelect" class="form-control">
                    ${Object.entries(CONFIG.CONTRACT_STATUSES).map(([key, value]) => `
                        <option value="${key}" ${contract.status === parseInt(key) ? 'selected' : ''}>
                            ${value.name}
                        </option>
                    `).join('')}
                </select>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Закрыть</button>
                    <button type="button" class="btn btn-primary" onclick="changeContractStatus(${contract.id})">
                        Изменить статус
                    </button>
                </div>
            </div>
        `
    };

    modal.show(modalContent);
}

async function changeContractStatus(id) {
    const select = document.getElementById('changeStatusSelect');
    const newStatus = parseInt(select.value);
    
    try {
        await api.changeContractStatus(id, newStatus);
        modal.hide();
        await loadContracts();
        showNotification('Статус договора изменен', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ==================== График поставок ====================
async function loadDeliverySchedule() {
    try {
        deliverySchedule = await api.getDeliverySchedule();
        renderScheduleTable();
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

function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    if (!deliverySchedule.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Нет данных</td></tr>';
        return;
    }

    const sorted = [...deliverySchedule].sort((a, b) => new Date(a.date) - new Date(b.date));
    tbody.innerHTML = sorted.map(entry => {
        const status = getScheduleStatus(entry.date);
        const isReceived = entry.relatedReceipt !== null && entry.relatedReceipt !== undefined;
        const unitName = entry.product?.unit?.name || 'шт.';
        const quantityWithUnit = `${entry.count} ${unitName}`;
        
        return `
            <tr class="schedule-row ${isReceived ? 'received' : ''}" data-id="${entry.id}">
                <td><input type="checkbox" class="schedule-select" value="${entry.id}"></td>
                <td>${new Date(entry.date).toLocaleDateString('ru-RU')}</td>
                <td>${entry.product?.name || 'Товар #' + entry.product}</td>
                <td>${quantityWithUnit}</td>
                <td>
                    <a href="#" class="contract-link" onclick="openContractFromSchedule(${entry.contract}); return false;">
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

async function openContractFromSchedule(contractId) {
    try {
        const contract = await api.getContract(contractId);
        showContractModal(contract);
    } catch (error) {
        showNotification('Ошибка загрузки договора', 'error');
        console.error('Open contract error:', error);
    }
}

function toggleSelectAllSchedule() {
    const selectAll = document.getElementById('selectAllSchedule');
    const checkboxes = document.querySelectorAll('.schedule-select');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

function openAddScheduleModal(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) { 
        showNotification('Договор не найден', 'error'); 
        return; 
    }

    const productSections = contract.productInfo?.map((info, index) => `
        <div class="contract-product-section">
            <div class="product-section-header">
                <h4>
                    📦 ${info.product?.name || 'Товар #' + info.product}
                    <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">(в договоре: ${info.count} ${info.product?.unit?.name || 'шт.'})</span>
                </h4>
                <button type="button" class="btn btn-sm btn-success" onclick="addScheduleRowForProduct(${info.product?.id || info.product}, '${(info.product?.name || 'Товар').replace(/'/g, "\\'")}')">
                    ➕ Добавить дату
                </button>
            </div>
            <div id="product-schedule-container-${info.product?.id || info.product}" class="product-schedule-container">
            </div>
            <input type="hidden" class="product-id" value="${info.product?.id || info.product}">
            <input type="hidden" class="product-name" value="${info.product?.name || 'Товар'}">
        </div>
    `).join('') || '<p style="color: var(--text-secondary); text-align: center;">Нет товаров в договоре</p>';

    const modalContent = {
        title: `📅 График для договора #${contractId}`,
        body: `
            <form id="addScheduleForm" data-contract-id="${contractId}">
                <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 5px; border-left: 4px solid var(--info-color);">
                    <p style="margin: 0; color: var(--text-secondary); font-weight: 500;">
                        ℹ️ Добавьте даты поставки для каждого товара из договора.
                    </p>
                </div>
                
                <div id="allProductsContainer">
                    ${productSections}
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                    <button type="submit" class="btn btn-primary">💾 Сохранить график</button>
                </div>
            </form>
        `
    };
    modal.show(modalContent);
    window.scheduleRowCounter = 0;
    window.currentContractId = contractId;
}

function addScheduleRowForProduct(productId, productName) {
    const container = document.getElementById(`product-schedule-container-${productId}`);
    if (!container) {
        console.error(`Контейнер для товара ${productId} не найден`);
        return;
    }
    
    const rowId = `schedule_row_${window.scheduleRowCounter++}`;

    const rowHtml = `
        <div class="schedule-row-item" id="${rowId}">
            <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 13px; color: var(--text-secondary);">Дата *</label>
                <input type="date" class="schedule-date" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 13px; color: var(--text-secondary);">Количество *</label>
                <input type="number" class="schedule-count" min="1" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <button type="button" class="btn btn-danger" onclick="removeScheduleRow('${rowId}')" style="padding: 10px 15px; height: 42px;">🗑️</button>
            </div>
            <input type="hidden" class="schedule-product-id" value="${productId}">
            <input type="hidden" class="schedule-product-name" value="${productName}">
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeScheduleRow(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

document.addEventListener('submit', async (e) => {
    if (e.target.id === 'addScheduleForm') {
        e.preventDefault();
        
        const contractId = e.target.dataset?.contractId || window.currentContractId;
        if (!contractId) {
            showNotification('Ошибка: ID договора не найден', 'error');
            return;
        }
        
        const allRows = document.querySelectorAll('.schedule-row-item');
        if (allRows.length === 0) {
            showNotification('Добавьте хотя бы одну дату для любого товара', 'error');
            return;
        }
        
        const entries = [];
        for (const row of allRows) {
            const dateInput = row.querySelector('.schedule-date');
            const countInput = row.querySelector('.schedule-count');
            const productIdInput = row.querySelector('.schedule-product-id');
            
            if (dateInput && countInput && productIdInput && dateInput.value && countInput.value && productIdInput.value) {
                entries.push({ 
                    date: dateInput.value, 
                    contract: parseInt(contractId), 
                    product: parseInt(productIdInput.value), 
                    count: parseInt(countInput.value) 
                });
            }
        }
        
        if (entries.length === 0) { 
            showNotification('Заполните все поля (дата и количество)', 'error'); 
            return; 
        }
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Сохранение...';
            }
            
            for (const entry of entries) {
                await api.addDeliveryScheduleEntry(entry);
            }
            
            modal.hide();
            await loadDeliverySchedule();
            showNotification(`График добавлен (${entries.length} записей)`, 'success');
        } catch (error) {
            console.error('Add schedule error:', error);
            showNotification(error.message || 'Ошибка при сохранении графика', 'error');
        }
    }
    
    if (e.target.id === 'addContractForm') {
        e.preventDefault();
        
        const providerId = parseInt(document.getElementById('contractProvider').value);
        const productItems = document.querySelectorAll('.product-item');
        const productInfo = [];
        
        for (const item of productItems) {
            const select = item.querySelector('.product-select');
            const count = item.querySelector('.product-count');
            const price = item.querySelector('.product-price');
            if (select.value && count.value && price.value) {
                productInfo.push({
                    product: parseInt(select.value),
                    count: parseInt(count.value),
                    price: parseFloat(price.value)
                });
            }
        }
        
        if (productInfo.length === 0) { 
            showNotification('Добавьте хотя бы один товар', 'error'); 
            return; 
        }
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Создание...';
            }
            const id = await api.addContract({ provider: providerId, productInfo });
            modal.hide();
            await loadContracts();
            showNotification(`Договор создан с ID: ${id}`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
});

function showAddContractModal() {
    Promise.all([
        providers.length ? Promise.resolve() : loadProviders(),
        products.length ? Promise.resolve() : loadProducts()
    ]).then(() => {
        const providerOptions = providers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        
        const modalContent = {
            title: 'Создание договора',
            body: `
                <form id="addContractForm">
                    <div class="form-group">
                        <label>Поставщик *</label>
                        <select id="contractProvider" required>
                            <option value="">Выберите поставщика</option>
                            ${providerOptions}
                        </select>
                    </div>
                    
                    <div id="productsContainer"></div>

                    <button type="button" class="add-product-btn" onclick="addProductToContract()">
                        ➕ Добавить товар
                    </button>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                        <button type="submit" class="btn btn-primary">Создать договор</button>
                    </div>
                </form>
            `
        };

        modal.show(modalContent);
        window.productCounter = 0;
        addProductToContract();
    });
}

function addProductToContract() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    const productId = `product_${window.productCounter++}`;

    const productOptions = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    const productHtml = `
        <div class="product-item" id="${productId}">
            <div class="product-item-header">
                <h4>Товар ${window.productCounter}</h4>
                <button type="button" class="remove-btn" onclick="removeProductFromContract('${productId}')">×</button>
            </div>
            <div class="form-group">
                <label>Товар *</label>
                <select class="product-select" required>
                    <option value="">Выберите товар</option>
                    ${productOptions}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Количество *</label>
                    <input type="number" class="product-count" min="1" required>
                </div>
                <div class="form-group">
                    <label>Цена *</label>
                    <input type="number" step="0.01" class="product-price" min="0" required>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', productHtml);
}

function removeProductFromContract(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// Глобальные функции
window.showAddProviderModal = showAddProviderModal;
window.showAddUnitModal = showAddUnitModal;
window.showAddProductModal = showAddProductModal;
window.showAddContractModal = showAddContractModal;
window.viewContract = viewContract;
window.addProductToContract = addProductToContract;
window.removeProductFromContract = removeProductFromContract;
window.changeContractStatus = changeContractStatus;
window.openAddScheduleModal = openAddScheduleModal;
window.addScheduleRowForProduct = addScheduleRowForProduct;
window.removeScheduleRow = removeScheduleRow;
window.toggleSelectAllSchedule = toggleSelectAllSchedule;
window.openContractFromSchedule = openContractFromSchedule;
