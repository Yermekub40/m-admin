@echo off
echo ========================================
echo ML API Сервисін іске қосу
echo ========================================
echo.

REM Python бар ма тексеру
python --version >nul 2>&1
if errorlevel 1 (
    echo [ҚАТЕ] Python орнатылмаған!
    echo Python 3.8+ орнатыңыз: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] Python виртуаль ортаны тексеру...
if not exist "venv" (
    echo Виртуаль орта жоқ, құрылуда...
    python -m venv venv
    if errorlevel 1 (
        echo [ҚАТЕ] Виртуаль орта құру мүмкін емес!
        pause
        exit /b 1
    )
)

echo [2/3] Виртуаль ортаны іске қосу...
call venv\Scripts\activate.bat

echo [3/3] Пакеттерді орнату/жаңарту...
pip install -q --upgrade pip
pip install -q -r requirements.txt

if errorlevel 1 (
    echo [ҚАТЕ] Пакеттерді орнату қатесі!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ML API іске қосылуда...
echo URL: http://localhost:5000
echo ========================================
echo.
echo [ЕСКЕРТУ] Бұл терезеде ML API жұмыс істейді
echo [ЕСКЕРТУ] Терезені жаппаңыз!
echo.

REM ML API-ны іске қосу
python api.py

pause

