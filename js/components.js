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

let notificationContainer = null;

function getNotificationContainer() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(notificationContainer);
    }
    return notificationContainer;
}

function showNotification(message, type = 'info') {
    const container = getNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
        max-width: 350px;
        word-break: break-word;
        border-left: 4px solid;
        background: var(--bg-secondary, #1a1a1a);
        color: var(--text-primary, #e0e0e0);
        border: 1px solid var(--border-color, #333);
        position: relative;
        cursor: pointer;
    `;
    
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    notification.style.borderLeftColor = colors[type] || colors.info;
    
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.6;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.6';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        removeNotification(notification);
    };
    notification.appendChild(closeBtn);
    
    notification.onclick = (e) => {
        if (e.target !== closeBtn) {
            removeNotification(notification);
        }
    };
    
    container.appendChild(notification);
    
    const timeout = setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    notification.dataset.timeout = timeout;
}

function removeNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    clearTimeout(parseInt(notification.dataset.timeout));
    
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification { transition: all 0.3s ease; }
    .notification:hover { transform: translateX(-5px); box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4); }
`;
document.head.appendChild(style);

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

window.showNotification = showNotification;
window.debounce = debounce;
window.initNavbarBrandClick = initNavbarBrandClick;
window.initThemeToggle = initThemeToggle;
window.applyTheme = applyTheme;
window.modal = modal;
