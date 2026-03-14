import json

# 讀取設定檔
with open("config.json", "r") as f:
    config = json.load(f)

# 根據設定檔調整行為
seat_type = config.get("seat_type", "chair") # 預設為 chair

print(f"座位類型: {seat_type}")

# 這裡可以根據 config 裡的設定來調整其他的行為，例如預約規則等等

print("系統初始化完成")