/**
 * Компоненты для модальных окон и форм
 */
class Modal {
    constructor() {
        this.modal = null;
        this.createModalContainer();
    }

    createModalContainer() {
        // Создаем контейнер для модального окна, если его нет
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

        // Добавляем стили
        this.addModalStyles();

        // Обработчики закрытия
        const closeBtn = container.querySelector('.modal-close');
        const overlay = container.querySelector('.modal-overlay');

        closeBtn.onclick = () => this.hide();
        overlay.onclick = (e) => {
            if (e.target === overlay) this.hide();
        };
    }

    hide() {
        const container = document.getElementById('modalContainer');
        container.innerHTML = '';
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
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .status-created {
                    background: #fff3cd;
                    color: #856404;
                }

                .status-approved {
                    background: #d4edda;
                    color: #155724;
                }

                .status-signed {
                    background: #cce5ff;
                    color: #004085;
                }

                .status-cancelled {
                    background: #f8d7da;
                    color: #721c24;
                }

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

                .add-product-btn:hover {
                    opacity: 0.9;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Глобальный экземпляр модального окна
const modal = new Modal();
