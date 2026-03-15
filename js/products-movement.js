/**
 * Скрипт для страницы товаров и движений
 */

let products = [];

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
}

async function loadProducts(search = '', filter = 'all') {
    try {
        products = await api.getProducts();
        
        // Фильтрация
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
        document.getElementById('productsTableBody').innerHTML = 
            '<tr><td colspan="7" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderProductsTable(productsToShow) {
    const tbody = document.getElementById('productsTableBody');
    
    if (!productsToShow || !productsToShow.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = productsToShow.map(product => {
        const isCritical = product.criticalBalance > 0;
        return `
            <tr class="${isCritical ? 'critical' : ''}">
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td><span class="unit-badge">${product.unit?.name || '-'}</span></td>
                <td>${product.criticalBalance || 0}</td>
                <td>${product.criticalBalance || 0}</td>
                <td>
                    <span class="status-badge status-${isCritical ? 'warning' : 'normal'}">
                        ${isCritical ? '⚠️ Критический' : '✅ Норма'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn move" onclick="openMoveModal(${product.id})">📦 Переместить</button>
                        <button class="action-btn history" onclick="openHistoryModal(${product.id})">📜 История</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openIncomeModal() {
    showNotification('Функция прихода в разработке', 'info');
}

function openOutcomeModal() {
    showNotification('Функция расхода в разработке', 'info');
}

function startInventory() {
    showNotification('Функция инвентаризации в разработке', 'info');
}

function openMoveModal(productId) {
    showNotification('Функция перемещения в разработке', 'info');
}

function openHistoryModal(productId) {
    showNotification('Функция истории в разработке', 'info');
}

// Глобальные функции
window.openIncomeModal = openIncomeModal;
window.openOutcomeModal = openOutcomeModal;
window.startInventory = startInventory;
window.openMoveModal = openMoveModal;
window.openHistoryModal = openHistoryModal;
