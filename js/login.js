/**
 * Скрипт для страницы авторизации
 */

document.addEventListener('DOMContentLoaded', () => {
    // Если уже авторизован, перенаправляем на выбор роли
    if (authService.isAuthenticated()) {
        authService.redirectToRoleSelect();
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
     */
    function showMessage(message, type = 'error') {
        alert.className = `alert alert-${type} show`;
        alertMessage.textContent = message;
        
        setTimeout(() => {
            alert.classList.remove('show');
        }, CONFIG.NOTIFICATION_DURATION);
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
     * Валидация полей
     */
    function validateLogin(value) {
        if (!value || value.trim().length === 0) {
            return 'Логин не может быть пустым';
        }
        if (value.length < 3) {
            return 'Логин должен содержать минимум 3 символа';
        }
        return '';
    }

    function validatePassword(value) {
        if (!value || value.length === 0) {
            return 'Пароль не может быть пустым';
        }
        if (value.length < 3) {
            return 'Пароль должен содержать минимум 3 символа';
        }
        return '';
    }

    // Валидация в реальном времени
    loginInput.addEventListener('input', () => {
        const error = validateLogin(loginInput.value);
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
        const error = validatePassword(passwordInput.value);
        if (error) {
            passwordInput.classList.add('error');
            passwordError.textContent = error;
            passwordError.classList.add('show');
        } else {
            passwordInput.classList.remove('error');
            passwordError.classList.remove('show');
        }
    });

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        clearFieldErrors();

        const login = loginInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox ? rememberCheckbox.checked : true;

        // Валидация
        const loginErrorText = validateLogin(login);
        const passwordErrorText = validatePassword(password);

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
                    authService.redirectToRoleSelect();
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

    // Добавляем тестовые данные для демо в режиме отладки
    if (CONFIG.DEBUG) {
        loginInput.value = 'admin';
        passwordInput.value = 'admin';
    }
});
