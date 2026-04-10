/**
 * API клиент для работы с бэкендом
 */
class ApiClient {
    constructor() {
        this.baseURL = 'http://91.209.135.123';
        this.timeout = 30000;
    }

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

    // ==================== Аутентификация ====================
    async login(login, password) {
        const response = await this.fetchWithTimeout(
            `${this.baseURL}/api/users/login?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
            { headers: { 'Accept': 'text/plain' } }
        );
        if (!response.ok) {
            throw new Error('Ошибка авторизации');
        }
        return await response.text();
    }

    // ==================== Поставщики ====================
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

    // ==================== Единицы измерения ====================
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

    // ==================== Товары ====================
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

    // ==================== Договоры ====================
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

    // ==================== Отгрузки ====================
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
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(shipmentData)
        });
        const result = await this.handleResponse(response);
        const id = typeof result === 'string' ? parseInt(result, 10) : result;
        console.log('createShipment result:', result, 'parsed id:', id);
        return id;
    }

    async shipShipment(id) {
        if (!id || id === 0) {
            console.warn('shipShipment: некорректный ID', id);
            return null;
        }
        
        console.log('shipShipment вызван с ID:', id);
        
        // Пробуем GET
        try {
            const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/${id}/ship`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.warn('GET /shipments/{id}/ship не сработал:', error.message);
            
            // Пробуем POST
            try {
                const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/${id}/ship`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
                return this.handleResponse(response);
            } catch (postError) {
                console.warn('POST /shipments/{id}/ship не сработал:', postError.message);
                
                // Пробуем PUT
                try {
                    const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/${id}/ship`, {
                        method: 'PUT',
                        headers: this.getHeaders()
                    });
                    return this.handleResponse(response);
                } catch (putError) {
                    console.warn('PUT /shipments/{id}/ship не сработал:', putError.message);
                    
                    // Пробуем PATCH
                    try {
                        const response = await this.fetchWithTimeout(`${this.baseURL}/api/shipments/${id}/ship`, {
                            method: 'PATCH',
                            headers: this.getHeaders()
                        });
                        return this.handleResponse(response);
                    } catch (patchError) {
                        console.warn('Все методы для shipShipment не сработали');
                        return null;
                    }
                }
            }
        }
    }

    // ==================== Приходные ордера ====================
    async getReceiptOrders() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/receipts`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getReceiptOrder(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/receipts/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async createReceiptOrder(orderData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/receipts/add`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(orderData)
        });
        return this.handleResponse(response);
    }

    // ==================== График поставок ====================
    async getDeliverySchedule() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/deliverySchedule`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async getDeliveryScheduleEntry(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/deliverySchedule/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async addDeliveryScheduleEntry(entryData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/deliverySchedule/addEntry`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(entryData)
        });
        return this.handleResponse(response);
    }

    // ==================== Статистика ====================
    async getProductStats(productIds) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/productStats`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(productIds)
        });
        return this.handleResponse(response);
    }

    // ==================== Пользователи ====================
    async getUsers() {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/users`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async createUser(userData) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/users/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(userData)
        });
        return this.handleResponse(response);
    }

    async changeUserRole(id, newRole) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/users/${id}/changeRole?newRole=${encodeURIComponent(newRole)}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async deleteUser(id) {
        const response = await this.fetchWithTimeout(`${this.baseURL}/api/users/${id}/delete`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
}

const api = new ApiClient();
