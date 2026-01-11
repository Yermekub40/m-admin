# ML API-ны іске қосу нұсқаулары

## Windows үшін:

### 1-ші әдіс: Скрипт арқылы (Ұсынылады)
```bash
cd ml
start_api.bat
```

### 2-ші әдіс: Қолмен
```bash
cd ml

# Виртуаль орта құру (бірінші рет)
python -m venv venv

# Виртуаль ортаны іске қосу
venv\Scripts\activate

# Пакеттерді орнату
pip install -r requirements.txt

# ML API-ны іске қосу
python api.py
```

## Linux/Mac үшін:

### 1-ші әдіс: Скрипт арқылы (Ұсынылады)
```bash
cd ml
chmod +x start_api.sh
./start_api.sh
```

### 2-ші әдіс: Қолмен
```bash
cd ml

# Виртуаль орта құру (бірінші рет)
python3 -m venv venv

# Виртуаль ортаны іске қосу
source venv/bin/activate

# Пакеттерді орнату
pip install -r requirements.txt

# ML API-ны іске қосу
python api.py
```

## Модельдерді оқыту (бірінші рет):

Модельдерді оқытпасаңыз, ML API жұмыс істемейді. Алдымен модельдерді оқытыңыз:

```bash
cd ml

# Виртуаль ортаны іске қосу
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Модельдерді оқыту
python train.py --model random_forest --source csv
```

## Тестілеу:

ML API іске қосылғаннан кейін, браузерде мынаны ашыңыз:
- http://localhost:5000/health

Немесе curl арқылы:
```bash
curl http://localhost:5000/health
```

## Ескертулер:

1. **ML API 5000 портында жұмыс істейді** (config.env файлында ML_API_URL=http://localhost:5000)
2. **ML API-ны Node.js серверінен бөлек іске қосу керек**
3. **Екі сервер де жұмыс істеуі керек:**
   - Node.js сервер: `npm start` (порт 3000)
   - ML API сервер: `python ml/api.py` (порт 5000)

## Қателерді шешу:

### "Port 5000 already in use" қатесі:
Басқа порт қолдану үшін:
```bash
# Windows
set ML_API_PORT=5001
python api.py

# Linux/Mac
export ML_API_PORT=5001
python api.py
```

### "Модельдер жүктелмеген" қатесі:
Модельдерді оқытыңыз:
```bash
python train.py --model random_forest --source csv
```

