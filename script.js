// 全局變數
let cryptoData = [];
let cryptoHistory = {};
let filteredData = [];
let charts = {};

// 頁面加載完成後執行
// 頁面加載完成後執行
document.addEventListener('DOMContentLoaded', async () => {
    // 加載CSV數據與歷史價格
    await loadCryptoData();
    await loadCryptoHistory();
    
    // 初始化表格
    displayTable(cryptoData);
    
    // 初始化下拉菜單
    populateCryptoSelect();
    
    // 初始化圖表
    initializeCharts();
    
    // 綁定事件監聽器
    setupEventListeners();
});

// 加載CSV數據
async function loadCryptoData() {
    try {
        const response = await fetch('crypto_data.csv');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const csvText = await response.text();

        // 解析CSV: 支援雙引號包住且內含逗號的欄位
        const lines = csvText.replace(/\r/g, '').trim().split('\n').filter(Boolean);
        if (lines.length < 2) {
            throw new Error('CSV內容不足');
        }

        const headers = parseCsvLine(lines[0]).map((header) =>
            header.replace(/^\uFEFF/, '').trim()
        );

        cryptoData = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCsvLine(lines[i]);
            if (values.length === 0) continue;

            const row = {};
            headers.forEach((header, index) => {
                row[header] = (values[index] || '').trim();
            });

            if (row.rank && row.symbol) {
                cryptoData.push(row);
            }
        }

        filteredData = [...cryptoData];
        console.log('✓ 加載 ' + cryptoData.length + ' 個加密貨幣數據');
    } catch (error) {
        console.error('載入CSV文件失敗:', error);
        alert('無法加載數據，請確保 crypto_data.csv 在同一目錄');
    }
}

async function loadCryptoHistory() {
    try {
        const response = await fetch('crypto_history.json');
        if (!response.ok) return;
        cryptoHistory = await response.json();
    } catch (error) {
        console.error('載入歷史資料失敗:', error);
    }
}

function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            const next = line[i + 1];
            if (inQuotes && next === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }

    result.push(current);
    return result;
}

// 設置事件監聽器
function setupEventListeners() {
    // Tab切換
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // 搜尋功能
    document.getElementById('searchInput').addEventListener('input', () => {
        filterAndSort();
    });
    
    // 排序功能
    document.getElementById('sortBy').addEventListener('change', () => {
        filterAndSort();
    });
}

// 切換Tab
function switchTab(tabName) {
    // 隱藏所有tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有按鈕的active狀態
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 顯示選中的tab
    document.getElementById(tabName).classList.add('active');
    
    // 設置按鈕為active
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 如果是圖表標籤，重新繪製圖表
    if (tabName === 'roi-analysis') {
        setTimeout(() => {
            redrawCharts();
        }, 100);
    }
}

// 過濾和排序數據
function filterAndSort() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;
    
    // 過濾
    filteredData = cryptoData.filter(item => {
        const symbol = item.symbol.toLowerCase();
        const name = item.name.toLowerCase();
        return symbol.includes(searchTerm) || name.includes(searchTerm);
    });
    
    // 排序
    filteredData.sort((a, b) => {
        if (sortBy === 'rank') {
            return parseInt(a.rank) - parseInt(b.rank);
        } else {
            const valA = parseFloat(a[sortBy]) || 0;
            const valB = parseFloat(b[sortBy]) || 0;
            return valB - valA;
        }
    });
    
    displayTable(filteredData);
}

// 顯示表格
function displayTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        // 提取ROI值
        const roi2020 = parseFloat(row['roi_2020_%']);
        const roi2021 = parseFloat(row['roi_2021_%']);
        const roi2022 = parseFloat(row['roi_2022_%']);
        const roi2023 = parseFloat(row['roi_2023_%']);
        const roi2024 = parseFloat(row['roi_2024_%']);
        const roi5year = parseFloat(row['roi_5year_%']);
        
        tr.innerHTML = `
            <td>${row.rank}</td>
            <td><strong>${row.symbol}</strong></td>
            <td>${row.name}</td>
            <td>$${parseFloat(row.current_price_usd.replace(/,/g, '')).toFixed(2)}</td>
            <td>$${parseFloat(row.market_cap_billions.replace(/,/g, '')).toFixed(2)}</td>
            <td class="${getROIClass(roi2020)}">${roi2020.toFixed(2)}%</td>
            <td class="${getROIClass(roi2021)}">${roi2021.toFixed(2)}%</td>
            <td class="${getROIClass(roi2022)}">${roi2022.toFixed(2)}%</td>
            <td class="${getROIClass(roi2023)}">${roi2023.toFixed(2)}%</td>
            <td class="${getROIClass(roi2024)}">${roi2024.toFixed(2)}%</td>
            <td class="${getROIClass(roi5year)}"><strong>${roi5year.toFixed(2)}%</strong></td>
        `;
        
        tr.style.cursor = 'pointer';
        tr.title = '點擊查看價格走勢';
        tr.addEventListener('click', () => {
            showHistoryChart(row.symbol, row.name);
        });
        
        tbody.appendChild(tr);
    });
}

function showHistoryChart(symbol, name) {
    const container = document.getElementById('history-chart-container');
    const title = document.getElementById('historyChartTitle');
    const canvas = document.getElementById('mainHistoryChart');
    
    if (!cryptoHistory[symbol]) {
        alert('暫無該幣種的歷史資料！');
        return;
    }
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
    title.textContent = `${name} (${symbol}) 歷史價格走勢`;
    
    const historyData = cryptoHistory[symbol];
    const dates = Object.keys(historyData).sort();
    const prices = dates.map(date => historyData[date]);
    
    if (charts.mainHistory) {
        charts.mainHistory.destroy();
    }
    
    charts.mainHistory = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '價格 (USD)',
                data: prices,
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6});
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 12
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000) return '$' + (value/1000).toFixed(1) + 'k';
                            if (value < 0.01) return '$' + value.toFixed(4);
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function closeHistoryChart() {
    document.getElementById('history-chart-container').style.display = 'none';
}

// 獲取ROI CSS類別
function getROIClass(value) {
    if (value > 0) return 'roi-positive';
    if (value < 0) return 'roi-negative';
    return 'roi-neutral';
}

// 填充加密貨幣下拉菜單
function populateCryptoSelect() {
    const select = document.getElementById('selectedCrypto');
    
    cryptoData.forEach(crypto => {
        const option = document.createElement('option');
        option.value = crypto.symbol;
        option.text = `${crypto.symbol} - ${crypto.name}`;
        select.appendChild(option);
    });
}

// 初始化圖表
function initializeCharts() {
    // 1. 各年度投報率對比 (Top 10)
    const top10 = cryptoData.slice(0, 10);
    
    const ctx1 = document.getElementById('yearlyROIChart').getContext('2d');
    charts.yearlyROI = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: top10.map(c => c.symbol),
            datasets: [
                {
                    label: '2020年',
                    data: top10.map(c => parseFloat(c['roi_2020_%'])),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                },
                {
                    label: '2021年',
                    data: top10.map(c => parseFloat(c['roi_2021_%'])),
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                },
                {
                    label: '2022年',
                    data: top10.map(c => parseFloat(c['roi_2022_%'])),
                    backgroundColor: 'rgba(236, 72, 153, 0.8)',
                },
                {
                    label: '2023年',
                    data: top10.map(c => parseFloat(c['roi_2023_%'])),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                },
                {
                    label: '2024年',
                    data: top10.map(c => parseFloat(c['roi_2024_%'])),
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: '投報率 (%)',
                    },
                },
            },
        },
    });
    
    // 2. Top 5 年投報率排名
    const top5by5year = [...cryptoData]
        .sort((a, b) => parseFloat(b['roi_5year_%']) - parseFloat(a['roi_5year_%']))
        .slice(0, 5);
    
    const ctx2 = document.getElementById('top5YearROIChart').getContext('2d');
    charts.top5YearROI = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: top5by5year.map(c => c.symbol),
            datasets: [{
                label: '5年投報率 (%)',
                data: top5by5year.map(c => parseFloat(c['roi_5year_%'])),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                ],
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString() + '%';
                        },
                    },
                },
            },
        },
    });
    
    // 更新統計數據
    updateStats();
}

// 重繪圖表
function redrawCharts() {
    if (charts.yearlyROI) {
        charts.yearlyROI.resize();
    }
    if (charts.top5YearROI) {
        charts.top5YearROI.resize();
    }
}

// 更新統計數據
function updateStats() {
    // 2024年表現最好的
    const best2024 = cryptoData.reduce((max, curr) => {
        return parseFloat(curr['roi_2024_%']) > parseFloat(max['roi_2024_%']) ? curr : max;
    });
    document.getElementById('best2024').textContent = `${best2024.symbol}: ${parseFloat(best2024['roi_2024_%']).toFixed(2)}%`;
    
    // 2024年表現最差的
    const worst2024 = cryptoData.reduce((min, curr) => {
        return parseFloat(curr['roi_2024_%']) < parseFloat(min['roi_2024_%']) ? curr : min;
    });
    document.getElementById('worst2024').textContent = `${worst2024.symbol}: ${parseFloat(worst2024['roi_2024_%']).toFixed(2)}%`;
    
    // 5年最佳投報率
    const best5year = cryptoData.reduce((max, curr) => {
        return parseFloat(curr['roi_5year_%']) > parseFloat(max['roi_5year_%']) ? curr : max;
    });
    document.getElementById('best5year').textContent = `${best5year.symbol}: ${parseFloat(best5year['roi_5year_%']).toFixed(2)}%`;
    
    // 平均5年投報率
    const avg5year = cryptoData.reduce((sum, curr) => {
        return sum + parseFloat(curr['roi_5year_%']);
    }, 0) / cryptoData.length;
    document.getElementById('avg5year').textContent = `${avg5year.toFixed(2)}%`;
}

// DCA計算邏輯
function calculateDCA() {
    const selectedSymbol = document.getElementById('selectedCrypto').value;
    const initialInvestment = parseFloat(document.getElementById('initialInvestment').value);
    const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value);
    const investmentYears = parseInt(document.getElementById('investmentYears').value);
    const investmentStart = parseInt(document.getElementById('investmentStart').value);
    
    if (!selectedSymbol) {
        alert('請選擇一個加密貨幣');
        return;
    }
    
    // 找到選中的加密貨幣
    const crypto = cryptoData.find(c => c.symbol === selectedSymbol);
    
    if (!crypto) {
        alert('找不到該加密貨幣');
        return;
    }
    
    // 計算投資
    const yearsArray = [];
    const roiValues = [];
    
    for (let i = 0; i < investmentYears; i++) {
        const year = investmentStart + i;
        const roiKey = `roi_${year}_%`;
        
        if (year <= 2024 && crypto[roiKey]) {
            yearsArray.push(year);
            roiValues.push(parseFloat(crypto[roiKey]));
        }
    }
    
    if (yearsArray.length === 0) {
        alert('選擇的年份範圍無效');
        return;
    }
    
    // 模擬計算
    let portfolio = initialInvestment;
    const monthlyContributions = [];
    const portfolioValues = [];
    
    // 初始投資
    monthlyContributions.push(portfolio);
    portfolioValues.push(portfolio);
    
    // 逐月投資，應用年度投報率
    const monthsCount = yearsArray.length * 12;
    
    for (let month = 1; month < monthsCount; month++) {
        const yearIndex = Math.floor(month / 12);
        const roi = roiValues[yearIndex] || roiValues[roiValues.length - 1];
        
        // 計算月度投報率
        const monthlyRoi = (1 + roi / 100) ** (1 / 12) - 1;
        
        // 應用投報率和定投金額
        portfolio = portfolio * (1 + monthlyRoi) + monthlyInvestment;
        
        monthlyContributions.push(monthlyInvestment);
        portfolioValues.push(portfolio);
    }
    
    // 總投入
    const totalInvested = initialInvestment + (monthlyInvestment * (monthsCount - 1));
    
    // 最終價值
    const finalValue = portfolio;
    
    // 投資收益
    const profit = finalValue - totalInvested;
    
    // 投報率
    const roi = (profit / totalInvested) * 100;
    
    // 年化收益率
    const years = yearsArray.length;
    const annualRoi = (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100;
    
    // 顯示結果
    document.getElementById('result-total-invested').textContent = `$${totalInvested.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
    document.getElementById('result-final-value').textContent = `$${finalValue.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
    document.getElementById('result-profit').textContent = `$${profit.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
    document.getElementById('result-roi').textContent = `${roi.toFixed(2)}%`;
    document.getElementById('result-annual-roi').textContent = `${annualRoi.toFixed(2)}%`;
    
    // 顯示結果容器
    document.getElementById('dcaResults').style.display = 'block';
    
    // 繪製DCA模擬圖表
    drawDCAChart(yearsArray, portfolioValues, totalInvested);
}

// 繪製DCA模擬圖表
function drawDCAChart(yearsArray, portfolioValues, totalInvested) {
    const ctx = document.getElementById('dcaSimulationChart').getContext('2d');
    
    // 銷毀舊圖表
    if (charts.dcaSimulation) {
        charts.dcaSimulation.destroy();
    }
    
    // 創建月份標籤
    const labels = [];
    for (let i = 0; i < portfolioValues.length; i++) {
        if (i % 12 === 0) {
            labels.push(`${yearsArray[Math.floor(i / 12)] || ''}`);
        } else {
            labels.push('');
        }
    }
    
    charts.dcaSimulation = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '投資組合價值',
                    data: portfolioValues,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: '總投入金額',
                    data: Array(portfolioValues.length).fill(totalInvested),
                    borderColor: 'rgba(107, 114, 128, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'DCA投資模擬結果',
                },
            },
            scales: {
                y: {
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString('en-US', {maximumFractionDigits: 0});
                        },
                    },
                },
            },
        },
    });
}
