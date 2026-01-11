// Отчеттар JavaScript - Mock датамен

class ReportsController {
    constructor() {
        this.currentReport = 'text';
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUserInfo();
        this.loadTextReport();
        this.initCharts();
    }

    async loadUserInfo() {
        try {
            const response = await fetch('/auth/me', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success && data.user) {
                document.getElementById('usernameDisplay').textContent = data.user.username;
            }
        } catch (error) {
            console.error('User info load error:', error);
        }
    }

    bindEvents() {
        // Отчеттар менюсы
        document.querySelectorAll('.report-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const reportType = e.currentTarget.getAttribute('data-report');
                this.switchReport(reportType);
            });
        });

        // Период өзгерістері
        document.getElementById('graphicPeriod')?.addEventListener('change', (e) => {
            this.loadGraphicReport(e.target.value);
        });

        document.getElementById('statsPeriod')?.addEventListener('change', (e) => {
            this.loadStatisticsReport(e.target.value);
        });

        // Шығу түймесі
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    switchReport(reportType) {
        // Менюны жаңарту
        document.querySelectorAll('.report-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-report="${reportType}"]`)?.classList.add('active');

        // Контентті жаңарту
        document.querySelectorAll('.report-section').forEach(section => {
            section.classList.remove('active');
        });

        this.currentReport = reportType;

        switch(reportType) {
            case 'text':
                document.getElementById('text-report').classList.add('active');
                this.loadTextReport();
                break;
            case 'graphic':
                document.getElementById('graphic-report').classList.add('active');
                this.loadGraphicReport('24h');
                break;
            case 'statistics':
                document.getElementById('statistics-report').classList.add('active');
                this.loadStatisticsReport('24h');
                break;
        }
    }

    // Mock дата генерация
    generateMockData(period = '24h') {
        const now = new Date();
        const data = [];
        let hours = 24;

        if (period === '7d') hours = 24 * 7;
        if (period === '30d') hours = 24 * 30;

        for (let i = hours; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 60 * 60 * 1000);
            data.push({
                date: date,
                x1: 240 + Math.random() * 10 - 5, // Шикізат шығыны
                x2: 0.9 + Math.random() * 0.02 - 0.01, // Шикізат тығыздығы
                x3: 210 + Math.random() * 10 - 5, // Шикізат температурасы
                x4: 518 + Math.random() * 5 - 2.5, // Реактор температурасы
                x5: 2.2 + Math.random() * 0.2 - 0.1, // Реактор қысымы
                x6: 1750 + Math.random() * 50 - 25, // Катализатор шығыны
                y1: 48 + Math.random() * 2 - 1, // Бензин көлемі
                y2: 0.7 + Math.random() * 0.05 - 0.025 // Бензин тығыздығы
            });
        }

        return data;
    }

    // Тексттік отчет
    loadTextReport() {
        const mockData = this.generateMockData('7d');
        const content = document.getElementById('textReportContent');

        // Статистика есептеу
        const stats = this.calculateStatistics(mockData);

        content.innerHTML = `
            <div class="text-report">
                <div class="report-meta">
                    <p><strong>Отчет күні:</strong> ${new Date().toLocaleDateString('kk-KZ', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                    <p><strong>Период:</strong> Соңғы 7 күн</p>
                    <p><strong>Жалпы жазбалар:</strong> ${mockData.length}</p>
                </div>

                <div class="report-section-content">
                    <h3>1. Жалпы сипаттама</h3>
                    <p>
                        Бұл отчет каталитикалық крекинг қондырғысының соңғы 7 күндегі жұмыс параметрлерін 
                        қамтиды. Қондырғы қалыпты режимде жұмыс істеп тұр, барлық параметрлер нормативтік 
                        шектер ішінде.
                    </p>
                </div>

                <div class="report-section-content">
                    <h3>2. Температура параметрлері</h3>
                    <table class="report-table">
                        <tr>
                            <th>Параметр</th>
                            <th>Орташа</th>
                            <th>Минимум</th>
                            <th>Максимум</th>
                            <th>Өлшем бірлігі</th>
                        </tr>
                        <tr>
                            <td>Шикізат температурасы (x3)</td>
                            <td>${stats.x3.avg.toFixed(1)}</td>
                            <td>${stats.x3.min.toFixed(1)}</td>
                            <td>${stats.x3.max.toFixed(1)}</td>
                            <td>°C</td>
                        </tr>
                        <tr>
                            <td>Реактор температурасы (x4)</td>
                            <td>${stats.x4.avg.toFixed(1)}</td>
                            <td>${stats.x4.min.toFixed(1)}</td>
                            <td>${stats.x4.max.toFixed(1)}</td>
                            <td>°C</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section-content">
                    <h3>3. Қысым параметрлері</h3>
                    <table class="report-table">
                        <tr>
                            <th>Параметр</th>
                            <th>Орташа</th>
                            <th>Минимум</th>
                            <th>Максимум</th>
                            <th>Өлшем бірлігі</th>
                        </tr>
                        <tr>
                            <td>Реактор қысымы (x5)</td>
                            <td>${stats.x5.avg.toFixed(2)}</td>
                            <td>${stats.x5.min.toFixed(2)}</td>
                            <td>${stats.x5.max.toFixed(2)}</td>
                            <td>кгс/см²</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section-content">
                    <h3>4. Шығын параметрлері</h3>
                    <table class="report-table">
                        <tr>
                            <th>Параметр</th>
                            <th>Орташа</th>
                            <th>Минимум</th>
                            <th>Максимум</th>
                            <th>Өлшем бірлігі</th>
                        </tr>
                        <tr>
                            <td>Шикізат шығыны (x1)</td>
                            <td>${stats.x1.avg.toFixed(1)}</td>
                            <td>${stats.x1.min.toFixed(1)}</td>
                            <td>${stats.x1.max.toFixed(1)}</td>
                            <td>т/тәулік</td>
                        </tr>
                        <tr>
                            <td>Катализатор шығыны (x6)</td>
                            <td>${stats.x6.avg.toFixed(1)}</td>
                            <td>${stats.x6.min.toFixed(1)}</td>
                            <td>${stats.x6.max.toFixed(1)}</td>
                            <td>т/тәулік</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section-content">
                    <h3>5. Өнім параметрлері</h3>
                    <table class="report-table">
                        <tr>
                            <th>Параметр</th>
                            <th>Орташа</th>
                            <th>Минимум</th>
                            <th>Максимум</th>
                            <th>Өлшем бірлігі</th>
                        </tr>
                        <tr>
                            <td>Бензин көлемі (y1)</td>
                            <td>${stats.y1.avg.toFixed(2)}</td>
                            <td>${stats.y1.min.toFixed(2)}</td>
                            <td>${stats.y1.max.toFixed(2)}</td>
                            <td>%</td>
                        </tr>
                        <tr>
                            <td>Бензин тығыздығы (y2)</td>
                            <td>${stats.y2.avg.toFixed(3)}</td>
                            <td>${stats.y2.min.toFixed(3)}</td>
                            <td>${stats.y2.max.toFixed(3)}</td>
                            <td>т/м³</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section-content">
                    <h3>6. Қорытынды</h3>
                    <p>
                        Соңғы 7 күнде қондырғы тұрақты жұмыс істеп тұр. Барлық параметрлер нормативтік 
                        шектер ішінде. Температура мен қысым тұрақты деңгейде сақталған. Бензин өнімділігі 
                        орташа ${stats.y1.avg.toFixed(2)}% деңгейінде, бұл жоспарланған көрсеткіштерге сәйкес келеді.
                    </p>
                    <p>
                        <strong>Ұсыныстар:</strong> Қондырғының қалыпты жұмысын жалғастыру. Келесі 
                        техникалық қызмет көрсету мерзіміне дейін барлық параметрлерді мониторингтеу.
                    </p>
                </div>
            </div>
        `;
    }

    // Графиктік отчет
    loadGraphicReport(period = '24h') {
        const mockData = this.generateMockData(period);
        
        // Температура графигі
        this.updateChart('tempChart', {
            labels: mockData.map(d => d.date.toLocaleString('kk-KZ', { month: 'short', day: 'numeric', hour: '2-digit' })),
            datasets: [
                {
                    label: 'Шикізат температурасы (x3)',
                    data: mockData.map(d => d.x3),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Реактор температурасы (x4)',
                    data: mockData.map(d => d.x4),
                    borderColor: '#ffa502',
                    backgroundColor: 'rgba(255, 165, 2, 0.1)',
                    tension: 0.4
                }
            ]
        });

        // Қысым графигі
        this.updateChart('pressureChart', {
            labels: mockData.map(d => d.date.toLocaleString('kk-KZ', { month: 'short', day: 'numeric', hour: '2-digit' })),
            datasets: [{
                label: 'Реактор қысымы (x5)',
                data: mockData.map(d => d.x5),
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                tension: 0.4
            }]
        });

        // Бензин көлемі графигі
        this.updateChart('volumeChart', {
            labels: mockData.map(d => d.date.toLocaleString('kk-KZ', { month: 'short', day: 'numeric', hour: '2-digit' })),
            datasets: [{
                label: 'Бензин көлемі (y1)',
                data: mockData.map(d => d.y1),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        });

        // Шығын графигі
        this.updateChart('flowChart', {
            labels: mockData.map(d => d.date.toLocaleString('kk-KZ', { month: 'short', day: 'numeric', hour: '2-digit' })),
            datasets: [
                {
                    label: 'Шикізат шығыны (x1)',
                    data: mockData.map(d => d.x1),
                    borderColor: '#56ab2f',
                    backgroundColor: 'rgba(86, 171, 47, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Катализатор шығыны (x6)',
                    data: mockData.map(d => d.x6),
                    borderColor: '#a8e063',
                    backgroundColor: 'rgba(168, 224, 99, 0.1)',
                    tension: 0.4
                }
            ]
        });
    }

    // Статистикалық отчет
    loadStatisticsReport(period = '24h') {
        const mockData = this.generateMockData(period);
        const stats = this.calculateStatistics(mockData);
        const content = document.getElementById('statisticsReportContent');

        content.innerHTML = `
            <div class="statistics-report">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3><i class="fas fa-thermometer-half"></i> Температура</h3>
                        <div class="stat-item">
                            <span class="stat-label">Шикізат (x3):</span>
                            <span class="stat-value">${stats.x3.avg.toFixed(1)}°C</span>
                            <div class="stat-range">${stats.x3.min.toFixed(1)} - ${stats.x3.max.toFixed(1)}</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Реактор (x4):</span>
                            <span class="stat-value">${stats.x4.avg.toFixed(1)}°C</span>
                            <div class="stat-range">${stats.x4.min.toFixed(1)} - ${stats.x4.max.toFixed(1)}</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <h3><i class="fas fa-tachometer-alt"></i> Қысым</h3>
                        <div class="stat-item">
                            <span class="stat-label">Реактор (x5):</span>
                            <span class="stat-value">${stats.x5.avg.toFixed(2)} кгс/см²</span>
                            <div class="stat-range">${stats.x5.min.toFixed(2)} - ${stats.x5.max.toFixed(2)}</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <h3><i class="fas fa-tint"></i> Шығын</h3>
                        <div class="stat-item">
                            <span class="stat-label">Шикізат (x1):</span>
                            <span class="stat-value">${stats.x1.avg.toFixed(1)} т/тәулік</span>
                            <div class="stat-range">${stats.x1.min.toFixed(1)} - ${stats.x1.max.toFixed(1)}</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Катализатор (x6):</span>
                            <span class="stat-value">${stats.x6.avg.toFixed(1)} т/тәулік</span>
                            <div class="stat-range">${stats.x6.min.toFixed(1)} - ${stats.x6.max.toFixed(1)}</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <h3><i class="fas fa-gas-pump"></i> Өнім</h3>
                        <div class="stat-item">
                            <span class="stat-label">Бензин көлемі (y1):</span>
                            <span class="stat-value">${stats.y1.avg.toFixed(2)}%</span>
                            <div class="stat-range">${stats.y1.min.toFixed(2)} - ${stats.y1.max.toFixed(2)}</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Бензин тығыздығы (y2):</span>
                            <span class="stat-value">${stats.y2.avg.toFixed(3)}</span>
                            <div class="stat-range">${stats.y2.min.toFixed(3)} - ${stats.y2.max.toFixed(3)}</div>
                        </div>
                    </div>
                </div>

                <div class="stats-summary">
                    <h3><i class="fas fa-chart-pie"></i> Жалпы статистика</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Жалпы жазбалар</div>
                            <div class="summary-value">${mockData.length}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Период</div>
                            <div class="summary-value">${this.getPeriodName(period)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Орташа өнімділік</div>
                            <div class="summary-value">${stats.y1.avg.toFixed(2)}%</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Тұрақтылық</div>
                            <div class="summary-value">${this.calculateStability(stats)}%</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Статистика есептеу
    calculateStatistics(data) {
        const stats = {};
        const params = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'y1', 'y2'];

        params.forEach(param => {
            const values = data.map(d => d[param]);
            stats[param] = {
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                std: this.calculateStdDev(values)
            };
        });

        return stats;
    }

    calculateStdDev(values) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }

    calculateStability(stats) {
        // Тұрақтылықты есептеу (стандартты ауытқуға негізделген)
        const avgStd = (stats.x3.std + stats.x4.std + stats.x5.std) / 3;
        const stability = Math.max(0, 100 - (avgStd * 10));
        return stability.toFixed(1);
    }

    getPeriodName(period) {
        const names = {
            '24h': 'Соңғы 24 сағат',
            '7d': 'Соңғы 7 күн',
            '30d': 'Соңғы 30 күн'
        };
        return names[period] || period;
    }

    // Графиктерді инициализациялау
    initCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#ffffff' }
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

        ['tempChart', 'pressureChart', 'volumeChart', 'flowChart'].forEach(chartId => {
            const ctx = document.getElementById(chartId);
            if (ctx) {
                this.charts[chartId] = new Chart(ctx, {
                    type: 'line',
                    data: { labels: [], datasets: [] },
                    options: chartOptions
                });
            }
        });
    }

    updateChart(chartId, data) {
        if (this.charts[chartId]) {
            this.charts[chartId].data = data;
            this.charts[chartId].update();
        }
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
}

// Отчет жүктеу функциясы
function downloadReport(type) {
    alert(`Отчет жүктеу функциясы әзірленуде. Тип: ${type}`);
}

// Документ дайын болғанда бастау
document.addEventListener('DOMContentLoaded', () => {
    window.reportsController = new ReportsController();
});



