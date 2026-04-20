@echo off
REM 加密貨幣投資分析 Demo - Windows快速啟動
setlocal enabledelayedexpansion

echo.
echo ============================================
echo    加密貨幣投資分析 Demo
echo ============================================
echo.

REM 檢查Python是否安裝
python --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 找不到 Python
    echo 請先安裝 Python 3.6 或更高版本
    echo.
    pause
    exit /b 1
)

echo ✓ Python 檢查完成
echo.

REM 檢查CSV文件
if not exist "crypto_data.csv" (
    echo 錯誤: 找不到 crypto_data.csv
    echo 請確保文件在項目目錄中
    echo.
    pause
    exit /b 1
)

echo ✓ 數據文件檢查完成
echo.

REM 啟動HTTP服務器和打開瀏覽器
echo ✓ 正在啟動服務器...
echo ✓ 訪問地址: http://localhost:8000
echo ✓ 按 Ctrl+C 停止服務器
echo.

python run_demo.py

pause
