/**
 * Конфигурация приложения для HTTP
 */
const CONFIG = {
    // API бэкенда (HTTP!)
    API_URL: 'http://91.209.135.123',
    
    // Настройки приложения
    APP_NAME: 'Aboba Warehouse',
    APP_VERSION: '1.0.0',
    
    // Таймауты
    REQUEST_TIMEOUT: 30000,
    NOTIFICATION_DURATION: 3000,
    
    // Настройки по умолчанию
    DEFAULT_REMEMBER_ME: true,
    DEFAULT_PAGE_SIZE: 20,
    
    // Режим отладки
    DEBUG: true,
    
    // Статусы договоров
    CONTRACT_STATUSES: {
        0: { name: 'Создан', class: 'created' },
        1: { name: 'Утверждён', class: 'approved' },
        2: { name: 'Подписан', class: 'signed' },
        3: { name: 'Аннулирован', class: 'cancelled' }
    },
    
    // Статусы отгрузок
    SHIPMENT_STATUSES: {
        0: { name: 'Создан', class: 'created' },
        1: { name: 'Отгружен', class: 'shipped' }
    }
};

window.CONFIG = CONFIG;
