// Domain Types - 烘焙 DIY 座位管理系統
// Domain Layer: 不依賴 Cloudflare/DB/Web framework

/** 座位狀態 */
export interface Seat {
  id: string;
  position: number;  // 1..N (初始 N=20)
  is_active: boolean;
}

/** 入座紀錄狀態 */
export type StayStatus = "seated" | "extended" | "left" | "cancelled";

/** 入座紀錄 */
export interface Stay {
  id: string;
  customer_label: string;
  phone: string;
  party_size: number;
  start_time: string;  // ISO 8601
  end_time: string;     // ISO 8601
  status: StayStatus;
  note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** 入座-座位關聯 */
export interface StaySeat {
  id: string;
  stay_id: string;
  seat_id: string;
  is_buffer: boolean;
}

/** 外帶訂單狀態 */
export type TakeoutStatus = "pending" | "confirmed" | "ready" | "picked_up" | "cancelled";

/** 外帶訂單 */
export interface TakeoutOrder {
  id: string;
  customer_name: string;
  phone: string;
  pickup_time: string;
  item_note: string;
  status: TakeoutStatus;
  created_at: string;
}

/** 審計日誌 */
export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Buffer 規則 */
export interface BufferRule {
  min_party_size: number;
  max_party_size: number;
  buffer: number;
}

/** 預設 Buffer 規則 */
export const DEFAULT_BUFFER_RULES: BufferRule[] = [
  { min_party_size: 1, max_party_size: 2, buffer: 0 },
  { min_party_size: 3, max_party_size: 4, buffer: 1 },
  { min_party_size: 5, max_party_size: 6, buffer: 2 },
  { min_party_size: 7, max_party_size: Infinity, buffer: 3 },
];

/** 根據人數取得 buffer 值 */
export function getBuffer(partySize: number, rules: BufferRule[] = DEFAULT_BUFFER_RULES): number {
  const rule = rules.find(r => partySize >= r.min_party_size && partySize <= r.max_party_size);
  return rule?.buffer ?? 0;
}

/** 連續座位區段 */
export interface SeatSegment {
  start_position: number;
  end_position: number;   // inclusive
  seats: Seat[];
  buffer_seats: Seat[];
}

/** 建議區段結果 */
export interface SuggestResult {
  segments: SeatSegment[];
  party_size: number;
  buffer: number;
  total_seats_needed: number;
}

