document.addEventListener('DOMContentLoaded', () => {
    if (authService.isAuthenticated()) {
        authService.redirectToDashboard();
        return;
    }
    
    initThemeToggle();

    const loginForm = document.getElementById('loginForm');
    const alertDiv = document.getElementById('alert');
    const loginButton = loginForm.querySelector('button[type="submit"]');
    const spinner = loginButton.querySelector('.spinner');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const login = document.getElementById('login').value;
        const password = document.getElementById('password').value;

        loginButton.disabled = true;
        spinner.style.display = 'block';
        loginButton.textContent = '';
        spinner.style.display = 'inline-block';

        const result = await authService.login(login, password);

        if (result.success) {
            authService.saveToken(result.token);
            authService.redirectToRoleSelect();
        } else {
            showAlert(result.error, 'error');
            loginButton.disabled = false;
            spinner.style.display = 'none';
            loginButton.textContent = 'Войти';
        }
    });

    function showAlert(message, type) {
        alertDiv.textContent = message;
        alertDiv.className = `alert alert-${type} show`;
        setTimeout(() => {
            alertDiv.classList.remove('show');
        }, 3000);
    }
});
