#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
加密貨幣投資分析 Demo - 快速啟動腳本
直接運行此腳本即可啟動本地服務器並打開網頁
"""

import os
import sys
import webbrowser
import http.server
import socketserver
import threading
import time
from pathlib import Path

# 配置
PORT = 8000
HOST = 'localhost'
SCRIPT_DIR = Path(__file__).parent.absolute()

def start_server():
    """啟動HTTP服務器"""
    os.chdir(SCRIPT_DIR)
    
    handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"✓ 服務器已啟動")
        print(f"✓ 訪問地址: http://{HOST}:{PORT}")
        print(f"✓ 按 Ctrl+C 停止服務器")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✓ 服務器已停止")
            sys.exit(0)

def main():
    print("=" * 50)
    print("   加密貨幣投資分析 Demo")
    print("=" * 50)
    print()
    
    # 檢查CSV文件
    csv_file = SCRIPT_DIR / 'crypto_data.csv'
    if not csv_file.exists():
        print("❌ 錯誤: 找不到 crypto_data.csv")
        print("   請確保文件在項目目錄中")
        sys.exit(1)
    
    print("✓ 數據文件檢查完成")
    print()
    
    # 在後臺啟動服務器
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # 等待服務器啟動
    time.sleep(1)
    
    # 打開瀏覽器
    url = f"http://{HOST}:{PORT}"
    print(f"✓ 正在打開瀏覽器... {url}")
    print()
    
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"⚠️  無法自動打開瀏覽器: {e}")
        print(f"請手動訪問: {url}")
        print()
    
    # 保持程序運行
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n✓ 程序已停止")
        sys.exit(0)

if __name__ == '__main__':
    main()
