// М-Admin - Жүйе басқаруы JavaScript


document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-scroll]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-scroll');
            const target = document.getElementById(targetId);

            if (!target) {
                console.warn('Scroll target not found:', targetId);
                return;
            }

            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
});


class ProcessController {
    constructor() {
        this.inputs = {
            x1: 240,    // Шикізат шығыны
            x2: 0.9,    // Шикізат тығыздығы
            x3: 210,    // Шикізат температурасы
            x4: 518,    // Реактор температурасы
            x5: 2.2,    // Реактор қысымы
            x6: 16.5,   // Катализатор шығыны
            y1: 48,     // Бензин шығымы (инпут)
            y2: 0.7     // Бензин тығыздығы (инпут)
        };
        
        this.isEmergency = false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.mlServerStatus = 'checking'; // 'online', 'offline', 'checking'
        this.mlStatusCheckInterval = null;
        
        // Графиктер
        this.charts = {};
        this.currentPeriod = '24h';
        
        this.init();
    }
    
    // API жауабын тексеру және 401 қатесін өңдеу
    checkAuthError(response) {
        if (response.status === 401) {
            window.location.href = '/login';
            return true;
        }
        return false;
    }
    
    // Fuzzy-диапазондарды анықтау
    getFuzzyRanges() {
        return {
            x1: {
                L: [180, 200],
                BA: [200, 219],
                A: [220, 245],
                AA: [246, 250],
                H: [255, 300]
            },
            x2: {
                L: [0.70, 0.74],
                BA: [0.75, 0.80],
                A: [0.85, 0.90],
                AA: [0.91, 0.98],
                H: [0.99, 1.00]
            },
            x3: {
                L: [180, 200],
                BA: [200, 210],
                A: [220, 240],
                AA: [250, 260],
                H: [270, 280]
            },
            x4: {
                L: [490, 499],
                BA: [500, 515],
                A: [518, 523],
                AA: [550, 570],
                H: [570, 600]
            },
            x5: {
                L: [1.4, 1.5],
                BA: [1.6, 1.8],
                A: [1.98, 2.3],
                AA: [2.5, 2.7],
                H: [2.8, 3.5]
            },
            x6: {
                L: [11.5, 12],
                BA: [12.5, 13],
                A: [14, 15],
                AA: [15, 16],
                H: [16.5, 17]
            },
            y1: {
                L: [45, 47],
                BA: [48, 49],
                A: [50, 52],
                AA: [53, 54],
                H: [55, 56]
            },
            y2: {
                L: [0.70, 0.71],
                BA: [0.72, 0.73],
                A: [0.74, 0.75],
                AA: [0.76, 0.77],
                H: [0.78, 0.79]
            }
        };
    }
    
    // Мәннің диапазонда екенін тексеру
    isValueInRange(value, ranges) {
        for (const [level, range] of Object.entries(ranges)) {
            if (value >= range[0] && value <= range[1]) {
                return { valid: true, level };
            }
        }
        return { valid: false, level: null };
    }
    
    // Параметрді валидациялау
    validateParameter(paramName, value) {
        const ranges = this.getFuzzyRanges();
        const paramRanges = ranges[paramName];
        
        if (!paramRanges) {
            return { valid: true, level: null, message: null };
        }
        
        const result = this.isValueInRange(value, paramRanges);
        
        if (!result.valid) {
            // Диапазоннан тыс - қате
            const minRange = Math.min(...Object.values(paramRanges).map(r => r[0]));
            const maxRange = Math.max(...Object.values(paramRanges).map(r => r[1]));
            const paramNames = {
                x1: 'Шикізат шығыны (x1)',
                x2: 'Шикізат тығыздығы (x2)',
                x3: 'Шикізат температурасы (x3)',
                x4: 'Реактор температурасы (x4)',
                x5: 'Реактор қысымы (x5)',
                x6: 'Катализатор шығыны (x6)',
                y1: 'Бензин шығымы (y1)',
                y2: 'Бензин тығыздығы (y2)'
            };
            return {
                valid: false,
                level: null,
                message: `${paramNames[paramName]} мәні диапазоннан тыс! Рұқсат етілген диапазон: ${minRange} - ${maxRange}`
            };
        }
        
        return {
            valid: true,
            level: result.level,
            message: null
        };
    }
    
    // Инпут өрісін валидациялау және визуалды көрсету
    validateInputField(inputId, value) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const validation = this.validateParameter(inputId, value);
        const inputGroup = input.closest('.input-group');
        
        // Ескі қате хабарламаларды жою
        const existingError = inputGroup?.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Ескі стильдерді жою
        if (inputGroup) {
            inputGroup.classList.remove('has-error', 'has-warning');
        }
        input.classList.remove('error-input');
        
        if (!validation.valid) {
            // Қате хабарлама көрсету
            if (inputGroup) {
                inputGroup.classList.add('has-error');
                input.classList.add('error-input');
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'validation-error';
                errorDiv.textContent = validation.message;
                inputGroup.appendChild(errorDiv);
            }
            
            return false;
        }
        
        return true;
    }
    
    init() {
        this.bindEvents();
        this.updateIndicators();
        this.updateReactorDisplay();
        this.addNotification('Жүйе іске қосылды', 'success');
        this.loadUserInfo();
        this.loadData();
        this.checkMLServerStatus();
        // Графиктерді инициализациялау
        this.initCharts();
        this.loadChartData();
        // 5 секунд сайын ML сервердің статусын тексеру
        this.mlStatusCheckInterval = setInterval(() => {
            this.checkMLServerStatus();
        }, 5000);
    }
    
    async loadUserInfo() {
        try {
            const response = await fetch('/auth/me', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success && data.user) {
                document.getElementById('usernameDisplay').textContent = data.user.username;
                const roleNames = {
                    'admin': 'Админ',
                    'engineer-technologist': 'Инженер-технолог',
                    'operator': 'Оператор'
                };
                document.getElementById('userRole').textContent = roleNames[data.user.role] || data.user.role;
            }
        } catch (error) {
            console.error('User info load error:', error);
        }
    }
    
    async checkMLServerStatus() {
        try {
            // Timeout үшін AbortController қолдану
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('/api/ml/health', {
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (this.checkAuthError(response)) return;
            
            const data = await response.json();
            
            if (data.status === 'ok') {
                this.updateMLServerStatus('online', 'Істеп тұр', data.models_loaded, data.reverse_model_loaded);
            } else {
                this.updateMLServerStatus('offline', 'Істемейді', false, false);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('ML сервер статусын тексеру уақыт асып кетті');
            } else {
                console.error('ML сервер статусын тексеру қатесі:', error);
            }
            this.updateMLServerStatus('offline', 'Істемейді', false, false);
        }
    }
    
    updateMLServerStatus(status, text, forwardModelLoaded, reverseModelLoaded) {
        this.mlServerStatus = status;
        
        const indicator = document.getElementById('mlStatusIndicator');
        const statusText = document.getElementById('mlStatusText');
        const statusContainer = document.getElementById('mlServerStatus');
        
        if (!indicator || !statusText || !statusContainer) return;
        
        // Кластарды тазалау
        indicator.classList.remove('status-online', 'status-offline', 'status-checking');
        
        // Статус бойынша класс қосу
        if (status === 'online') {
            indicator.classList.add('status-online');
            statusContainer.style.borderColor = 'rgba(78, 205, 196, 0.5)';
            statusContainer.style.background = 'rgba(78, 205, 196, 0.15)';
            
            let modelInfo = '';
            if (forwardModelLoaded && reverseModelLoaded) {
                modelInfo = ' (Барлық модельдер)';
            } else if (forwardModelLoaded) {
                modelInfo = ' (Тек forward модель)';
            } else {
                modelInfo = ' (Модельдер жоқ)';
            }
            
            statusText.textContent = text + modelInfo;
        } else if (status === 'offline') {
            indicator.classList.add('status-offline');
            statusContainer.style.borderColor = 'rgba(255, 107, 107, 0.5)';
            statusContainer.style.background = 'rgba(255, 107, 107, 0.15)';
            statusText.textContent = text;
        } else {
            indicator.classList.add('status-checking');
            statusContainer.style.borderColor = 'rgba(255, 165, 2, 0.5)';
            statusContainer.style.background = 'rgba(255, 165, 2, 0.15)';
            statusText.textContent = text;
        }
    }
    
    bindEvents() {
        // Инпут өзгерістерін тыңдау
        const inputIds = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'y1', 'y2'];
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value) || 0;
                    this.inputs[id] = value;
                    
                    // Валидация
                    this.validateInputField(id, value);
                    
                    this.updateIndicators();
                    this.updateReactorDisplay();
                });
                
                // Blur кезінде де валидация (мән енгізілгеннен кейін)
                input.addEventListener('blur', (e) => {
                    const value = parseFloat(e.target.value) || 0;
                    this.validateInputField(id, value);
                });
            }
        });
        
        // Түймелер
        document.getElementById('calculateBtn')?.addEventListener('click', () => {
            this.saveData(); // Деректерді сақтау
        });
        
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.resetInputs();
        });
        
        document.getElementById('emergencyBtn')?.addEventListener('click', () => {
            this.emergencyStop();
        });
        
        // ML түймелері
        document.getElementById('predictBtn')?.addEventListener('click', () => {
            this.sendToModelService();
        });
        
        document.getElementById('reversePredictBtn')?.addEventListener('click', () => {
            this.reversePredictFromTarget();
        });
        
        document.getElementById('optimizeBtn')?.addEventListener('click', () => {
            this.optimizeForTarget();
        });
        
        document.getElementById('featureImportanceBtn')?.addEventListener('click', () => {
            this.showFeatureImportance();
        });
        
        document.getElementById('modelInfoBtn')?.addEventListener('click', () => {
            this.showModelInfo();
        });
        
        // Модалды терезе түймелері
        document.getElementById('closeModelInfoModal')?.addEventListener('click', () => {
            this.closeModelInfoModal();
        });
        
        document.getElementById('closeModelInfoBtn')?.addEventListener('click', () => {
            this.closeModelInfoModal();
        });
        
        document.getElementById('copyModelInfoBtn')?.addEventListener('click', () => {
            this.copyModelInfo();
        });
        
        // Модалды терезенің сыртын басқанда жабу
        document.getElementById('modelInfoModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'modelInfoModal') {
                this.closeModelInfoModal();
            }
        });
        
        // Кесте түймелері
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });
        
        document.getElementById('clearAllBtn')?.addEventListener('click', () => {
            this.clearAllData();
        });
        
        // Шығу түймесі
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
        
        // Excel файл жүктеу
        document.getElementById('uploadExcelBtn')?.addEventListener('click', () => {
            document.getElementById('excelFileInput').click();
        });
        
        document.getElementById('excelFileInput')?.addEventListener('change', (e) => {
            this.uploadExcelFile(e.target.files[0]);
        });
        
        // Графиктер түймелері
        document.getElementById('periodSelect')?.addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.loadChartData();
        });
        
        document.getElementById('refreshChartsBtn')?.addEventListener('click', () => {
            this.loadChartData();
        });
        
    }
    
    async logout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }
    
    updateIndicators() {
        // Жоғарғы панельдегі индикаторларды жаңарту
        document.getElementById('rawMaterialFlow').textContent = this.inputs.x1.toFixed(1);
        document.getElementById('rawMaterialDensity').textContent = this.inputs.x2.toFixed(3);
        document.getElementById('rawMaterialTemp').textContent = this.inputs.x3.toFixed(1);
        document.getElementById('reactorTemp').textContent = this.inputs.x4.toFixed(1);
        document.getElementById('reactorPressure').textContent = this.inputs.x5.toFixed(2);
        document.getElementById('catalystFlow').textContent = this.inputs.x6.toFixed(1);
        
        // Түсті көрсеткіштер
        this.updateTemperatureIndicators();
        this.updatePressureIndicators();
    }
    
    updateTemperatureIndicators() {
        const rawTempCard = document.querySelector('.indicator-card.temperature');
        const reactorTempCards = document.querySelectorAll('.indicator-card.temperature');
        const reactorTempCard = reactorTempCards.length > 1 ? reactorTempCards[1] : null;
        
        // Шикізат температурасы
        if (rawTempCard) {
            const valueDisplay = rawTempCard.querySelector('.value-display');
            if (this.inputs.x3 < 190) {
                rawTempCard.style.borderColor = '#ff6b6b';
                if (valueDisplay) valueDisplay.style.color = '#ff6b6b';
            } else if (this.inputs.x3 > 240) {
                rawTempCard.style.borderColor = '#ff6b6b';
                if (valueDisplay) valueDisplay.style.color = '#ff6b6b';
            } else {
                rawTempCard.style.borderColor = '#4ecdc4';
                if (valueDisplay) valueDisplay.style.color = '#4ecdc4';
            }
        }
        
        // Реактор температурасы
        if (reactorTempCard) {
            const valueDisplay = reactorTempCard.querySelector('.value-display');
            if (this.inputs.x4 < 450) {
                reactorTempCard.style.borderColor = '#ff6b6b';
                if (valueDisplay) valueDisplay.style.color = '#ff6b6b';
            } else if (this.inputs.x4 > 570) {
                reactorTempCard.style.borderColor = '#ff6b6b';
                if (valueDisplay) valueDisplay.style.color = '#ff6b6b';
            } else {
                reactorTempCard.style.borderColor = '#4ecdc4';
                if (valueDisplay) valueDisplay.style.color = '#4ecdc4';
            }
        }
    }
    
    updatePressureIndicators() {
        const pressureCard = document.querySelector('.indicator-card.pressure');
        
        if (pressureCard) {
            const valueDisplay = pressureCard.querySelector('.value-display');
            if (this.inputs.x5 < 1.5) {
                pressureCard.style.borderColor = '#ff6b6b';
                if (valueDisplay) valueDisplay.style.color = '#ff6b6b';
            } else if (this.inputs.x5 > 3.0) {
                pressureCard.style.borderColor = '#ff6b6b';
                if (valueDisplay) valueDisplay.style.color = '#ff6b6b';
            } else {
                pressureCard.style.borderColor = '#4ecdc4';
                if (valueDisplay) valueDisplay.style.color = '#4ecdc4';
            }
        }
    }
    
    updateReactorDisplay() {
        // Реактордағы температура мен қысымды көрсету
        const reactorTempDisplay = document.getElementById('reactorTempDisplay');
        const reactorPressureDisplay = document.getElementById('reactorPressureDisplay');
        
        if (reactorTempDisplay) {
            reactorTempDisplay.textContent = `${this.inputs.x4.toFixed(1)}°С`;
        }
        if (reactorPressureDisplay) {
            reactorPressureDisplay.textContent = `${this.inputs.x5.toFixed(2)} кгс/см²`;
        }
        
        // Реактор түсін өзгерту
        const reactor = document.getElementById('reactor');
        if (reactor) {
            if (this.inputs.x4 > 570 || this.inputs.x5 > 3.0) {
                reactor.style.background = 'linear-gradient(45deg, #ff4757, #ff6b6b)';
                reactor.style.boxShadow = '0 0 40px rgba(255, 71, 87, 0.8)';
            } else if (this.inputs.x4 < 450 || this.inputs.x5 < 1.5) {
                reactor.style.background = 'linear-gradient(45deg, #ffa502, #ffb142)';
                reactor.style.boxShadow = '0 0 30px rgba(255, 165, 2, 0.6)';
            } else {
                reactor.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
                reactor.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.5)';
            }
        }
    }
    
    async saveData() {
        if (this.isEmergency) {
            this.addNotification('Авариялық режимде деректерді сақтау мүмкін емес!', 'error');
            return;
        }
        
        // Барлық параметрлерді валидациялау
        const inputIds = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'y1', 'y2'];
        let hasErrors = false;
        const errorMessages = [];
        
        for (const id of inputIds) {
            const validation = this.validateParameter(id, this.inputs[id]);
            if (!validation.valid) {
                hasErrors = true;
                errorMessages.push(validation.message);
                this.validateInputField(id, this.inputs[id]);
            }
        }
        
        if (hasErrors) {
            this.addNotification(`Деректерді сақтау мүмкін емес! Диапазоннан тыс мәндер бар:\n${errorMessages.join('\n')}`, 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/process-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    x1: this.inputs.x1,
                    x2: this.inputs.x2,
                    x3: this.inputs.x3,
                    x4: this.inputs.x4,
                    x5: this.inputs.x5,
                    x6: this.inputs.x6,
                    y1: this.inputs.y1,
                    y2: this.inputs.y2
                })
            });
            
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.addNotification('Деректер сәтті сақталды!', 'success');
                console.log('Сақталған деректер:', result.data);
                this.loadData(); // Кестені жаңарту
                this.loadChartData(); // Графиктерді жаңарту
            } else {
                this.addNotification(`Қате: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('API қатесі:', error);
            this.addNotification('Деректерді сақтау кезінде қате пайда болды', 'error');
        }
    }
    
    async loadData(page = 1) {
        try {
            const response = await fetch(`/api/process-data?page=${page}&limit=10`, {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.currentPage = result.pagination.page;
                this.totalPages = result.pagination.totalPages;
                this.renderTable(result.data);
                this.renderPagination();
            } else {
                this.addNotification(`Қате: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('API қатесі:', error);
            this.addNotification('Деректерді жүктеу кезінде қате пайда болды', 'error');
        }
    }
    
    renderTable(data) {
        const tbody = document.getElementById('dataTableBody');
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="no-data">Деректер жоқ</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${parseFloat(item.x1).toFixed(1)}</td>
                <td>${parseFloat(item.x2).toFixed(3)}</td>
                <td>${parseFloat(item.x3).toFixed(1)}</td>
                <td>${parseFloat(item.x4).toFixed(1)}</td>
                <td>${parseFloat(item.x5).toFixed(2)}</td>
                <td>${parseFloat(item.x6).toFixed(1)}</td>
                <td>${parseFloat(item.y1).toFixed(2)}</td>
                <td>${parseFloat(item.y2).toFixed(3)}</td>
                <td>${new Date(item.createdAt).toLocaleString('kk-KZ')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-action="edit" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Event listener-ларды қосу
        tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                if (id) {
                    this.editData(id);
                }
            });
        });
        
        tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                if (id) {
                    this.deleteData(id);
                }
            });
        });
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Алдыңғы бет
        paginationHTML += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Бет нөмірлері
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span>...</span>';
            }
        }
        
        // Келесі бет
        paginationHTML += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        pagination.innerHTML = paginationHTML;
        
        // Пагинация түймелеріне event listener-лар қосу
        pagination.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('button') || e.target;
                const page = parseInt(target.getAttribute('data-page'));
                if (page && !target.disabled) {
                    this.loadData(page);
                }
            });
        });
    }
    
    
    async editData(id) {
        try {
            const response = await fetch(`/api/process-data/${id}`, {
                credentials: 'include'
            });
            
            if (this.checkAuthError(response)) return;
            
            const result = await response.json();
            
            if (result.success) {
                // Инпуттарды толтыру
                Object.keys(this.inputs).forEach(key => {
                    const input = document.getElementById(key);
                    if (input && result.data[key] !== undefined) {
                        input.value = result.data[key];
                        this.inputs[key] = parseFloat(result.data[key]);
                    }
                });
                
                this.updateIndicators();
                this.updateReactorDisplay();
                this.addNotification('Деректер инпуттарға жүктелді', 'info');
            } else {
                this.addNotification(`Қате: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('API қатесі:', error);
            this.addNotification('Деректерді жүктеу кезінде қате пайда болды', 'error');
        }
    }
    
    async deleteData(id) {
        if (!confirm('Бұл деректерді жойғыңыз келе ме?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/process-data/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (this.checkAuthError(response)) return;
            
            const result = await response.json();
            
            if (result.success) {
                this.addNotification('Деректер сәтті жойылды', 'success');
                this.loadData(this.currentPage);
            } else {
                this.addNotification(`Қате: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('API қатесі:', error);
            this.addNotification('Деректерді жою кезінде қате пайда болды', 'error');
        }
    }
    
    async clearAllData() {
        if (!confirm('Барлық деректерді жойғыңыз келе ме? Бұл әрекетті болдырмау мүмкін емес!')) {
            return;
        }
        
        try {
            // Барлық деректерді жою үшін API endpoint қосу керек
            this.addNotification('Барлық деректерді жою функциясы әзірленуде', 'warning');
        } catch (error) {
            console.error('API қатесі:', error);
            this.addNotification('Деректерді жою кезінде қате пайда болды', 'error');
        }
    }
    
    async uploadExcelFile(file) {
        if (!file) {
            return;
        }
        
        // Файл форматын тексеру
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(fileExtension)) {
            this.addNotification('Тек .xlsx немесе .xls форматындағы файлдарды жүктеуге болады', 'error');
            return;
        }
        
        this.addNotification('Excel файл жүктелуде...', 'info');
        
        try {
            const formData = new FormData();
            formData.append('excelFile', file);
            
            const response = await fetch('/api/process-data/upload-excel', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.addNotification(
                    `Excel файл сәтті жүктелді! ${result.inserted} жазба базаға салынды`,
                    'success'
                );
                // Кестені жаңарту
                this.loadData(this.currentPage);
                // Файл инпутты тазалау
                document.getElementById('excelFileInput').value = '';
            } else {
                this.addNotification(`Excel файл жүктеу қатесі: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Excel файл жүктеу қатесі:', error);
            this.addNotification('Excel файлды жүктеу кезінде қате пайда болды', 'error');
        }
    }
    
    async sendToModelService() {
        // ML сервисі арқылы y1, y2 болжау (x1-x6 → y1, y2)
        this.addNotification('ML болжау жүргізілуде...', 'info');
        
        try {
            const response = await fetch('/api/ml/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    x1: this.inputs.x1,
                    x2: this.inputs.x2,
                    x3: this.inputs.x3,
                    x4: this.inputs.x4,
                    x5: this.inputs.x5,
                    x6: this.inputs.x6
                })
            });
            
            if (this.checkAuthError(response)) return;
            
            const result = await response.json();
            
            if (result.success) {
                // Болжалған мәндерді инпуттарға орнату
                this.inputs.y1 = result.prediction.y1;
                this.inputs.y2 = result.prediction.y2;
                
                // UI-ды жаңарту
                const y1Input = document.getElementById('y1');
                const y2Input = document.getElementById('y2');
                if (y1Input) y1Input.value = result.prediction.y1.toFixed(2);
                if (y2Input) y2Input.value = result.prediction.y2.toFixed(4);
                
                this.addNotification(
                    `ML болжау: y1=${result.prediction.y1.toFixed(2)}%, y2=${result.prediction.y2.toFixed(4)}`,
                    'success'
                );
            } else {
                this.addNotification(`ML болжау қатесі: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('ML сервисі қатесі:', error);
            this.addNotification('ML сервисіне қосылу қатесі', 'error');
        }
    }
    
    async reversePredictFromTarget() {
        // Кері бағыттағы ML болжау: y1, y2 → x1-x6
        // Инпуттардан y1, y2 мәндерін алу
        const targetY1 = this.inputs.y1;
        const targetY2 = this.inputs.y2;
        
        if (!targetY1 || !targetY2) {
            this.addNotification('y1 және y2 мәндерін енгізіңіз', 'warning');
            return;
        }
        
        this.addNotification('Кері бағыттағы ML болжау жүргізілуде...', 'info');
        
        try {
            const response = await fetch('/api/ml/reverse-predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    y1: targetY1,
                    y2: targetY2
                })
            });
            
            if (this.checkAuthError(response)) return;
            
            const result = await response.json();
            
            if (result.success) {
                // Болжалған мәндерді инпуттарға орнату
                const prediction = result.prediction;
                this.inputs.x1 = prediction.x1;
                this.inputs.x2 = prediction.x2;
                this.inputs.x3 = prediction.x3;
                this.inputs.x4 = prediction.x4;
                this.inputs.x5 = prediction.x5;
                this.inputs.x6 = prediction.x6;
                
                // UI-ды жаңарту
                ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        const value = this.inputs[id];
                        // Әр параметр үшін дұрыс формат
                        if (id === 'x2' || id === 'x5') {
                            input.value = value.toFixed(3);
                        } else if (id === 'x1' || id === 'x3' || id === 'x4' || id === 'x6') {
                            input.value = value.toFixed(1);
                        } else {
                            input.value = value.toFixed(2);
                        }
                    }
                });
                
                this.updateIndicators();
                this.updateReactorDisplay();
                
                this.addNotification(
                    `Кері бағыттағы ML болжау: x1=${prediction.x1.toFixed(1)}, x2=${prediction.x2.toFixed(3)}, x3=${prediction.x3.toFixed(1)}, x4=${prediction.x4.toFixed(1)}, x5=${prediction.x5.toFixed(2)}, x6=${prediction.x6.toFixed(1)}`,
                    'success'
                );
            } else {
                this.addNotification(`Кері бағыттағы ML болжау қатесі: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Кері бағыттағы ML болжау қатесі:', error);
            this.addNotification('Кері бағыттағы ML болжау қатесі', 'error');
        }
    }
    
    async optimizeForTarget() {
        // Обратная оптимизация: y1, y2 берілгенде x1-x6 табу
        const targetY1 = parseFloat(prompt('Мақсатты бензин шығымы (y1, %):', '50'));
        const targetY2 = parseFloat(prompt('Мақсатты бензин тығыздығы (y2):', '0.75'));
        
        if (isNaN(targetY1) || isNaN(targetY2)) {
            this.addNotification('Дұрыс мәндер енгізіңіз', 'warning');
            return;
        }
        
        try {
            this.addNotification('Оптимизация жүргізілуде...', 'info');
            
            const response = await fetch('/api/ml/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    y1: targetY1,
                    y2: targetY2
                })
            });
            
            if (this.checkAuthError(response)) return;
            
            const result = await response.json();
            
            if (result.success) {
                // Оптималды параметрлерді инпуттарға орнату
                const optimal = result.optimal_parameters;
                this.inputs.x1 = optimal.x1;
                this.inputs.x2 = optimal.x2;
                this.inputs.x3 = optimal.x3;
                this.inputs.x4 = optimal.x4;
                this.inputs.x5 = optimal.x5;
                this.inputs.x6 = optimal.x6;
                
                // UI-ды жаңарту
                ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].forEach(id => {
                    const input = document.getElementById(id);
                    if (input) input.value = this.inputs[id].toFixed(2);
                });
                
                this.updateIndicators();
                this.updateReactorDisplay();
                
                this.addNotification(
                    `Оптимизация аяқталды! Қате: y1=${result.error_y1.toFixed(2)}%, y2=${result.error_y2.toFixed(4)}`,
                    'success'
                );
            } else {
                this.addNotification(`Оптимизация қатесі: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Оптимизация қатесі:', error);
            this.addNotification('Оптимизация қатесі', 'error');
        }
    }
    
    async showFeatureImportance() {
        // Feature importance көрсету
        try {
            const response = await fetch('/api/ml/feature-importance', {
                credentials: 'include'
            });
            
            if (this.checkAuthError(response)) return;
            
            const result = await response.json();
            
            if (result.success) {
                let message = 'Параметрлердің маңыздылығы:\n\n';
                result.importance.forEach((item, idx) => {
                    const paramNames = {
                        'x1': 'Шикізат шығыны',
                        'x2': 'Шикізат тығыздығы',
                        'x3': 'Шикізат температурасы',
                        'x4': 'Реактор температурасы',
                        'x5': 'Реактор қысымы',
                        'x6': 'Катализатор шығыны'
                    };
                    message += `${idx + 1}. ${paramNames[item.parameter] || item.parameter}: ${(item.avg_importance * 100).toFixed(1)}%\n`;
                });
                
                alert(message);
            } else {
                this.addNotification(`Feature importance қатесі: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Feature importance қатесі:', error);
            this.addNotification('Feature importance алу қатесі', 'error');
        }
    }
    
    async showModelInfo() {
        // Модель ақпараттарын көрсету
        const modal = document.getElementById('modelInfoModal');
        const content = document.getElementById('modelInfoContent');
        
        if (!modal || !content) return;
        
        // Модалды терезені ашу
        modal.style.display = 'block';
        content.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Жүктелуде...</div>';
        
        try {
            // Толық ақпарат алу
            const response = await fetch('/api/ml/model-info', {
                credentials: 'include'
            });
            
            if (this.checkAuthError(response)) {
                modal.style.display = 'none';
                return;
            }
            
            const result = await response.json();
            
            if (result.success && result.modelInfo) {
                this.renderFullModelInfo(result.modelInfo, result.modelDirectory);
            } else {
                // Fallback - тек метрикалар
                const metricsResponse = await fetch('/api/ml/metrics', {
                    credentials: 'include'
                });
                if (metricsResponse.ok) {
                    const metricsResult = await metricsResponse.json();
                    if (metricsResult.success && metricsResult.metrics) {
                        this.renderModelInfo(metricsResult.metrics);
                    } else {
                        throw new Error(result.message || 'Модель ақпараттарын алу қатесі');
                    }
                } else {
                    throw new Error(result.message || 'Модель ақпараттарын алу қатесі');
                }
            }
        } catch (error) {
            console.error('Модель ақпараттары қатесі:', error);
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Модель ақпараттарын алу кезінде қате пайда болды</p>
                    <p style="font-size: 0.9em; color: #b0b0b0; margin-top: 10px;">
                        ${error.message}
                    </p>
                </div>
            `;
        }
    }
    
    renderFullModelInfo(modelInfo, modelDirectory) {
        const content = document.getElementById('modelInfoContent');
        if (!content) return;
        
        const paramNames = {
            'y1': { name: 'Бензин шығымы (y1)', unit: '%' },
            'y2': { name: 'Бензин тығыздығы (y2)', unit: 'кг/м³' },
            'x1': { name: 'Шикізат шығыны (x1)', unit: 'т/тәулік' },
            'x2': { name: 'Шикізат тығыздығы (x2)', unit: 'кг/м³' },
            'x3': { name: 'Шикізат температурасы (x3)', unit: '°С' },
            'x4': { name: 'Реактор температурасы (x4)', unit: '°С' },
            'x5': { name: 'Реактор қысымы (x5)', unit: 'кгс/см²' },
            'x6': { name: 'Катализатор шығыны (x6)', unit: 'кг/шикізат тоннасы' }
        };
        
        let html = '<div class="model-info-container">';
        html += `<div class="model-directory-info"><i class="fas fa-folder"></i> Директория: <code>${modelDirectory || 'models'}</code></div>`;
        
        // Forward модельдер
        if (modelInfo.forward_model && modelInfo.forward_model.loaded) {
            const fm = modelInfo.forward_model;
            html += `
                <div class="model-section">
                    <h3><i class="fas fa-arrow-right"></i> Forward Модель (x1-x6 → y1, y2)</h3>
                    <div class="model-status"><i class="fas fa-check-circle"></i> Жүктелген</div>
                    <div class="metrics-grid">
            `;
            
            ['y1', 'y2'].forEach(param => {
                if (fm.models[param]) {
                    const modelData = fm.models[param];
                    const m = fm.metrics[param] || {};
                    const paramInfo = paramNames[param] || { name: param, unit: '' };
                    
                    html += `
                        <div class="metric-card">
                            <h4>${paramInfo.name}</h4>
                            <div class="model-type-info">
                                <span class="model-type-label">Алгоритм:</span>
                                <span class="model-type-value">${modelData.algorithm || modelData.type || 'N/A'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">R²:</span>
                                <span class="metric-value">${m.R2 ? m.R2.toFixed(4) : 'N/A'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">RMSE:</span>
                                <span class="metric-value">${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">MAPE:</span>
                                <span class="metric-value">${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%</span>
                            </div>
                            ${modelData.n_features ? `<div class="metric-item"><span class="metric-label">Features:</span><span class="metric-value">${modelData.n_features}</span></div>` : ''}
                            ${Object.keys(modelData.parameters || {}).length > 0 ? `
                                <details class="model-params">
                                    <summary>Модель параметрлері</summary>
                                    <div class="params-list">
                                        ${Object.entries(modelData.parameters).map(([key, val]) => 
                                            `<div class="param-item"><span class="param-key">${key}:</span> <span class="param-value">${JSON.stringify(val)}</span></div>`
                                        ).join('')}
                                    </div>
                                </details>
                            ` : ''}
                        </div>
                    `;
                }
            });
            
            // Файл ақпараттары
            if (fm.files) {
                html += `
                    <div class="files-section">
                        <h4><i class="fas fa-file"></i> Файлдар:</h4>
                        <div class="files-list">
                            ${Object.entries(fm.files).map(([filename, fileInfo]) => 
                                fileInfo.exists ? `
                                    <div class="file-item">
                                        <span class="file-name">${filename}</span>
                                        <span class="file-size">${fileInfo.size_mb} MB</span>
                                        <span class="file-date">${new Date(fileInfo.modified).toLocaleDateString('kk-KZ')}</span>
                                    </div>
                                ` : `<div class="file-item missing">${filename} - жоқ</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
            
            html += '</div></div>';
        } else {
            html += `
                <div class="model-section">
                    <h3><i class="fas fa-arrow-right"></i> Forward Модель</h3>
                    <div class="model-status error"><i class="fas fa-times-circle"></i> Жүктелмеген</div>
                </div>
            `;
        }
        
        // Reverse модельдер
        if (modelInfo.reverse_model && modelInfo.reverse_model.loaded) {
            const rm = modelInfo.reverse_model;
            html += `
                <div class="model-section">
                    <h3><i class="fas fa-arrow-left"></i> Reverse Модель (y1, y2 → x1-x6)</h3>
                    <div class="model-status"><i class="fas fa-check-circle"></i> Жүктелген</div>
                    <div class="metrics-grid">
            `;
            
            ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].forEach(param => {
                if (rm.models[param]) {
                    const modelData = rm.models[param];
                    const m = rm.metrics[param] || {};
                    const paramInfo = paramNames[param] || { name: param, unit: '' };
                    
                    html += `
                        <div class="metric-card">
                            <h4>${paramInfo.name}</h4>
                            <div class="model-type-info">
                                <span class="model-type-label">Алгоритм:</span>
                                <span class="model-type-value">${modelData.algorithm || modelData.type || 'N/A'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">R²:</span>
                                <span class="metric-value">${m.R2 ? m.R2.toFixed(4) : 'N/A'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">RMSE:</span>
                                <span class="metric-value">${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">MAPE:</span>
                                <span class="metric-value">${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%</span>
                            </div>
                            ${modelData.n_features ? `<div class="metric-item"><span class="metric-label">Features:</span><span class="metric-value">${modelData.n_features}</span></div>` : ''}
                            ${Object.keys(modelData.parameters || {}).length > 0 ? `
                                <details class="model-params">
                                    <summary>Модель параметрлері</summary>
                                    <div class="params-list">
                                        ${Object.entries(modelData.parameters).map(([key, val]) => 
                                            `<div class="param-item"><span class="param-key">${key}:</span> <span class="param-value">${JSON.stringify(val)}</span></div>`
                                        ).join('')}
                                    </div>
                                </details>
                            ` : ''}
                        </div>
                    `;
                }
            });
            
            // Файл ақпараттары
            if (rm.files) {
                html += `
                    <div class="files-section">
                        <h4><i class="fas fa-file"></i> Файлдар:</h4>
                        <div class="files-list">
                            ${Object.entries(rm.files).map(([filename, fileInfo]) => 
                                fileInfo.exists ? `
                                    <div class="file-item">
                                        <span class="file-name">${filename}</span>
                                        <span class="file-size">${fileInfo.size_mb} MB</span>
                                        <span class="file-date">${new Date(fileInfo.modified).toLocaleDateString('kk-KZ')}</span>
                                    </div>
                                ` : `<div class="file-item missing">${filename} - жоқ</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
            
            html += '</div></div>';
        } else {
            html += `
                <div class="model-section">
                    <h3><i class="fas fa-arrow-left"></i> Reverse Модель</h3>
                    <div class="model-status error"><i class="fas fa-times-circle"></i> Жүктелмеген</div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Тексттік нұсқаны сақтау
        this.modelInfoText = this.formatFullModelInfoText(modelInfo, modelDirectory, paramNames);
        
        content.innerHTML = html;
    }
    
    formatFullModelInfoText(modelInfo, modelDirectory, paramNames) {
        let text = '='.repeat(60) + '\n';
        text += 'ML МОДЕЛЬ АҚПАРАТТАРЫ (ТОЛЫҚ)\n';
        text += '='.repeat(60) + '\n\n';
        text += `Күні: ${new Date().toLocaleString('kk-KZ')}\n`;
        text += `Директория: ${modelDirectory || 'models'}\n\n`;
        
        // Forward модельдер
        if (modelInfo.forward_model && modelInfo.forward_model.loaded) {
            const fm = modelInfo.forward_model;
            text += 'FORWARD МОДЕЛЬ (x1-x6 → y1, y2)\n';
            text += '-'.repeat(60) + '\n';
            text += 'Статус: Жүктелген\n\n';
            
            ['y1', 'y2'].forEach(param => {
                if (fm.models[param]) {
                    const modelData = fm.models[param];
                    const m = fm.metrics[param] || {};
                    const paramInfo = paramNames[param] || { name: param, unit: '' };
                    
                    text += `${paramInfo.name}:\n`;
                    text += `  Алгоритм: ${modelData.algorithm || modelData.type || 'N/A'}\n`;
                    text += `  R²: ${m.R2 ? m.R2.toFixed(4) : 'N/A'}\n`;
                    text += `  RMSE: ${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}\n`;
                    text += `  MAPE: ${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%\n`;
                    if (modelData.n_features) {
                        text += `  Features: ${modelData.n_features}\n`;
                    }
                    if (Object.keys(modelData.parameters || {}).length > 0) {
                        text += `  Параметрлер:\n`;
                        Object.entries(modelData.parameters).forEach(([key, val]) => {
                            text += `    ${key}: ${JSON.stringify(val)}\n`;
                        });
                    }
                    text += '\n';
                }
            });
            
            if (fm.files) {
                text += 'Файлдар:\n';
                Object.entries(fm.files).forEach(([filename, fileInfo]) => {
                    if (fileInfo.exists) {
                        text += `  ${filename}: ${fileInfo.size_mb} MB, ${new Date(fileInfo.modified).toLocaleDateString('kk-KZ')}\n`;
                    } else {
                        text += `  ${filename}: жоқ\n`;
                    }
                });
                text += '\n';
            }
        } else {
            text += 'FORWARD МОДЕЛЬ: Жүктелмеген\n\n';
        }
        
        // Reverse модельдер
        if (modelInfo.reverse_model && modelInfo.reverse_model.loaded) {
            const rm = modelInfo.reverse_model;
            text += 'REVERSE МОДЕЛЬ (y1, y2 → x1-x6)\n';
            text += '-'.repeat(60) + '\n';
            text += 'Статус: Жүктелген\n\n';
            
            ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].forEach(param => {
                if (rm.models[param]) {
                    const modelData = rm.models[param];
                    const m = rm.metrics[param] || {};
                    const paramInfo = paramNames[param] || { name: param, unit: '' };
                    
                    text += `${paramInfo.name}:\n`;
                    text += `  Алгоритм: ${modelData.algorithm || modelData.type || 'N/A'}\n`;
                    text += `  R²: ${m.R2 ? m.R2.toFixed(4) : 'N/A'}\n`;
                    text += `  RMSE: ${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}\n`;
                    text += `  MAPE: ${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%\n`;
                    if (modelData.n_features) {
                        text += `  Features: ${modelData.n_features}\n`;
                    }
                    if (Object.keys(modelData.parameters || {}).length > 0) {
                        text += `  Параметрлер:\n`;
                        Object.entries(modelData.parameters).forEach(([key, val]) => {
                            text += `    ${key}: ${JSON.stringify(val)}\n`;
                        });
                    }
                    text += '\n';
                }
            });
            
            if (rm.files) {
                text += 'Файлдар:\n';
                Object.entries(rm.files).forEach(([filename, fileInfo]) => {
                    if (fileInfo.exists) {
                        text += `  ${filename}: ${fileInfo.size_mb} MB, ${new Date(fileInfo.modified).toLocaleDateString('kk-KZ')}\n`;
                    } else {
                        text += `  ${filename}: жоқ\n`;
                    }
                });
            }
        } else {
            text += 'REVERSE МОДЕЛЬ: Жүктелмеген\n';
        }
        
        text += '\n' + '='.repeat(60) + '\n';
        
        return text;
    }
    
    renderModelInfo(metrics) {
        const content = document.getElementById('modelInfoContent');
        if (!content) return;
        
        // Модель ақпараттарын форматтау
        const paramNames = {
            'y1': { name: 'Бензин шығымы (y1)', unit: '%' },
            'y2': { name: 'Бензин тығыздығы (y2)', unit: 'кг/м³' },
            'x1': { name: 'Шикізат шығыны (x1)', unit: 'т/тәулік' },
            'x2': { name: 'Шикізат тығыздығы (x2)', unit: 'кг/м³' },
            'x3': { name: 'Шикізат температурасы (x3)', unit: '°С' },
            'x4': { name: 'Реактор температурасы (x4)', unit: '°С' },
            'x5': { name: 'Реактор қысымы (x5)', unit: 'кгс/см²' },
            'x6': { name: 'Катализатор шығыны (x6)', unit: 'кг/шикізат тоннасы' }
        };
        
        // Forward модельдер (y1, y2)
        const forwardParams = ['y1', 'y2'].filter(p => metrics[p]);
        // Reverse модельдер (x1-x6)
        const reverseParams = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].filter(p => metrics[p]);
        
        let html = '<div class="model-info-container">';
        
        // Forward модельдер
        if (forwardParams.length > 0) {
            html += `
                <div class="model-section">
                    <h3><i class="fas fa-arrow-right"></i> Forward Модель (x1-x6 → y1, y2)</h3>
                    <div class="metrics-grid">
            `;
            
            forwardParams.forEach(param => {
                const m = metrics[param];
                const paramInfo = paramNames[param] || { name: param, unit: '' };
                html += `
                    <div class="metric-card">
                        <h4>${paramInfo.name}</h4>
                        <div class="metric-item">
                            <span class="metric-label">R² (Coefficient of Determination):</span>
                            <span class="metric-value">${m.R2 ? m.R2.toFixed(4) : 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">RMSE (Root Mean Squared Error):</span>
                            <span class="metric-value">${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">MAPE (Mean Absolute Percentage Error):</span>
                            <span class="metric-value">${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%</span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Reverse модельдер
        if (reverseParams.length > 0) {
            html += `
                <div class="model-section">
                    <h3><i class="fas fa-arrow-left"></i> Reverse Модель (y1, y2 → x1-x6)</h3>
                    <div class="metrics-grid">
            `;
            
            reverseParams.forEach(param => {
                const m = metrics[param];
                const paramInfo = paramNames[param] || { name: param, unit: '' };
                html += `
                    <div class="metric-card">
                        <h4>${paramInfo.name}</h4>
                        <div class="metric-item">
                            <span class="metric-label">R²:</span>
                            <span class="metric-value">${m.R2 ? m.R2.toFixed(4) : 'N/A'}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">RMSE:</span>
                            <span class="metric-value">${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">MAPE:</span>
                            <span class="metric-value">${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%</span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        html += '</div>';
        
        // Тексттік нұсқаны сақтау (көшіру үшін)
        this.modelInfoText = this.formatModelInfoText(metrics, paramNames);
        
        content.innerHTML = html;
    }
    
    formatModelInfoText(metrics, paramNames) {
        let text = '='.repeat(60) + '\n';
        text += 'ML МОДЕЛЬ АҚПАРАТТАРЫ\n';
        text += '='.repeat(60) + '\n\n';
        text += `Күні: ${new Date().toLocaleString('kk-KZ')}\n\n`;
        
        // Forward модельдер
        const forwardParams = ['y1', 'y2'].filter(p => metrics[p]);
        if (forwardParams.length > 0) {
            text += 'FORWARD МОДЕЛЬ (x1-x6 → y1, y2)\n';
            text += '-'.repeat(60) + '\n';
            
            forwardParams.forEach(param => {
                const m = metrics[param];
                const paramInfo = paramNames[param] || { name: param, unit: '' };
                text += `\n${paramInfo.name}:\n`;
                text += `  R² (Coefficient of Determination): ${m.R2 ? m.R2.toFixed(4) : 'N/A'}\n`;
                text += `  RMSE (Root Mean Squared Error): ${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}\n`;
                text += `  MAPE (Mean Absolute Percentage Error): ${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%\n`;
            });
            
            text += '\n';
        }
        
        // Reverse модельдер
        const reverseParams = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].filter(p => metrics[p]);
        if (reverseParams.length > 0) {
            text += 'REVERSE МОДЕЛЬ (y1, y2 → x1-x6)\n';
            text += '-'.repeat(60) + '\n';
            
            reverseParams.forEach(param => {
                const m = metrics[param];
                const paramInfo = paramNames[param] || { name: param, unit: '' };
                text += `\n${paramInfo.name}:\n`;
                text += `  R²: ${m.R2 ? m.R2.toFixed(4) : 'N/A'}\n`;
                text += `  RMSE: ${m.RMSE ? m.RMSE.toFixed(4) : 'N/A'} ${paramInfo.unit}\n`;
                text += `  MAPE: ${m.MAPE ? m.MAPE.toFixed(2) : 'N/A'}%\n`;
            });
        }
        
        text += '\n' + '='.repeat(60) + '\n';
        
        return text;
    }
    
    closeModelInfoModal() {
        const modal = document.getElementById('modelInfoModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    async copyModelInfo() {
        if (!this.modelInfoText) {
            this.addNotification('Көшіру үшін деректер жоқ', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.modelInfoText);
            this.addNotification('Модель ақпараттары буферге көшірілді!', 'success');
        } catch (error) {
            // Fallback - ескі әдіс
            const textArea = document.createElement('textarea');
            textArea.value = this.modelInfoText;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.addNotification('Модель ақпараттары буферге көшірілді!', 'success');
            } catch (err) {
                this.addNotification('Көшіру қатесі', 'error');
            }
            document.body.removeChild(textArea);
        }
    }
    
    resetInputs() {
        if (this.isEmergency) {
            this.addNotification('Авариялық режимде қалпына келтіру мүмкін емес!', 'error');
            return;
        }
        
        // Бастапқы мәндерге қайтару
        this.inputs = {
            x1: 240,
            x2: 0.9,
            x3: 210,
            x4: 518,
            x5: 2.2,
            x6: 11.5,
            y1: 48,
            y2: 0.7
        };
        
        // Инпуттарды жаңарту
        Object.keys(this.inputs).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = this.inputs[key];
            }
        });
        
        this.updateIndicators();
        this.updateReactorDisplay();
        this.addNotification('Параметрлер қалпына келтірілді', 'info');
    }
    
    emergencyStop() {
        this.isEmergency = true;
        this.currentMode = 'emergency';
        
        // Барлық түймелерді өшіру
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const emergencyBtn = document.querySelector('[data-mode="emergency"]');
        if (emergencyBtn) {
            emergencyBtn.classList.add('active');
        }
        
        // Авариялық хабарландыру
        this.addNotification('АВАРИЯЛЫҚ ТОҚТАТУ!', 'error');
        
        // Реакторды қызыл түске ауыстыру
        const reactor = document.getElementById('reactor');
        if (reactor) {
            reactor.style.background = 'linear-gradient(45deg, #ff4757, #c44569)';
            reactor.style.boxShadow = '0 0 50px rgba(255, 71, 87, 1)';
            reactor.style.animation = 'none';
        }
        
        // 5 секундтан кейін қалпына келтіру мүмкіндігін беру
        setTimeout(() => {
            const resetBtn = document.getElementById('resetBtn');
            resetBtn.textContent = 'Авариялық режимді тоқтату';
            resetBtn.onclick = () => {
                this.isEmergency = false;
                this.addNotification('Авариялық режим тоқтатылды', 'success');
                resetBtn.textContent = 'Қалпына келтіру';
                resetBtn.onclick = () => this.resetInputs();
            };
        }, 5000);
    }
    
    
    addNotification(message, type = 'info') {
        const notificationList = document.getElementById('notificationList');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('kk-KZ');
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <small style="color: #b0b0b0;">${timestamp}</small>
            </div>
        `;
        
        // Түс коды
        switch(type) {
            case 'success':
                notification.style.borderLeftColor = '#4ecdc4';
                break;
            case 'error':
                notification.style.borderLeftColor = '#ff6b6b';
                break;
            case 'warning':
                notification.style.borderLeftColor = '#ffa502';
                break;
            default:
                notification.style.borderLeftColor = '#4ecdc4';
        }
        
        notificationList.insertBefore(notification, notificationList.firstChild);
        
        // Ескі хабарландыруларды жою (тек 5-ін ғана сақтау)
        while (notificationList.children.length > 5) {
            notificationList.removeChild(notificationList.lastChild);
        }
        
        // 5 секундтан кейін автоматты түрде жою
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    initCharts() {
        console.log('ProcessController: initCharts() start');
        /** Графиктерді инициализациялау */
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    ticks: { color: '#b0b0b0' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#b0b0b0' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        };
        
        // Температура графигі
        const tempCtx = document.getElementById('temperatureChart');
        if (tempCtx) {
            this.charts.temperature = new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Шикізат температурасы (x3)',
                            data: [],
                            borderColor: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Реактор температурасы (x4)',
                            data: [],
                            borderColor: '#ffa502',
                            backgroundColor: 'rgba(255, 165, 2, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: chartOptions
            });
        }
        
        // Қысым графигі
        const pressureCtx = document.getElementById('pressureChart');
        if (pressureCtx) {
            this.charts.pressure = new Chart(pressureCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Реактор қысымы (x5)',
                        data: [],
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
        }
        
        // Шығын графигі
        const flowCtx = document.getElementById('flowChart');
        if (flowCtx) {
            this.charts.flow = new Chart(flowCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Шикізат шығыны (x1)',
                            data: [],
                            borderColor: '#56ab2f',
                            backgroundColor: 'rgba(86, 171, 47, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Катализатор шығыны (x6)',
                            data: [],
                            borderColor: '#a8e063',
                            backgroundColor: 'rgba(168, 224, 99, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: chartOptions
            });
        }
        
        // Бензин шығымы графигі
        const volumeCtx = document.getElementById('gasolineVolumeChart');
        if (volumeCtx) {
            this.charts.gasolineVolume = new Chart(volumeCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Бензин шығымы (y1)',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
            console.log("ProcessController: initialized 'gasolineVolume' chart on id=gasolineVolumeChart");
        }
        
        // Бензин тығыздығы графигі
        const densityCtx = document.getElementById('gasolineDensityChart');
        if (densityCtx) {
            this.charts.gasolineDensity = new Chart(densityCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Бензин тығыздығы (y2)',
                        data: [],
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
            console.log("ProcessController: initialized 'gasolineDensity' chart on id=gasolineDensityChart");
        }
        
        // Катализатор графигі
        const catalystCtx = document.getElementById('catalystChart');
        if (catalystCtx) {
            this.charts.catalyst = new Chart(catalystCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Катализатор шығыны (x6)',
                        data: [],
                        borderColor: '#f093fb',
                        backgroundColor: 'rgba(240, 147, 251, 0.1)',
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
            console.log("ProcessController: initialized 'catalyst' chart on id=catalystChart");
        }
        console.log('ProcessController: initCharts() complete');
    }
    
    async loadChartData() {
        /** Исторические данные жүктеу және графиктерді жаңарту */
        try {
            console.log('ProcessController: loadChartData() fetching history', this.currentPeriod);
            const response = await fetch(`/api/process-data/history?period=${this.currentPeriod}`, {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                console.log('ProcessController: loadChartData() received', result.data.length, 'points');
                this.updateCharts(result.data);
            } else {
                console.error('Графиктер деректерін жүктеу қатесі:', result.message);
            }
        } catch (error) {
            console.error('Графиктер деректерін жүктеу қатесі:', error);
        }
    }
    
    updateCharts(data) {
        /** Графиктерді деректермен жаңарту */
        if (!data || data.length === 0) {
            return;
        }
        
        // Уақыт этикеттерін дайындау
        const labels = data.map(item => {
            const date = new Date(item.createdAt);
            return date.toLocaleString('kk-KZ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        });
        
        console.log('ProcessController: updateCharts() updating', data.length, 'points');
        // Температура графигі
        if (this.charts.temperature) {
            this.charts.temperature.data.labels = labels;
            this.charts.temperature.data.datasets[0].data = data.map(item => parseFloat(item.x3));
            this.charts.temperature.data.datasets[1].data = data.map(item => parseFloat(item.x4));
            this.charts.temperature.update();
        }
        
        // Қысым графигі
        if (this.charts.pressure) {
            this.charts.pressure.data.labels = labels;
            this.charts.pressure.data.datasets[0].data = data.map(item => parseFloat(item.x5));
            this.charts.pressure.update();
        }
        
        // Шығын графигі
        if (this.charts.flow) {
            this.charts.flow.data.labels = labels;
            this.charts.flow.data.datasets[0].data = data.map(item => parseFloat(item.x1));
            this.charts.flow.data.datasets[1].data = data.map(item => parseFloat(item.x6));
            this.charts.flow.update();
        }
        
        // Бензин шығымы графигі
        if (this.charts.gasolineVolume) {
            this.charts.gasolineVolume.data.labels = labels;
            this.charts.gasolineVolume.data.datasets[0].data = data.map(item => parseFloat(item.y1));
            this.charts.gasolineVolume.update();
        } else {
            console.warn("ProcessController: gasolineVolume chart not initialized");
        }
        
        // Бензин тығыздығы графигі
        if (this.charts.gasolineDensity) {
            this.charts.gasolineDensity.data.labels = labels;
            this.charts.gasolineDensity.data.datasets[0].data = data.map(item => parseFloat(item.y2));
            this.charts.gasolineDensity.update();
        } else {
            console.warn("ProcessController: gasolineDensity chart not initialized");
        }
        
        // Катализатор графигі
        if (this.charts.catalyst) {
            this.charts.catalyst.data.labels = labels;
            this.charts.catalyst.data.datasets[0].data = data.map(item => parseFloat(item.x6));
            this.charts.catalyst.update();
        } else {
            console.warn("ProcessController: catalyst chart not initialized");
        }
    }
}

// Документ дайын болғанда жүйені іске қосу
document.addEventListener('DOMContentLoaded', () => {
    window.processController = new ProcessController();
});

// Браузер жабылғанда немесе бет ауысқанда ескерту
window.addEventListener('beforeunload', (e) => {
    if (window.processController && window.processController.isEmergency) {
        e.preventDefault();
        e.returnValue = 'Авариялық режимде жүйе жабылмауы керек!';
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const scrollBtn = document.getElementById('scrollToTop');

    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
