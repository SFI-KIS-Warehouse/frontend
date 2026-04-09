function showAddProviderModal() {
    // Создаём контент модального окна
    const modalContent = {
        title: 'Добавление поставщика',
        body: `
            <form id="addProviderForm">
                <div class="form-group">
                    <label>Наименование *</label>
                    <input type="text" id="providerName" required>
                </div>
                <div class="form-group">
                    <label>ИНН * (10 или 12 цифр)</label>
                    <input type="text" id="providerItn" required placeholder="Только цифры, 10 или 12">
                    <div class="error-message" id="itnError"></div>
                </div>
                <div class="form-group">
                    <label>БИК * (9 цифр)</label>
                    <input type="text" id="providerBic" required placeholder="Только цифры, ровно 9">
                    <div class="error-message" id="bicError"></div>
                </div>
                <div class="form-group">
                    <label>Расчетный счет *</label>
                    <input type="text" id="providerAccount" required>
                </div>
                <div class="form-group">
                    <label>ФИО Директора *</label>
                    <input type="text" id="providerDirector" required>
                </div>
                <div class="form-group">
                    <label>ФИО Бухгалтера *</label>
                    <input type="text" id="providerAccountant" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.hide()">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        `
    };
    
    modal.show(modalContent);

    // Получаем элементы формы
    const form = document.getElementById('addProviderForm');
    const innInput = document.getElementById('providerItn');
    const bicInput = document.getElementById('providerBic');
    const itnError = document.getElementById('itnError');
    const bicError = document.getElementById('bicError');

    // Функция проверки ИНН
    function validateInn(value) {
        const digits = value.replace(/\D/g, '');
        return digits.length === 10 || digits.length === 12;
    }

    // Функция проверки БИК
    function validateBic(value) {
        const digits = value.replace(/\D/g, '');
        return digits.length === 9;
    }

    // Ограничение ввода только цифрами для ИНН
    innInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        // Скрываем ошибку при редактировании
        itnError.style.display = 'none';
        this.classList.remove('error');
    });

    // Ограничение ввода только цифрами для БИК
    bicInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        bicError.style.display = 'none';
        this.classList.remove('error');
    });

    // Обработчик отправки формы
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const innValue = innInput.value.trim();
        const bicValue = bicInput.value.trim();
        
        let hasError = false;

        // Проверка ИНН
        if (!validateInn(innValue)) {
            itnError.textContent = 'ИНН должен содержать 10 или 12 цифр';
            itnError.style.display = 'block';
            innInput.classList.add('error');
            hasError = true;
        }

        // Проверка БИК
        if (!validateBic(bicValue)) {
            bicError.textContent = 'БИК должен содержать ровно 9 цифр';
            bicError.style.display = 'block';
            bicInput.classList.add('error');
            hasError = true;
        }

        if (hasError) {
            showNotification('Проверьте правильность заполнения полей', 'error');
            return;
        }

        // Сбор остальных данных
        const name = document.getElementById('providerName').value.trim();
        const account = document.getElementById('providerAccount').value.trim();
        const director = document.getElementById('providerDirector').value.trim();
        const accountant = document.getElementById('providerAccountant').value.trim();

        if (!name || !account || !director || !accountant) {
            showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        const providerData = {
            name: name,
            itn: parseInt(innValue, 10),
            bic: parseInt(bicValue, 10),
            settlementAccount: account.toString(),
            directorFullName: director,
            accountantFullName: accountant
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        try {
            const id = await api.addProvider(providerData);
            modal.hide();
            await loadProviders();
            showNotification(`Поставщик добавлен с ID: ${id}`, 'success');
        } catch (error) {
            console.error('Add provider error:', error);
            showNotification(error.message || 'Ошибка при добавлении поставщика', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}
