/**
 * Скрипт для панели кладовщика
 */

let shipments = [];
let receipts = [];
let schedule = [];
let inventoryItems = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!authService.isAuthenticated()) {
        authService.redirectToLogin();
        return;
    }

    const userRole = authService.getUserRole();
    if (userRole !== 'storekeeper') {
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

function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const userInfo = authService.getUserInfo();
        userNameElement.textContent = userInfo?.name || 'Кладовщик';
    }
}

async function loadAllData() {
    try {
        await Promise.all([
            loadShipments(),
            loadReceipts(),
            loadSchedule()
        ]);
    } catch (error) {
        showNotification('Ошибка загрузки данных', 'error');
    }
}

// ============ Shipments ============

async function loadShipments() {
    try {
        shipments = await api.getShipments();
        renderShipmentsTable();
    } catch (error) {
        document.getElementById('shipmentsTableBody').innerHTML = 
            '<tr><td colspan="5" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderShipmentsTable() {
    const tbody = document.getElementById('shipmentsTableBody');
    
    if (!shipments.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = shipments.map(shipment => `
        <tr>
            <td>${shipment.id}</td>
            <td>${shipment.time ? new Date(shipment.time).toLocaleString() : 'Не отгружено'}</td>
            <td>
                <span class="status-badge status-${CONFIG.SHIPMENT_STATUSES[shipment.status]?.class || 'created'}">
                    ${CONFIG.SHIPMENT_STATUSES[shipment.status]?.name || 'Неизвестно'}
                </span>
            </td>
            <td>${shipment.productInfo?.length || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewShipment(${shipment.id})">👁️</button>
                    ${shipment.status === 0 ? 
                        `<button class="btn-icon btn-ship" onclick="shipShipment(${shipment.id})">🚚 Отгрузить</button>` : 
                        ''}
                    <button class="btn-icon btn-print" onclick="printShipment(${shipment.id})">🖨️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function viewShipment(id) {
    try {
        const shipment = await api.getShipment(id);
        showShipmentModal(shipment);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function showShipmentModal(shipment) {
    const productRows = shipment.productInfo?.map(info => `
        <tr>
            <td>${info.product?.name || 'ID: ' + info.product}</td>
            <td>${info.count}</td>
            <td>${info.price}</td>
            <td>${(info.count * info.price).toFixed(2)}</td>
        </tr>
    `).join('') || '';

    const total = shipment.productInfo?.reduce((sum, info) => 
        sum + (info.count * info.price), 0
    ).toFixed(2) || 0;

    const modalContent = {
        title: `Отгрузка №${shipment.id}`,
        body: `
            <div class="shipment-details">
                <p><strong>Дата:</strong> ${shipment.time ? new Date(shipment.time).toLocaleString() : 'Не отгружено'}</p>
                <p><strong>Статус:</strong> 
                    <span class="status-badge status-${CONFIG.SHIPMENT_STATUSES[shipment.status]?.class || 'created'}">
                        ${CONFIG.SHIPMENT_STATUSES[shipment.status]?.name || 'Неизвестно'}
                    </span>
                </p>
                
                <h4>Товары в отгрузке:</h4>
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

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Закрыть</button>
                    ${shipment.status === 0 ? 
                        `<button type="button" class="btn btn-success" onclick="shipShipment(${shipment.id})">🚚 Отгрузить</button>` : 
                        ''}
                </div>
            </div>
        `
    };

    modal.show(modalContent);
}

async function shipShipment(id) {
    if (!confirm('Подтвердите отгрузку товаров')) return;

    try {
        await api.shipShipment(id);
        modal.hide();
        await loadShipments();
        showNotification('Отгрузка выполнена', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function printShipment(id) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Отгрузка №${id}</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f5f5f5; }
                </style>
            </head>
            <body>
                <h2>Отгрузка №${id}</h2>
                <p>Дата: ${new Date().toLocaleString()}</p>
                <p>Кладовщик: ${document.getElementById('userName').textContent}</p>
                <script>
                    window.onload = function() { window.print(); }
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function showCreateShipmentModal() {
    api.getProducts().then(products => {
        const modalContent = {
            title: 'Создание отгрузки',
            body: `
                <form id="createShipmentForm">
                    <div id="shipmentProductsContainer">
                        <!-- Товары будут добавляться сюда -->
                    </div>

                    <button type="button" class="add-product-btn" onclick="addProductToShipment()">
                        ➕ Добавить товар
                    </button>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                        <button type="submit" class="btn btn-primary">Создать отгрузку</button>
                    </div>
                </form>
            `
        };

        modal.show(modalContent);
        window.productCounter = 0;
        window.availableProducts = products;
        addProductToShipment();
    });
}

function addProductToShipment() {
    const container = document.getElementById('shipmentProductsContainer');
    if (!container || !window.availableProducts) return;

    const productId = `product_${window.productCounter++}`;

    const productHtml = `
        <div class="product-item" id="${productId}">
            <div class="product-item-header">
                <h4>Товар ${window.productCounter}</h4>
                <button type="button" class="remove-btn" onclick="removeProductFromShipment('${productId}')">×</button>
            </div>
            <div class="form-group">
                <label>Товар *</label>
                <select class="product-select" required>
                    <option value="">Выберите товар</option>
                    ${window.availableProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Количество *</label>
                <input type="number" class="product-count" min="1" required>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', productHtml);
}

function removeProductFromShipment(id) {
    document.getElementById(id)?.remove();
}

// ============ Receipts ============

async function loadReceipts() {
    try {
        receipts = await api.getReceiptOrders();
        renderReceiptsTable();
    } catch (error) {
        document.getElementById('receiptsTableBody').innerHTML = 
            '<tr><td colspan="4" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderReceiptsTable() {
    const tbody = document.getElementById('receiptsTableBody');
    
    if (!receipts.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = receipts.map(receipt => `
        <tr>
            <td>${receipt.id}</td>
            <td>${receipt.time ? new Date(receipt.time).toLocaleString() : '-'}</td>
            <td>${receipt.productInfo?.length || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewReceipt(${receipt.id})">👁️</button>
                    <button class="btn-icon btn-print" onclick="printReceipt(${receipt.id})">🖨️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============ Schedule ============

async function loadSchedule() {
    try {
        schedule = await api.getDeliverySchedule();
        renderScheduleTable();
    } catch (error) {
        document.getElementById('scheduleTableBody').innerHTML = 
            '<tr><td colspan="5" class="error">Ошибка загрузки</td></tr>';
    }
}

function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    
    if (!schedule.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Нет данных</td></tr>';
        return;
    }

    tbody.innerHTML = schedule.map(entry => `
        <tr>
            <td>${entry.id || entry.ID}</td>
            <td>${entry.date || '-'}</td>
            <td>${entry.contract?.id || '-'}</td>
            <td>${entry.product?.name || '-'}</td>
            <td>${entry.count || 0}</td>
        </tr>
    `).join('');
}

// ============ Inventory ============

function startInventory() {
    inventoryItems = [];
    document.getElementById('inventoryTableBody').innerHTML = '';
    showNotification('Инвентаризация начата', 'info');
}

async function addInventoryItem() {
    const barcode = document.getElementById('barcodeInput').value;
    const actual = parseInt(document.getElementById('actualCount').value);

    if (!barcode || isNaN(actual)) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    try {
        const product = await api.getProduct(parseInt(barcode));
        
        const existingItem = inventoryItems.find(item => item.productId === product.id);
        
        if (existingItem) {
            existingItem.actual = actual;
        } else {
            inventoryItems.push({
                productId: product.id,
                productName: product.name,
                expected: product.criticalBalance || 0,
                actual: actual
            });
        }

        renderInventoryTable();
        
        document.getElementById('barcodeInput').value = '';
        document.getElementById('actualCount').value = '';
        document.getElementById('barcodeInput').focus();

        showNotification(`Добавлен товар: ${product.name}`, 'success');
    } catch (error) {
        showNotification('Товар не найден', 'error');
    }
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    
    tbody.innerHTML = inventoryItems.map(item => {
        const diff = item.actual - item.expected;
        const diffClass = diff > 0 ? 'discrepancy-positive' : (diff < 0 ? 'discrepancy-negative' : '');
        
        return `
            <tr>
                <td>${item.productName}</td>
                <td>${item.expected}</td>
                <td>${item.actual}</td>
                <td class="${diffClass}">${diff > 0 ? '+' : ''}${diff}</td>
            </tr>
        `;
    }).join('');
}

// Глобальные функции
window.viewShipment = viewShipment;
window.shipShipment = shipShipment;
window.printShipment = printShipment;
window.showCreateShipmentModal = showCreateShipmentModal;
window.addProductToShipment = addProductToShipment;
window.removeProductFromShipment = removeProductFromShipment;
window.startInventory = startInventory;
window.addInventoryItem = addInventoryItem;
