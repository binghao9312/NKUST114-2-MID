#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
加密貨幣數據獲取和分析腳本
從CoinGecko API獲取前20大加密貨幣的歷史數據，計算投報率
"""

import requests
import csv
import json
from datetime import datetime
from typing import Dict, List, Tuple
import time

def get_top_cryptocurrencies(limit: int = 20) -> List[Dict]:
    """
    獲取前N大加密貨幣的基本信息
    """
    url = "https://api.coingecko.com/api/v3/global"
    
    # 首先獲取前20大加密貨幣的ID
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": limit,
        "page": 1,
        "sparkline": False
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching top cryptocurrencies: {e}")
        return []

def get_historical_price(crypto_id: str, days: int = 1826) -> Dict[str, float]:
    """
    獲取加密貨幣的歷史價格
    days: 天數（1826天 ≈ 5年）
    """
    url = f"https://api.coingecko.com/api/v3/coins/{crypto_id}/market_chart"
    params = {
        "vs_currency": "usd",
        "days": days,
        "interval": "daily"
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # 返回日期-價格映射
        prices = {}
        for timestamp, price in data['prices']:
            date = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d')
            prices[date] = price
        
        return prices
    except requests.exceptions.RequestException as e:
        print(f"Error fetching historical data for {crypto_id}: {e}")
        return {}

def calculate_roi_for_year(prices: Dict[str, float], year: int) -> Tuple[float, str, str]:
    """
    計算某年的投報率
    """
    year_start = f"{year}-01-01"
    year_end = f"{year}-12-31"
    
    # 找到該年度最接近的價格
    start_price = None
    end_price = None
    
    sorted_dates = sorted(prices.keys())
    
    for date in sorted_dates:
        if date >= year_start and start_price is None:
            start_price = prices[date]
            start_date = date
        if date <= year_end:
            end_price = prices[date]
            end_date = date
    
    if start_price and end_price and start_price > 0:
        roi = ((end_price - start_price) / start_price) * 100
        return roi, start_date, end_date
    
    return None, None, None

def fetch_and_process_data():
    """
    主函數：獲取數據並生成CSV
    """
    print("正在獲取前20大加密貨幣信息...")
    top_cryptos = get_top_cryptocurrencies(20)
    
    if not top_cryptos:
        print("無法獲取加密貨幣數據")
        return
    
    result_data = []
    all_history_data = {}
    
    for idx, crypto in enumerate(top_cryptos):
        print(f"處理 {idx + 1}/20: {crypto['name']} ({crypto['symbol'].upper()})")
        
        crypto_id = crypto['id']
        symbol = crypto['symbol'].upper()
        name = crypto['name']
        market_cap = crypto.get('market_cap', 0)
        market_cap_rank = crypto.get('market_cap_rank', 0)
        
        # 獲取歷史數據
        historical_prices = get_historical_price(crypto_id)
        
        if historical_prices:
            # 計算每年的投報率
            roi_2020, start_2020, end_2020 = calculate_roi_for_year(historical_prices, 2020)
            roi_2021, start_2021, end_2021 = calculate_roi_for_year(historical_prices, 2021)
            roi_2022, start_2022, end_2022 = calculate_roi_for_year(historical_prices, 2022)
            roi_2023, start_2023, end_2023 = calculate_roi_for_year(historical_prices, 2023)
            roi_2024, start_2024, end_2024 = calculate_roi_for_year(historical_prices, 2024)
            
            # 計算5年投報率（2020-2024）
            price_2020_start = None
            price_2024_end = None
            
            sorted_dates = sorted(historical_prices.keys())
            for date in sorted_dates:
                if date >= "2020-01-01":
                    price_2020_start = historical_prices[date]
                    break
            
            for date in reversed(sorted_dates):
                if date <= "2024-12-31":
                    price_2024_end = historical_prices[date]
                    break
            
            roi_5year = None
            if price_2020_start and price_2024_end and price_2020_start > 0:
                roi_5year = ((price_2024_end - price_2020_start) / price_2020_start) * 100
            
            if historical_prices:
                sorted_dates = sorted(historical_prices.keys())
                current_price = historical_prices[sorted_dates[-1]] if sorted_dates else crypto.get('current_price', 0)
            else:
                current_price = crypto.get('current_price', 0)
            
            row = {
                'rank': market_cap_rank,
                'symbol': symbol,
                'name': name,
                'current_price_usd': f"{current_price:,.2f}" if current_price else "N/A",
                'market_cap_billions': f"{market_cap / 1e9:,.2f}" if market_cap else "N/A",
                'roi_2020_%': f"{roi_2020:.2f}" if roi_2020 is not None else "N/A",
                'roi_2021_%': f"{roi_2021:.2f}" if roi_2021 is not None else "N/A",
                'roi_2022_%': f"{roi_2022:.2f}" if roi_2022 is not None else "N/A",
                'roi_2023_%': f"{roi_2023:.2f}" if roi_2023 is not None else "N/A",
                'roi_2024_%': f"{roi_2024:.2f}" if roi_2024 is not None else "N/A",
                'roi_5year_%': f"{roi_5year:.2f}" if roi_5year is not None else "N/A",
            }
            
            result_data.append(row)
        
        if historical_prices:
            all_history_data[symbol] = historical_prices
            
        # 避免API限速
        time.sleep(1)
    
    # 保存歷史數據為JSON
    import json
    with open('crypto_history.json', 'w', encoding='utf-8') as f:
        json.dump(all_history_data, f, indent=2)
    print(f"✓ 歷史價格折線圖數據已保存至 crypto_history.json")
    
    # 保存為CSV
    csv_filename = 'crypto_data.csv'
    if result_data:
        with open(csv_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['rank', 'symbol', 'name', 'current_price_usd', 'market_cap_billions',
                         'roi_2020_%', 'roi_2021_%', 'roi_2022_%', 'roi_2023_%', 'roi_2024_%', 'roi_5year_%']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            writer.writerows(result_data)
        
        print(f"\n✓ 數據已保存到 {csv_filename}")
        print(f"✓ 共處理 {len(result_data)} 個加密貨幣")
    else:
        print("無法處理任何加密貨幣數據")

if __name__ == '__main__':
    fetch_and_process_data()
