# 烘焙 DIY 座位管理系統 (Bakery Seat System)

## 專案概述

烘焙 DIY 店內排位與時段占位管理系統。協助店員快速安排座位、管理入座紀錄、顯示忙碌程度。

### V1 目標
- 公開頁面：店內忙碌程度、DIY 規則、外帶填單
- 員工後台：入座分配、延長停留、結束離座
- 座位模型：U 字型 20 席連續線性序列
- LINE 導流至網頁

## 技術架構

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Coordination**: Durable Objects (寫入序列化)
- **Auth**: Cloudflare Access (員工後台)
- **Frontend**: Cloudflare Pages

### 分層設計 (DDD)

| Layer | 職責 |
|-------|------|
| Domain | 時間重疊判定、連續座位掃描、buffer 規則 |
| Application | 建立入座、建議區段、延長停留、對外狀態 |
| Infrastructure | D1 資料存取、Workers runtime、存取控制 |

## 座位模型

position = 1..N (初始 N=20)，同組顧客需連續座位。

### Buffer 規則

| 人數 | Buffer |
|------|--------|
| 1-2 | 0 |
| 3-4 | 1 |
| 5-6 | 2 |
| 7+  | 3 |

## 資料模型

- **Seat**: id, position, is_active
- **Stay**: id, customer_label, phone, party_size, start_time, end_time, status, note
- **StaySeat**: id, stay_id, seat_id, is_buffer
- **TakeoutOrder**: id, customer_name, phone, pickup_time, item_note, status
- **AuditLog**: id, actor, action, target_type, target_id, payload

## API 端點

### 公開 API
- GET /api/public/status
- GET /api/public/rules
- POST /api/public/takeout

### 員工 API
- POST /api/staff/stays
- POST /api/staff/stays/suggest-segments
- POST /api/staff/stays/{id}/allocate
- POST /api/staff/stays/{id}/extend
- POST /api/staff/stays/{id}/end
- GET /api/staff/dashboard
- GET /api/staff/takeout-orders

## Roadmap

- **V1**: 公開頁、忙碌程度、員工後台、入座分配、外帶填單
- **V2**: 團體拆段、偏好區域、報表統計
- **V3**: 多店支援、候位通知、POS/CRM 整合