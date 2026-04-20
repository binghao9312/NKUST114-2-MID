# 加密貨幣投資分析 Demo - PowerShell 快速啟動腳本

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  加密貨幣投資分析 Demo" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python 檢查完成: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 錯誤: 找不到 Python" -ForegroundColor Red
    Write-Host "請先安裝 Python 3.6 或更高版本"
    exit 1
}

Write-Host ""

# 檢查 CSV 文件
if (-not (Test-Path "crypto_data.csv")) {
    Write-Host "❌ 錯誤: 找不到 crypto_data.csv" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 數據文件檢查完成" -ForegroundColor Green
Write-Host ""

# 啟動服務器
Write-Host "✓ 正在啟動服務器..." -ForegroundColor Green
Write-Host "✓ 訪問地址: http://localhost:8000" -ForegroundColor Yellow
Write-Host "✓ 按 Ctrl+C 停止服務器" -ForegroundColor Yellow
Write-Host ""

# 立即打開瀏覽器
$url = "http://localhost:8000"
Write-Host "✓ 正在打開瀏覽器..." -ForegroundColor Green
Start-Process $url

# 啟動 HTTP 服務器
python -m http.server 8000
