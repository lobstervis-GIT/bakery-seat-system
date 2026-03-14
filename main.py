import json

# 讀取設定檔
with open('config.json', 'r') as f:
    config = json.load(f)

store_type = config['store_type']
seat_capacity = config['seat_capacity']

# 根據店家類型調整系統行為
if store_type == 'bakery':
    print("這是麵包店")
elif store_type == 'cafe':
    print("這是咖啡店")
else:
    print("這是其他類型的商店")

print(f"座位數量：{seat_capacity}")

# 這裡可以加入更多根據設定檔調整系統行為的程式碼