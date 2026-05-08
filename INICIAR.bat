@echo off
title EVHAPO - Servidor
echo.
echo  ================================================
echo   EVHAPO - Diagnostico Mental del Jugador Poker
echo  ================================================
echo.
echo  Iniciando servidor...
echo.

:: Check if Python is in PATH, else try common paths
where python >nul 2>&1
if %errorlevel%==0 (
    set PYTHON=python
) else (
    set PYTHON=C:\Users\pc\AppData\Local\Python\pythoncore-3.14-64\python.exe
)

cd /d "%~dp0backend"
%PYTHON% -m pip install -r requirements.txt -q

echo.
echo  Servidor corriendo en: http://localhost:5000
echo  Presiona Ctrl+C para detener
echo.
start "" "http://localhost:5000"
%PYTHON% app.py
pause
