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
            
            // Пытаемся декодировать токен для получения информации
            let userData = null;
            try {
                userData = this.decodeToken(token);
                if (CONFIG.DEBUG) {
                    console.log('Token decoded:', userData);
                }
            } catch (e) {
                console.warn('Could not decode token', e);
            }

            return {
                success: true,
                token: token,
                userData: userData
            };
        } catch (error) {
            console.error('Login error:', error);
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
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            return payload;
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
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
     * Удалить токен (выход)
     */
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_ROLE_KEY);
        sessionStorage.removeItem(this.USER_ROLE_KEY);
    }

    /**
     * Проверить, авторизован ли пользователь
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Сохранить роль пользователя
     */
    saveUserRole(role, remember = true) {
        if (remember) {
            localStorage.setItem(this.USER_ROLE_KEY, role);
        } else {
            sessionStorage.setItem(this.USER_ROLE_KEY, role);
        }
    }

    /**
     * Получить роль пользователя
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
     * Перенаправить в соответствующий раздел на основе роли
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

    /**
     * Получить информацию о пользователе из токена
     */
    getUserInfo() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            return this.decodeToken(token);
        } catch {
            return null;
        }
    }
}

// Создаем глобальный экземпляр
const authService = new AuthService();
