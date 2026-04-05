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

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.hide();
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
        
        const styles = `
            <style id="modalStyles">
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 10px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h3 {
                    margin: 0;
                    color: #333;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #999;
                }
                .modal-close:hover {
                    color: #333;
                }
                .modal-body {
                    padding: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: #555;
                    font-weight: 500;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }
                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                .btn-success {
                    background: #28a745;
                    color: white;
                }
                .btn-danger {
                    background: #dc3545;
                    color: white;
                }
                .btn:hover {
                    opacity: 0.9;
                }
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .status-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-created { background: #fff3cd; color: #856404; }
                .status-approved { background: #d4edda; color: #155724; }
                .status-signed { background: #cce5ff; color: #004085; }
                .status-cancelled { background: #f8d7da; color: #721c24; }
                .status-shipped { background: #d4edda; color: #155724; }
                .product-item {
                    border: 1px solid #eee;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                }
                .product-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .remove-btn {
                    background: none;
                    border: none;
                    color: #dc3545;
                    font-size: 18px;
                    cursor: pointer;
                }
                .add-product-btn {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                }
                .add-product-btn:hover { opacity: 0.9; }
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
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'}; 
        color: white; 
        border-radius: 5px; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); 
        z-index: 2000; 
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, CONFIG.NOTIFICATION_DURATION);
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

window.showNotification = showNotification;
window.debounce = debounce;
window.initNavbarBrandClick = initNavbarBrandClick;
window.modal = modal;
