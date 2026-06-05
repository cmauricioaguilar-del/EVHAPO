@echo off
echo ================================================
echo  MinDev Bio — Build .exe
echo ================================================

:: Instalar dependencias si no están
pip install customtkinter flask pyinstaller --quiet

:: Limpiar builds anteriores
if exist dist\MinDevBio.exe del /f dist\MinDevBio.exe
if exist build rmdir /s /q build

:: Construir
pyinstaller mindevbio.spec --clean --noconfirm

echo.
if exist dist\MinDevBio.exe (
    echo  OK — dist\MinDevBio.exe generado correctamente
    echo  Tamanio:
    for %%A in (dist\MinDevBio.exe) do echo    %%~zA bytes
) else (
    echo  ERROR — no se genero el .exe
)
pause
