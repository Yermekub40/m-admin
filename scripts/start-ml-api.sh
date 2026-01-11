#!/bin/bash
# ML API-ны іске қосатын скрипт (Linux/Mac)

cd "$(dirname "$0")/../ml"

# Виртуаль орта бар ма тексеру
if [ ! -d "venv" ]; then
    echo "[ML API] Виртуаль орта жоқ, құрылуда..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[ML API] ҚАТЕ: Виртуаль орта құру мүмкін емес!"
        exit 1
    fi
fi

# Виртуаль ортаны іске қосу және ML API-ны іске қосу
source venv/bin/activate && python api.py

