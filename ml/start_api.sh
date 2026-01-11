#!/bin/bash

echo "========================================"
echo "ML API Сервисін іске қосу"
echo "========================================"
echo ""

# Python бар ма тексеру
if ! command -v python3 &> /dev/null; then
    echo "[ҚАТЕ] Python орнатылмаған!"
    echo "Python 3.8+ орнатыңыз: https://www.python.org/downloads/"
    exit 1
fi

echo "[1/3] Python виртуаль ортаны тексеру..."
if [ ! -d "venv" ]; then
    echo "Виртуаль орта жоқ, құрылуда..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[ҚАТЕ] Виртуаль орта құру мүмкін емес!"
        exit 1
    fi
fi

echo "[2/3] Виртуаль ортаны іске қосу..."
source venv/bin/activate

echo "[3/3] Пакеттерді орнату/жаңарту..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

if [ $? -ne 0 ]; then
    echo "[ҚАТЕ] Пакеттерді орнату қатесі!"
    exit 1
fi

echo ""
echo "========================================"
echo "ML API іске қосылуда..."
echo "URL: http://localhost:5000"
echo "========================================"
echo ""
echo "[ЕСКЕРТУ] Бұл терминалда ML API жұмыс істейді"
echo "[ЕСКЕРТУ] Терминалды жаппаңыз!"
echo ""

# ML API-ны іске қосу
python api.py

