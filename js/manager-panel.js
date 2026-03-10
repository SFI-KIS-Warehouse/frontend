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

function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = 'Менеджер';
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

    tbody.innerHTML = providers.map(provider => `
        <tr>
            <td>${provider.id}</td>
            <td>${provider.name}</td>
            <td>${provider.itn || provider.ITN || '-'}</td>
            <td>${provider.bic || provider.BIC || '-'}</td>
            <td>${provider.settlementAccount || '-'}</td>
            <td>${provider.directorFullName || '-'}</td>
            <td>${provider.accountantFullName || '-'}</td>
        </tr>
    `).join('');
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
                    <input type="number" id="providerItn" required>
                </div>
                <div class="form-group">
                    <label>БИК *</label>
                    <input type="number" id="providerBic" required>
                </div>
                <div class="form-group">
                    <label>Расчетный счет *</label>
                    <input type="number" id="providerAccount" required>
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

    document.getElementById('addProviderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const providerData = {
            name: document.getElementById('providerName').value,
            int: parseInt(document.getElementById('providerItn').value), // Внимание: в API поле INT (опечатка в бэкенде)
            bic: parseInt(document.getElementById('providerBic').value),
            settlementAccount: parseInt(document.getElementById('providerAccount').value),
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
            showNotification(error.message, 'error');
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
            <td>${product.criticalBalance || 0}</td>
        </tr>
    `).join('');
}

function showAddProductModal() {
    // Сначала загружаем единицы измерения, если их нет
    if (!units.length) {
        loadUnits().then(() => showAddProductModal());
        return;
    }

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
                        ${units.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
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

    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
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
                <span class="status-badge status-${getStatusClass(contract.status)}">
                    ${getStatusText(contract.status)}
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

function getStatusClass(status) {
    const statusMap = {
        0: 'created',
        1: 'approved',
        2: 'signed',
        3: 'cancelled'
    };
    return statusMap[status] || 'created';
}

function getStatusText(status) {
    const statusMap = {
        0: 'Создан',
        1: 'Утверждён',
        2: 'Подписан',
        3: 'Аннулирован'
    };
    return statusMap[status] || 'Неизвестно';
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
            <td>${info.product || 'ID: ' + info.product}</td>
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
                    <span class="status-badge status-${getStatusClass(contract.status)}">
                        ${getStatusText(contract.status)}
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
                    <option value="0" ${contract.status === 0 ? 'selected' : ''}>Создан</option>
                    <option value="1" ${contract.status === 1 ? 'selected' : ''}>Утверждён</option>
                    <option value="2" ${contract.status === 2 ? 'selected' : ''}>Подписан</option>
                    <option value="3" ${contract.status === 3 ? 'selected' : ''}>Аннулирован</option>
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
    // Загружаем данные, если их нет
    Promise.all([
        providers.length ? Promise.resolve() : loadProviders(),
        products.length ? Promise.resolve() : loadProducts()
    ]).then(() => {
        const modalContent = {
            title: 'Создание договора',
            body: `
                <form id="addContractForm">
                    <div class="form-group">
                        <label>Поставщик *</label>
                        <select id="contractProvider" required>
                            <option value="">Выберите поставщика</option>
                            ${providers.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                        </select>
                    </div>

                    <div id="productsContainer">
                        <!-- Товары будут добавляться сюда -->
                    </div>

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
        addProductToContract(); // Добавляем первый товар
    });
}

function addProductToContract() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    const productId = `product_${window.productCounter++}`;

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
                    ${products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
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

// Обработка создания договора
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

/**
 * Показать уведомление
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Делаем функции глобальными для вызова из HTML
window.showAddProviderModal = showAddProviderModal;
window.showAddUnitModal = showAddUnitModal;
window.showAddProductModal = showAddProductModal;
window.showAddContractModal = showAddContractModal;
window.viewContract = viewContract;
window.addProductToContract = addProductToContract;
window.removeProductFromContract = removeProductFromContract;
window.changeContractStatus = changeContractStatus;
