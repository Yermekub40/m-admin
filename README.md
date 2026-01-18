# М-Admin - Жүйе басқаруы

Бұл жоба технологиялық процестерді басқару үшін арналған веб-қосымша. Пользователь барлық параметрлерді (x1-x6, y1-y2) енгізіп, оларды PostgreSQL базасына сақтайды.

## Технологиялар

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **База деректері**: PostgreSQL
- **ORM**: Sequelize (CodeFirst әдісі)
- **API**: RESTful API

## Параметрлер

### Кіріс параметрлері (x1-x6):
- **x1**: Шикізат шығыны (0-400 т/тәулік)
- **x2**: Шикізат тығыздығы (0.4-1.6 т/м³)
- **x3**: Шикізат температурасы (0-255°C)
- **x4**: Реактор температурасы (0-600°C)
- **x5**: Реактор қысымы (0.5-3.5 кгс/см²)
- **x6**: Катализатор шығыны (1480-1990 т/тәулік)

### Шығыс параметрлері (y1-y2):
- **y1**: Бензин көлемі (0-70%)
- **y2**: Бензин тығыздығы (0.43-0.95)

## Орнату

### 1. PostgreSQL орнату
```bash
# PostgreSQL орнатыңыз және база жасаңыз
createdb m_admin_dev
```

### 2. Проект көшірмесін жасау
```bash
git clone <https://github.com/Yermekub40/m-admin>
cd m-admin
```

### 3. Пакеттерді орнату
```bash
npm install
```

### 4. База конфигурациясы
`.env` файлын жасап, өз база деректеріңізді енгізіңіз:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=m_admin_dev
DB_USER=postgres
DB_PASSWORD=your_password
```

### 5. Базаны миграциялау
```bash
npm run db:migrate
```

**Ескерту**: Әдетте синхронизация (`sequelize.sync`) өшірілген. База өзгерістерін миграциялар арқылы жасаңыз.

Егер синхронизацияны қосқыңыз келесе (тек дамыту үшін):
```bash
# .env файлында
SYNC_DB=true
```

**Ұсынылады**: Әрбір өзгеріс үшін миграция жасаңыз, синхронизацияны қолданбаңыз.

### 6. ML модельдерді оқыту (бірінші рет)
```bash
npm run ml:train
# немесе қолмен:
cd ml
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python train.py --model random_forest --source csv
```

### 7. Серверді іске қосу
```bash
# Өндіріс режимі (тек Node.js сервер)
npm start

# Дамыту режимі (Node.js + ML API бірге)
npm run dev
```

**Ескерту**: `npm run dev` командасы екі серверді бірге іске қосады:
- Node.js сервер (порт 3000)
- ML API сервер (порт 5000)

Егер тек Node.js серверді іске қосу керек болса:
```bash
npm run dev:server
```

Егер тек ML API-ны іске қосу керек болса:
```bash
npm run ml:start
```

## API Endpoints

### Деректерді сақтау
```http
POST /api/process-data
Content-Type: application/json

{
  "x1": 240,
  "x2": 0.9,
  "x3": 210,
  "x4": 518,
  "x5": 2.2,
  "x6": 1750,
  "y1": 48,
  "y2": 0.7,
  "mode": "manual"
}
```

### Деректерді алу
```http
GET /api/process-data?page=1&limit=10&mode=manual
```

### Деректерді жаңарту
```http
PUT /api/process-data/:id
Content-Type: application/json

{
  "x1": 250,
  "y1": 50
}
```

### Деректерді жою
```http
DELETE /api/process-data/:id
```

### Соңғы деректерді алу
```http
GET /api/process-data/latest
```

### Статистика
```http
GET /api/process-data/stats
```

## База кестесі

```sql
CREATE TABLE process_data (
  id SERIAL PRIMARY KEY,
  x1 DECIMAL(10,3) NOT NULL,  -- Шикізат шығыны
  x2 DECIMAL(10,4) NOT NULL,  -- Шикізат тығыздығы
  x3 DECIMAL(10,2) NOT NULL,  -- Шикізат температурасы
  x4 DECIMAL(10,2) NOT NULL,  -- Реактор температурасы
  x5 DECIMAL(10,3) NOT NULL,  -- Реактор қысымы
  x6 DECIMAL(10,2) NOT NULL,  -- Катализатор шығыны
  y1 DECIMAL(10,3) NOT NULL,  -- Бензин көлемі
  y2 DECIMAL(10,4) NOT NULL,  -- Бензин тығыздығы
  mode VARCHAR(20) NOT NULL DEFAULT 'manual',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Функционалдық мүмкіндіктер

- ✅ Барлық 8 параметрді енгізу (x1-x6, y1-y2)
- ✅ Нақты уақыттағы визуалды индикаторлар
- ✅ PostgreSQL базасына деректерді сақтау
- ✅ RESTful API
- ✅ Жұмыс режимдері (қолмен, автоматты, авариялық)
- ✅ Адаптивті дизайн
- ✅ Хабарландырулар жүйесі

## Machine Learning Модулі

### Орнату

```bash
cd ml
pip install -r requirements.txt
```

### Модельдерді оқыту

```bash
# CSV деректерінен
python train.py --model random_forest --source csv

# PostgreSQL базасынан
python train.py --model random_forest --source database
```

### ML API сервисін іске қосу

**Автоматты (npm run dev кезінде):**
```bash
npm run dev  # Node.js + ML API бірге іске қосылады
```

**Қолмен:**
```bash
npm run ml:start
# немесе
cd ml
python api.py
```

API порты: `http://localhost:5000`

**Ескерту**: `npm run dev` командасын пайдаланғанда ML API автоматты түрде іске қосылады. Бөлек іске қосу қажет емес.

### ML Функционалдық

1. **Прямая модель**: x1-x6 → y1, y2 болжау
   - `POST /api/ml/predict`

2. **Обратная модель**: y1, y2 → x1-x6 оптимизация
   - `POST /api/ml/optimize`

3. **Feature Importance**: x параметрлердің әсерін талдау
   - `GET /api/ml/feature-importance`

Толық ақпарат: [ml/readme.md](ml/readme.md)

## Келешектегі дамыту

- [x] Модель сервисімен интеграция
- [x] Нақты AI/ML алгоритмдерін қосу
- [ ] Графиктер мен диаграммаларды толықтыру
- [ ] Деректерді экспорттау/импорттау
- [ ] Пользователь аутентификациясы
- [ ] Рольдер мен рұқсаттар

## Автор

М-Admin жобасы - технологиялық процестерді басқару жүйесі
