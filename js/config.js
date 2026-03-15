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
    REQUEST_TIMEOUT: 30000,
    NOTIFICATION_DURATION: 3000,
    
    // Настройки по умолчанию
    DEFAULT_REMEMBER_ME: true,
    
    // Режим отладки
    DEBUG: window.location.hostname === 'localhost'
};

// Для использования в других файлах
window.CONFIG = CONFIG;
