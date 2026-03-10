/**
 * Скрипт для страницы выбора роли
 */

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем авторизацию
    if (!authService.isAuthenticated()) {
        authService.redirectToLogin();
        return;
    }

    // Если роль уже выбрана, перенаправляем
    const existingRole = authService.getUserRole();
    if (existingRole) {
        authService.redirectToDashboard();
        return;
    }

    const managerCard = document.getElementById('managerCard');
    const operatorCard = document.getElementById('operatorCard');
    const continueBtn = document.getElementById('continueBtn');
    const rememberCheckbox = document.getElementById('rememberRole');
    
    let selectedRole = null;

    /**
     * Сброс выделения всех карточек
     */
    function resetSelection() {
        managerCard.classList.remove('selected');
        operatorCard.classList.remove('selected');
    }

    /**
     * Выбор роли
     * @param {string} role - Выбранная роль
     */
    function selectRole(role) {
        resetSelection();
        
        if (role === 'manager') {
            managerCard.classList.add('selected');
            selectedRole = 'manager';
        } else if (role === 'operator') {
            operatorCard.classList.add('selected');
            selectedRole = 'operator';
        }
        
        continueBtn.disabled = false;
    }

    // Обработчики клика по карточкам
    managerCard.addEventListener('click', () => selectRole('manager'));
    operatorCard.addEventListener('click', () => selectRole('operator'));

    // Обработка продолжения
    continueBtn.addEventListener('click', () => {
        if (selectedRole) {
            const remember = rememberCheckbox.checked;
            authService.saveUserRole(selectedRole, remember);
            authService.redirectToDashboard();
        }
    });

    // Добавляем наведение с клавиатуры для доступности
    managerCard.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectRole('manager');
        }
    });

    operatorCard.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectRole('operator');
        }
    });

    // Делаем карточки фокусируемыми
    managerCard.setAttribute('tabindex', '0');
    operatorCard.setAttribute('tabindex', '0');
});
