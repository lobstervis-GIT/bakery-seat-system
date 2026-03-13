-- Bakery Seat System - D1 Schema
-- Based on whitepaper section 12

CREATE TABLE IF NOT EXISTS seat (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  CHECK (position > 0)
);

CREATE TABLE IF NOT EXISTS stay (
  id TEXT PRIMARY KEY,
  customer_label TEXT NOT NULL DEFAULT "",
  phone TEXT NOT NULL DEFAULT "",
  party_size INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT "seated" CHECK (status IN ("seated", "extended", "left", "cancelled")),
  note TEXT NOT NULL DEFAULT "",
  created_by TEXT NOT NULL DEFAULT "",
  created_at TEXT NOT NULL DEFAULT (datetime("now")),
  updated_at TEXT NOT NULL DEFAULT (datetime("now")),
  CHECK (party_size > 0),
  CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS stay_seat (
  id TEXT PRIMARY KEY,
  stay_id TEXT NOT NULL REFERENCES stay(id) ON DELETE CASCADE,
  seat_id TEXT NOT NULL REFERENCES seat(id),
  is_buffer INTEGER NOT NULL DEFAULT 0,
  UNIQUE(stay_id, seat_id)
);

CREATE TABLE IF NOT EXISTS takeout_order (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT "",
  pickup_time TEXT,
  item_note TEXT NOT NULL DEFAULT "",
  status TEXT NOT NULL DEFAULT "pending" CHECK (status IN ("pending", "confirmed", "ready", "picked_up", "cancelled")),
  created_at TEXT NOT NULL DEFAULT (datetime("now"))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT "{}",
  created_at TEXT NOT NULL DEFAULT (datetime("now"))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stay_status ON stay(status);
CREATE INDEX IF NOT EXISTS idx_stay_time ON stay(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_stay_seat_stay ON stay_seat(stay_id);
CREATE INDEX IF NOT EXISTS idx_stay_seat_seat ON stay_seat(seat_id);
CREATE INDEX IF NOT EXISTS idx_takeout_status ON takeout_order(status);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at);

-- Seed: 20 seats (position 1..20)
INSERT OR IGNORE INTO seat (id, position, is_active) VALUES
  ("seat-01", 1, 1), ("seat-02", 2, 1), ("seat-03", 3, 1), ("seat-04", 4, 1),
  ("seat-05", 5, 1), ("seat-06", 6, 1), ("seat-07", 7, 1), ("seat-08", 8, 1),
  ("seat-09", 9, 1), ("seat-10", 10, 1), ("seat-11", 11, 1), ("seat-12", 12, 1),
  ("seat-13", 13, 1), ("seat-14", 14, 1), ("seat-15", 15, 1), ("seat-16", 16, 1),
  ("seat-17", 17, 1), ("seat-18", 18, 1), ("seat-19", 19, 1), ("seat-20", 20, 1);