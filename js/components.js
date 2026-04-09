/**
 * Компоненты для модальных окон и форм
 */
class Modal {
    constructor() {
        this.modal = null;
        this.createModalContainer();
    }

    createModalContainer() {
        if (!document.getElementById('modalContainer')) {
            const container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
        }
    }

    show(content) {
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${content.title || ''}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content.body || ''}
                    </div>
                </div>
            </div>
        `;
        
        const container = document.getElementById('modalContainer');
        container.innerHTML = modalHtml;

        const closeBtn = container.querySelector('.modal-close');
        const overlay = container.querySelector('.modal-overlay');

        closeBtn.onclick = () => this.hide();
        overlay.onclick = (e) => {
            if (e.target === overlay) this.hide();
        };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
        }, { once: true });
    }

    hide() {
        const container = document.getElementById('modalContainer');
        if (container) container.innerHTML = '';
    }
}

const modal = new Modal();

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initNavbarBrandClick() {
    const navbarBrand = document.querySelector('.navbar-brand');
    if (navbarBrand) {
        navbarBrand.addEventListener('click', () => {
            if (typeof authService.resetRole === 'function') {
                authService.resetRole();
            }
            authService.redirectToRoleSelect();
        });
        navbarBrand.title = 'Нажмите для выбора роли';
        navbarBrand.style.cursor = 'pointer';
    }
}

// ---------- Тема ----------
function applyTheme(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        if (themeToggle) {
            themeToggle.textContent = '🌙';
            themeToggle.title = 'Переключить на тёмную тему';
        }
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.add('dark-theme');
        if (themeToggle) {
            themeToggle.textContent = '☀️';
            themeToggle.title = 'Переключить на светлую тему';
        }
        localStorage.setItem('theme', 'dark');
    }
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        applyTheme(isDark ? 'light' : 'dark');
    });
}

// Экспорт
window.showNotification = showNotification;
window.debounce = debounce;
window.initNavbarBrandClick = initNavbarBrandClick;
window.initThemeToggle = initThemeToggle;
window.applyTheme = applyTheme;
window.modal = modal;
