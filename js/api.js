/**
 * API клиент для работы с бэкендом
 */
class ApiClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL || window.location.origin;
    }

    /**
     * Получить заголовки с токеном авторизации
     */
    getHeaders() {
        const token = authService.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Обработка ответа от сервера
     */
    async handleResponse(response) {
        if (!response.ok) {
            if (response.status === 401) {
                authService.logout();
                authService.redirectToLogin();
                throw new Error('Сессия истекла');
            }
            if (response.status === 404) {
                throw new Error('Ресурс не найден');
            }
            if (response.status === 409) {
                throw new Error('Конфликт данных');
            }
            const error = await response.text();
            throw new Error(error || 'Ошибка запроса');
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    }

    // ============ User ============
    async login(login, password) {
        const response = await fetch(
            `${this.baseURL}/user/login?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
            {
                headers: {
                    'Accept': 'text/plain',
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Ошибка авторизации');
        }
        return await response.text();
    }

    // ============ Providers ============
    async getProviders() {
        const response = await fetch(`${this.baseURL}/providers`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getProvider(id) {
        const response = await fetch(`${this.baseURL}/providers/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addProvider(providerData) {
        const response = await fetch(`${this.baseURL}/providers/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(providerData)
        });
        return this.handleResponse(response);
    }

    // ============ Units ============
    async getUnits() {
        const response = await fetch(`${this.baseURL}/units`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getUnit(id) {
        const response = await fetch(`${this.baseURL}/units/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addUnit(name) {
        const response = await fetch(`${this.baseURL}/units/add?name=${encodeURIComponent(name)}`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // ============ Products ============
    async getProducts() {
        const response = await fetch(`${this.baseURL}/products`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getProduct(id) {
        const response = await fetch(`${this.baseURL}/products/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addProduct(productData) {
        const response = await fetch(`${this.baseURL}/products/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(productData)
        });
        return this.handleResponse(response);
    }

    // ============ Contracts ============
    async getContracts() {
        const response = await fetch(`${this.baseURL}/contracts`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getContract(id) {
        const response = await fetch(`${this.baseURL}/contracts/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async changeContractStatus(id, code) {
        const response = await fetch(`${this.baseURL}/contracts/${id}/changeStatus?code=${code}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addContract(contractData) {
        const response = await fetch(`${this.baseURL}/contracts/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(contractData)
        });
        return this.handleResponse(response);
    }

    // ============ Shipments ============
    async getShipments() {
        const response = await fetch(`${this.baseURL}/shipments`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getShipment(id) {
        const response = await fetch(`${this.baseURL}/shipments/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async createShipment(shipmentData) {
        const response = await fetch(`${this.baseURL}/shipments/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(shipmentData)
        });
        return this.handleResponse(response);
    }

    async shipShipment(id) {
        const response = await fetch(`${this.baseURL}/shipments/${id}/ship`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // ============ Receipt Orders ============
    async getReceiptOrders() {
        const response = await fetch(`${this.baseURL}/receiptorders`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getReceiptOrder(id) {
        const response = await fetch(`${this.baseURL}/receiptorders/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async createReceiptOrder(orderData) {
        const response = await fetch(`${this.baseURL}/receiptorders/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(orderData)
        });
        return this.handleResponse(response);
    }

    // ============ Delivery Schedule ============
    async getDeliverySchedule() {
        const response = await fetch(`${this.baseURL}/deliveryschedule`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addDeliveryScheduleEntry(entryData) {
        const response = await fetch(`${this.baseURL}/deliveryschedule/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(entryData)
        });
        return this.handleResponse(response);
    }
}

// Глобальный экземпляр API клиента
const api = new ApiClient();
