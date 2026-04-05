/**
 * Скрипт для панели менеджера
 */
let providers = [];
let products = [];
let units = [];
let contracts = [];

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

// ============ Providers ============
async function loadProviders() {
    try {
        providers = await api.getProviders();
        renderProvidersTable();
    } catch (error) {
        document.getElementById('providersTableBody').innerHTML = 
            '<tr><td colspan="7" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderProvidersTable() {
    const tbody = document.getElementById('providersTableBody');
    
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
                    <label>ИНН *</label>
                    <input type="text" id="providerItn" required maxlength="12" placeholder="10 или 12 цифр">
                </div>
                <div class="form-group">
                    <label>БИК *</label>
                    <input type="text" id="providerBic" required maxlength="9" placeholder="9 цифр">
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

    const innInput = document.getElementById('providerItn');
    if (innInput) {
        innInput.addEventListener('input', () => {
            innInput.value = innInput.value.replace(/\D/g, '');
        });
    }

    const bicInput = document.getElementById('providerBic');
    if (bicInput) {
        bicInput.addEventListener('input', () => {
            bicInput.value = bicInput.value.replace(/\D/g, '');
        });
    }

    document.getElementById('addProviderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const innValue = document.getElementById('providerItn').value;
        const bicValue = document.getElementById('providerBic').value;
        const accountValue = document.getElementById('providerAccount').value;
        
        if (!innValue || innValue.length === 0) {
            showNotification('Введите ИНН', 'error');
            return;
        }
        
        if (!bicValue || bicValue.length === 0) {
            showNotification('Введите БИК', 'error');
            return;
        }
        
        const providerData = {
            name: document.getElementById('providerName').value,
            itn: parseInt(innValue, 10),
            bic: parseInt(bicValue, 10),
            settlementAccount: accountValue.toString(),
            directorFullName: document.getElementById('providerDirector').value,
            accountantFullName: document.getElementById('providerAccountant').value
        };

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Сохранение...';

            const id = await api.addProvider(providerData);
            modal.hide();
            await loadProviders();
            showNotification(`Поставщик добавлен с ID: ${id}`, 'success');
        } catch (error) {
            console.error('Add provider error:', error);
            showNotification(error.message || 'Ошибка при добавлении поставщика', 'error');
        }
    });
}

// ============ Units ============
async function loadUnits() {
    try {
        units = await api.getUnits();
        renderUnitsTable();
    } catch (error) {
        document.getElementById('unitsTableBody').innerHTML = 
            '<tr><td colspan="2" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderUnitsTable() {
    const tbody = document.getElementById('unitsTableBody');
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
            submitBtn.disabled = true;
            submitBtn.textContent = 'Сохранение...';

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

// ============ Products ============
async function loadProducts() {
    try {
        products = await api.getProducts();
        renderProductsTable();
    } catch (error) {
        document.getElementById('productsTableBody').innerHTML = 
            '<tr><td colspan="4" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
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
                submitBtn.disabled = true;
                submitBtn.textContent = 'Сохранение...';

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

// ============ Contracts ============
async function loadContracts() {
    try {
        contracts = await api.getContracts();
        renderContractsTable();
    } catch (error) {
        document.getElementById('contractsTableBody').innerHTML = 
            '<tr><td colspan="5" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderContractsTable() {
    const tbody = document.getElementById('contractsTableBody');
    if (!contracts.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = contracts.map(contract => `
        <tr>
            <td>${contract.id}</td>
            <td>${contract.provider?.name || '-'}</td>
            <td>
                <span class="status-badge status-${CONFIG.CONTRACT_STATUSES[contract.status]?.class || 'created'}">
                    ${CONFIG.CONTRACT_STATUSES[contract.status]?.name || 'Неизвестно'}
                </span>
            </td>
            <td>${contract.productInfo?.length || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewContract(${contract.id})">👁️ Просмотр</button>
                </div>
            </td>
        </tr>
    `).join('');
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
    document.getElementById(id)?.remove();
}

document.addEventListener('submit', async (e) => {
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

        const contractData = {
            provider: providerId,
            productInfo: productInfo
        };

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Создание...';

            const id = await api.addContract(contractData);
            modal.hide();
            await loadContracts();
            showNotification(`Договор создан с ID: ${id}`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
});

// Глобальные функции
window.showAddProviderModal = showAddProviderModal;
window.showAddUnitModal = showAddUnitModal;
window.showAddProductModal = showAddProductModal;
window.showAddContractModal = showAddContractModal;
window.viewContract = viewContract;
window.addProductToContract = addProductToContract;
window.removeProductFromContract = removeProductFromContract;
window.changeContractStatus = changeContractStatus;
