/**
 * Скрипт для страницы выбора роли
 */
document.addEventListener('DOMContentLoaded', () => {
    if (!authService.isAuthenticated()) {
        authService.redirectToLogin();
        return;
    }
    
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

    function resetSelection() {
        [managerCard, operatorCard].forEach(card => {
            if (card) card.classList.remove('selected');
        });
    }

    function selectRole(role) {
        resetSelection();
        
        const cardMap = {
            'manager': managerCard,
            'operator': operatorCard
        };
        
        const card = cardMap[role];
        if (card) {
            card.classList.add('selected');
            selectedRole = role;
            continueBtn.disabled = false;
        }
    }

    if (managerCard) {
        managerCard.addEventListener('click', () => selectRole('manager'));
        managerCard.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectRole('manager');
            }
        });
    }

    if (operatorCard) {
        operatorCard.addEventListener('click', () => selectRole('operator'));
        operatorCard.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectRole('operator');
            }
        });
    }

    continueBtn.addEventListener('click', () => {
        if (selectedRole) {
            const remember = rememberCheckbox.checked;
            authService.saveUserRole(selectedRole, remember);
            authService.redirectToDashboard();
        }
    });

    [managerCard, operatorCard].forEach(card => {
        if (card) card.setAttribute('tabindex', '0');
    });
});
