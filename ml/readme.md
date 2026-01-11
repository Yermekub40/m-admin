# Machine Learning Модулі

Бұл модуль технологиялық процестерді басқару үшін ML модельдерін қамтиды.

## Функционалдық

### 1. Прямая модель (Forward Model)
**x1-x6 → y1, y2 болжау**

Кіріс параметрлеріне (x1-x6) сүйене отырып, бензин көлемі (y1) мен тығыздығын (y2) болжайды.

### 2. Обратная модель (Inverse Model)  
**y1, y2 → x1-x6 оптимизация**

Мақсатты y1, y2 үшін оптималды x1-x6 параметрлерін табады.

### 3. Feature Importance
**x параметрлердің y1, y2-ге әсерін талдау**

Қай x параметрлер y1, y2-ге қаншалықты әсер ететінін көрсетеді.

## Орнату

```bash
cd ml
pip install -r requirements.txt
```

## Қолдану

### 1. Модельдерді оқыту

```bash
# CSV деректерінен оқыту
python train.py --model random_forest --source csv

# Базадан оқыту
python train.py --model random_forest --source database
```

### 2. API сервисін іске қосу

```bash
python api.py
```

API порты: `http://localhost:5000`

### 3. API Endpoints

#### Прямая болжау
```bash
POST /predict
{
  "x1": 240,
  "x2": 0.9,
  "x3": 210,
  "x4": 518,
  "x5": 2.2,
  "x6": 1750
}
```

#### Обратная оптимизация
```bash
POST /optimize
{
  "y1": 50.0,
  "y2": 0.75
}
```

#### Feature Importance
```bash
GET /feature-importance
```

## Модельдер

- **Random Forest** (әдепкі)
- **Gradient Boosting**
- **Linear Regression**
- **Ridge Regression**

## Метрикалар

Әрбір модель үшін:
- **R²** (Coefficient of Determination)
- **RMSE** (Root Mean Squared Error)
- **MAPE** (Mean Absolute Percentage Error)

## Структура

```
ml/
├── data_loader.py          # Деректерді жүктеу
├── forward_model.py        # Прямая модель
├── inverse_model.py        # Обратная модель
├── feature_importance.py   # Feature importance талдауы
├── train.py                # Оқыту скрипті
├── api.py                  # Flask API сервис
├── requirements.txt        # Python пакеттері
└── models/                 # Оқытылған модельдер (автоматты түрде жасалады)
```
