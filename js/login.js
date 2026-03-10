/**
 * Скрипт для страницы авторизации
 */

document.addEventListener('DOMContentLoaded', () => {
    // Если уже авторизован, перенаправляем на главную
    if (authService.isAuthenticated()) {
        authService.redirectToDashboard();
        return;
    }

    // Получаем элементы формы
    const form = document.getElementById('loginForm');
    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const alert = document.getElementById('alert');
    const alertMessage = document.getElementById('alertMessage');
    
    const loginError = document.getElementById('loginError');
    const passwordError = document.getElementById('passwordError');
    const rememberCheckbox = document.getElementById('rememberMe');

    /**
     * Показать сообщение
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип сообщения (error/success)
     */
    function showMessage(message, type = 'error') {
        alert.className = `alert alert-${type} show`;
        alertMessage.textContent = message;
        
        setTimeout(() => {
            alert.classList.remove('show');
        }, 5000);
    }

    /**
     * Очистить ошибки полей
     */
    function clearFieldErrors() {
        loginInput.classList.remove('error');
        passwordInput.classList.remove('error');
        loginError.textContent = '';
        loginError.classList.remove('show');
        passwordError.textContent = '';
        passwordError.classList.remove('show');
    }

    /**
     * Установить состояние загрузки
     * @param {boolean} loading
     */
    function setLoading(loading) {
        if (loading) {
            loginButton.classList.add('loading');
            loginButton.disabled = true;
        } else {
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
        }
    }

    /**
     * Валидация полей в реальном времени
     */
    loginInput.addEventListener('input', () => {
        const error = FormValidator.validateLogin(loginInput.value);
        if (error) {
            loginInput.classList.add('error');
            loginError.textContent = error;
            loginError.classList.add('show');
        } else {
            loginInput.classList.remove('error');
            loginError.classList.remove('show');
        }
    });

    passwordInput.addEventListener('input', () => {
        const error = FormValidator.validatePassword(passwordInput.value);
        if (error) {
            passwordInput.classList.add('error');
            passwordError.textContent = error;
            passwordError.classList.add('show');
        } else {
            passwordInput.classList.remove('error');
            passwordError.classList.remove('show');
        }
    });

    /**
     * Обработка отправки формы
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        clearFieldErrors();

        const login = loginInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox ? rememberCheckbox.checked : true;

        // Валидация
        const loginErrorText = FormValidator.validateLogin(login);
        const passwordErrorText = FormValidator.validatePassword(password);

        if (loginErrorText || passwordErrorText) {
            if (loginErrorText) {
                loginInput.classList.add('error');
                loginError.textContent = loginErrorText;
                loginError.classList.add('show');
            }
            if (passwordErrorText) {
                passwordInput.classList.add('error');
                passwordError.textContent = passwordErrorText;
                passwordError.classList.add('show');
            }
            return;
        }

        setLoading(true);

        try {
            const result = await authService.login(login, password);

            if (result.success) {
                authService.saveToken(result.token, remember);
                
                showMessage('Успешный вход! Перенаправление...', 'success');
                
                setTimeout(() => {
                    authService.redirectToDashboard();
                }, 1000);
            } else {
                showMessage(result.error || 'Ошибка авторизации');
                setLoading(false);
            }
        } catch (error) {
            showMessage('Произошла непредвиденная ошибка');
            setLoading(false);
        }
    });

    // Добавляем тестовые данные для демо
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        loginInput.value = 'admin';
        passwordInput.value = 'admin';
    }
});
