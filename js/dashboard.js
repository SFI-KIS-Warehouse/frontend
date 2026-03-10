/**
 * Скрипт для главной страницы
 */

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем авторизацию
    if (!authService.isAuthenticated()) {
        authService.redirectToLogin();
        return;
    }

    // Отображаем токен
    const token = authService.getToken();
    const tokenDisplay = document.getElementById('tokenDisplay');
    if (tokenDisplay) {
        tokenDisplay.textContent = token;
    }

    // Получаем информацию о пользователе (можно добавить декодирование JWT)
    updateUserInfo();

    // Обработка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Загружаем данные для дашборда
    loadDashboardData();
});

/**
 * Обновление информации о пользователе
 */
function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (!userNameElement) return;

    try {
        const token = authService.getToken();
        if (token) {
            // Декодируем JWT (без проверки подписи)
            const base64Url = token.split('.')[1];
            if (base64Url) {
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(atob(base64));
                userNameElement.textContent = payload.name || payload.sub || 'Пользователь';
                return;
            }
        }
    } catch (e) {
        console.error('Error decoding token:', e);
    }
    
    userNameElement.textContent = 'Пользователь';
}

/**
 * Обработка выхода
 */
function handleLogout() {
    authService.logout();
    authService.redirectToLogin();
}

/**
 * Загрузка данных для дашборда
 */
async function loadDashboardData() {
    try {
        // Здесь можно добавить загрузку статистики
        // const stats = await fetchDashboardStats();
        // updateDashboardStats(stats);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Обновление статистики на дашборде
 */
function updateDashboardStats(stats) {
    // TODO: Обновить статистику на странице
}
