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

        this.addModalStyles();

        const closeBtn = container.querySelector('.modal-close');
        const overlay = container.querySelector('.modal-overlay');

        closeBtn.onclick = () => this.hide();
        overlay.onclick = (e) => {
            if (e.target === overlay) this.hide();
        };

        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                this.hide();
                document.removeEventListener('keydown', escapeHandler);
            }
        }.bind(this));
    }

    hide() {
        const container = document.getElementById('modalContainer');
        if (container) {
            container.innerHTML = '';
        }
    }

    addModalStyles() {
        if (document.getElementById('modalStyles')) return;
        
        const isDark = document.body.classList.contains('dark-theme');
        const bgColor = isDark ? '#1a1a1a' : '#ffffff';
        const headerBg = isDark ? '#0a0a0a' : '#f5f5f5';
        const textColor = isDark ? '#e0e0e0' : '#333333';
        const labelColor = isDark ? '#b0b0b0' : '#555555';
        const borderColor = isDark ? '#333333' : '#dddddd';
        const inputBg = isDark ? '#0a0a0a' : '#ffffff';
        
        const styles = `
            <style id="modalStyles">
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(5px);
                }

                .modal-content {
                    background: ${bgColor};
                    border-radius: 5px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
                    border: 1px solid ${borderColor};
                }

                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid ${borderColor};
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: ${headerBg};
                }

                .modal-header h3 {
                    margin: 0;
                    color: ${textColor};
                    font-size: 18px;
                    font-weight: 600;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: ${isDark ? '#666' : '#999'};
                    transition: color 0.3s ease;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-close:hover {
                    color: ${textColor};
                    background: ${isDark ? '#2d2d2d' : '#e0e0e0'};
                    border-radius: 3px;
                }

                .modal-body {
                    padding: 20px;
                    background: ${bgColor};
                }

                .modal-body .form-group {
                    margin-bottom: 15px;
                }

                .modal-body .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: ${labelColor};
                    font-weight: 500;
                    font-size: 14px;
                }

                .modal-body .form-group input,
                .modal-body .form-group select,
                .modal-body .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid ${borderColor};
                    border-radius: 3px;
                    font-size: 14px;
                    background: ${inputBg};
                    color: ${textColor};
                }

                .modal-body .form-group input:focus,
                .modal-body .form-group select:focus,
                .modal-body .form-group textarea:focus {
                    outline: none;
                    border-color: ${isDark ? '#666' : '#667eea'};
                    background: ${isDark ? '#1a1a1a' : '#f8f9fa'};
                }

                .modal-body .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .modal-body .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid ${borderColor};
                }

                .modal-body .product-item {
                    border: 1px solid ${borderColor};
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    background: ${inputBg};
                }

                .modal-body .product-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid ${borderColor};
                }

                .modal-body .product-item-header h4 {
                    color: ${textColor};
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }

                .modal-body .remove-btn {
                    background: none;
                    border: 1px solid #f44336;
                    color: #f44336;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0 8px;
                    border-radius: 3px;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-body .remove-btn:hover {
                    background: #f44336;
                    color: white;
                }

                .modal-body .add-product-btn {
                    background: ${isDark ? '#1a1a1a' : '#28a745'};
                    color: ${isDark ? '#4caf50' : 'white'};
                    border: 1px solid #4caf50;
                    padding: 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                    font-size: 14px;
                    font-weight: 600;
                }

                .modal-body .add-product-btn:hover {
                    background: #4caf50;
                    color: white;
                }

                .modal-body .contract-details {
                    padding: 10px;
                }

                .modal-body .contract-details p {
                    margin: 12px 0;
                    color: ${labelColor};
                    font-size: 15px;
                    line-height: 1.6;
                }

                .modal-body .contract-details h4 {
                    color: ${textColor};
                    margin: 20px 0 15px;
                    font-size: 18px;
                    font-weight: 600;
                }

                .modal-body select.form-control {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid ${borderColor};
                    border-radius: 3px;
                    background: ${inputBg};
                    color: ${textColor};
                    font-size: 14px;
                    margin-top: 10px;
                }

                .modal-body select.form-control:focus {
                    outline: none;
                    border-color: ${isDark ? '#666' : '#667eea'};
                }

                .modal-content::-webkit-scrollbar {
                    width: 8px;
                }

                .modal-content::-webkit-scrollbar-track {
                    background: ${isDark ? '#0a0a0a' : '#f0f0f0'};
                }

                .modal-content::-webkit-scrollbar-thumb {
                    background: ${isDark ? '#333' : '#999'};
                    border-radius: 4px;
                }

                .modal-content::-webkit-scrollbar-thumb:hover {
                    background: ${isDark ? '#555' : '#666'};
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

const modal = new Modal();

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        padding: 15px 20px; 
        background: #1a1a1a; 
        color: white; 
        border-radius: 5px; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.8); 
        z-index: 2000; 
        animation: slideIn 0.3s ease;
        border: 1px solid #333;
        border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#9e9e9e'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, typeof CONFIG !== 'undefined' ? CONFIG.NOTIFICATION_DURATION : 3000);
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

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}

function applyTheme(theme) {
    const themeToggle = document.getElementById('themeToggle');
    
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (themeToggle) {
            themeToggle.textContent = '🌙';
            themeToggle.title = 'Переключить на тёмную тему';
        }
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        if (themeToggle) {
            themeToggle.textContent = '☀️';
            themeToggle.title = 'Переключить на светлую тему';
        }
        localStorage.setItem('theme', 'dark');
    }
    
    document.getElementById('modalStyles')?.remove();
}

window.showNotification = showNotification;
window.debounce = debounce;
window.initNavbarBrandClick = initNavbarBrandClick;
window.initThemeToggle = initThemeToggle;
window.applyTheme = applyTheme;
window.modal = modal;
