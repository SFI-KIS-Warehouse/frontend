/**
 * API клиент для работы с бэкендом
 */
class ApiClient {
    constructor() {
        this.baseURL = 'http://91.209.135.123';
        this.timeout = 30000;
    }

    /**
     * Выполнить fetch с таймаутом
     */
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Превышен таймаут запроса');
            }
            throw error;
        }
    }

    /**
     * Получить заголовки с токеном авторизации
     */
    getHeaders() {
        const token = authService.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
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
            if (response.status === 403) {
                throw new Error('Доступ запрещен');
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
        const response = await this.fetchWithTimeout(
            `${this.baseURL}/api/user/login?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
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
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/providers`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getProvider(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/providers/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addProvider(providerData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/providers/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(providerData)
        });
        return this.handleResponse(response);
    }

    // ============ Units ============
    async getUnits() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/units`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getUnit(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/units/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addUnit(name) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/units/add?name=${encodeURIComponent(name)}`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // ============ Products ============
    async getProducts() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/products`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getProduct(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/products/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addProduct(productData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/products/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(productData)
        });
        return this.handleResponse(response);
    }

    // ============ Contracts ============
    async getContracts() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/contracts`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getContract(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/contracts/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async changeContractStatus(id, code) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/contracts/${id}/changeStatus?code=${code}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addContract(contractData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/contracts/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(contractData)
        });
        return this.handleResponse(response);
    }

    // ============ Shipments ============
    async getShipments() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getShipment(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async createShipment(shipmentData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(shipmentData)
        });
        return this.handleResponse(response);
    }

    async shipShipment(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/${id}/ship`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // ============ Receipt Orders ============
    async getReceiptOrders() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/receiptorders`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getReceiptOrder(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/receiptorders/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async createReceiptOrder(orderData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/receiptorders/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(orderData)
        });
        return this.handleResponse(response);
    }

    // ============ Delivery Schedule ============
    async getDeliverySchedule() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/deliveryschedule`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getDeliveryScheduleEntry(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/deliveryschedule/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addDeliveryScheduleEntry(entryData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/deliveryschedule/addEntry`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(entryData)
        });
        return this.handleResponse(response);
    }
}

// Глобальный экземпляр API клиента
const api = new ApiClient();
