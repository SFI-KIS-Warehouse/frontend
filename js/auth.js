/**
 * Класс для работы с аутентификацией
 */
class AuthService {
    constructor() {
        this.TOKEN_KEY = 'auth_token';
        this.USER_ROLE_KEY = 'user_role';
    }

    /**
     * Авторизация пользователя
     */
    async login(login, password) {
        try {
            const token = await api.login(login, password);
            
            // Пытаемся декодировать токен для получения роли
            let role = null;
            try {
                const payload = this.decodeToken(token);
                // Определяем роль по payload (зависит от того, что кладет бэкенд в токен)
                if (payload.role) {
                    role = this.mapRole(payload.role);
                }
            } catch (e) {
                console.warn('Could not decode token', e);
            }

            return {
                success: true,
                token: token,
                role: role
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Декодирование JWT токена
     */
    decodeToken(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return payload;
    }

    /**
     * Маппинг роли из бэкенда
     */
    mapRole(backendRole) {
        // В бэкенде есть UserRoles: Director, Manager, Storekeeper
        const roleMap = {
            'Director': 'director',
            'Manager': 'manager',
            'Storekeeper': 'storekeeper'
        };
        return roleMap[backendRole] || 'operator';
    }

    /**
     * Сохранить токен
     */
    saveToken(token, remember = true) {
        if (remember) {
            localStorage.setItem(this.TOKEN_KEY, token);
        } else {
            sessionStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    /**
     * Получить токен
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Удалить токен
     */
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_ROLE_KEY);
        sessionStorage.removeItem(this.USER_ROLE_KEY);
    }

    /**
     * Проверить авторизацию
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Сохранить роль
     */
    saveUserRole(role, remember = true) {
        if (remember) {
            localStorage.setItem(this.USER_ROLE_KEY, role);
        } else {
            sessionStorage.setItem(this.USER_ROLE_KEY, role);
        }
    }

    /**
     * Получить роль
     */
    getUserRole() {
        return localStorage.getItem(this.USER_ROLE_KEY) || sessionStorage.getItem(this.USER_ROLE_KEY);
    }

    /**
     * Перенаправить на страницу выбора роли
     */
    redirectToRoleSelect() {
        window.location.href = '/role-select.html';
    }

    /**
     * Перенаправить на страницу входа
     */
    redirectToLogin() {
        window.location.href = '/login.html';
    }

    /**
     * Перенаправить в соответствующий раздел
     */
    redirectToDashboard() {
        const role = this.getUserRole();
        switch(role) {
            case 'manager':
                window.location.href = '/manager-panel.html';
                break;
            case 'storekeeper':
                window.location.href = '/storekeeper-panel.html';
                break;
            case 'operator':
                window.location.href = '/products-movement.html';
                break;
            default:
                this.redirectToRoleSelect();
        }
    }
}

// Создаем глобальный экземпляр
const authService = new AuthService();
