/**
 * Класс для работы с аутентификацией
 */
class AuthService {
    constructor() {
        this.TOKEN_KEY = 'auth_token';
        this.USER_ROLE_KEY = 'user_role';
    }

    async login(login, password) {
        try {
            const token = await api.login(login, password);
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

    saveToken(token, remember = true) {
        if (remember) {
            localStorage.setItem(this.TOKEN_KEY, token);
        } else {
            sessionStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_ROLE_KEY);
        sessionStorage.removeItem(this.USER_ROLE_KEY);
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    saveUserRole(role, remember = true) {
        if (remember) {
            localStorage.setItem(this.USER_ROLE_KEY, role);
        } else {
            sessionStorage.setItem(this.USER_ROLE_KEY, role);
        }
    }

    getUserRole() {
        return localStorage.getItem(this.USER_ROLE_KEY) || sessionStorage.getItem(this.USER_ROLE_KEY);
    }

    resetRole() {
        localStorage.removeItem(this.USER_ROLE_KEY);
        sessionStorage.removeItem(this.USER_ROLE_KEY);
        console.log('Role reset successfully');
    }

    redirectToRoleSelect() {
        window.location.href = 'role-select.html';
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    redirectToDashboard() {
        const role = this.getUserRole();
        switch(role) {
            case 'manager':
                window.location.href = 'manager-panel.html';
                break;
            case 'operator':
                window.location.href = 'products-movement.html';
                break;
            case 'storekeeper':
                window.location.href = 'storekeeper-panel.html';
                break;
            default:
                this.redirectToRoleSelect();
        }
    }

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

const authService = new AuthService();
