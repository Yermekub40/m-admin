@echo off
REM ML API-ны іске қосатын скрипт (Windows)

cd /d %~dp0..\ml

REM Виртуаль орта бар ма тексеру
if not exist "venv" (
    echo [ML API] Виртуаль орта жоқ, құрылуда...
    python -m venv venv
    if errorlevel 1 (
        echo [ML API] ҚАТЕ: Виртуаль орта құру мүмкін емес!
        exit /b 1
    )
)

REM Виртуаль ортаны іске қосу және ML API-ны іске қосу
call venv\Scripts\activate.bat && python api.py

