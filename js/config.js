/**
 * Конфигурация приложения
 */
const CONFIG = {
    // API бэкенда (HTTPS!)
    API_URL: 'https://91.209.135.123',
    
    // Настройки приложения
    APP_NAME: 'Aboba Warehouse',
    APP_VERSION: '1.0.0',
    
    // Таймауты
    REQUEST_TIMEOUT: 30000, // 30 секунд
    NOTIFICATION_DURATION: 3000, // 3 секунды
    
    // Настройки по умолчанию
    DEFAULT_REMEMBER_ME: true,
    DEFAULT_PAGE_SIZE: 20,
    
    // Режим отладки (автоматически определяется)
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
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
    },
    
    // Роли пользователей
    USER_ROLES: {
        0: 'Director',
        1: 'Manager', 
        2: 'Storekeeper'
    }
};

// Для использования в других файлах
window.CONFIG = CONFIG;
