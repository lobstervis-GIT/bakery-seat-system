// Infrastructure: D1 Repository
// Data access layer - depends on Cloudflare D1

import type { Seat, Stay, StaySeat, TakeoutOrder, AuditLog } from "../domain/types";

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T> {
  results?: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

/** 居位 Repository */
export class SeatRepository {
  constructor(private db: D1Database) {}

  async findAll(): Promise<Seat[]> {
    const result = await this.db
      .prepare("SELECT id, position, is_active FROM seat WHERE is_active = 1 ORDER BY position")
      .all<Seat>();
    return result.results ?? [];
  }

  async findByPositions(positions: number[]): Promise<Seat[]> {
    const placeholders = positions.map(() => "?").join(",");
    const result = await this.db
      .prepare(`SELECT id, position, is_active FROM seat WHERE position IN (${placeholders}) AND is_active = 1`)
      .bind(...positions)
      .all<Seat>();
    return result.results ?? [];
  }
}

/** 入居資認 Repository */
export class StayRepository {
  constructor(private db: D1Database) {}

  async findActiveByTimeRange(startTime: string, endTime: string): Promise<Stay[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM stay
         WHERE status IN ("seated", "extended")
         AND start_time < ? AND end_time > ?
         ORDER BY start_time`
      )
      .bind(endTime, startTime)
      .all<Stay>();
    return result.results ?? [];
  }

  async findById(id: string): Promise<Stay | null> {
    return this.db
      .prepare("SELECT * FROM stay WHERE id = ?")
      .bind(id)
      .first<Stay>();
  }

  async create(stay: Stay): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO stay (id, customer_label, phone, party_size, start_time, end_time, status, note, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        stay.id, stay.customer_label, stay.phone, stay.party_size,
        stay.start_time, stay.end_time, stay.status, stay.note,
        stay.created_by, stay.created_at, stay.updated_at,
      )
      .run();
  }

  async updateEndTime(id: string, newEndTime: string): Promise<void> {
    await this.db
      .prepare("UPDATE stay SET end_time = ?, status = "extended", updated_at = datetime("now") WHERE id = ?")
      .bind(newEndTime, id)
      .run();
  }

  async endStay(id: string): Promise<void> {
    await this.db
      .prepare("UPDATE stay SET status = "left", end_time = datetime("now"), updated_at = datetime("now") WHERE id = ?")
      .bind(id)
      .run();
  }

  async countActiveSeats(): Promise<{ occupied: number; total: number }> {
    const occupied = await this.db
      .prepare(
        `SELECT COUNT(DISTINCT ss.seat_id) as count
         FROM stay_seat ss JOIN stay s ON ss.stay_id = s.id
         WHERE s.status IN ("seated", "extended")`
      )
      .first<{ count: number }>("count");
    const total = await this.db
      .prepare("SELECT COUNT(*) as count FROM seat WHERE is_active = 1")
      .first<{ count: number }>("count");
    return { occupied: occupied ?? 0, total: total ?? 20 };
  }
}

/** 入居-居位解给 Repository */
export class StaySeatRepository {
  constructor(private db: D1Database) {}

  async createBatch(records: StaySeat[]): Promise<void> {
    const stmts = records.map(r =>
      this.db
        .prepare("INSERT INTO stay_seat (id, stay_id, seat_id, is_buffer) VALUES (?, ?, ?, ?)")
        .bind(r.id, r.stay_id, r.seat_id, r.is_buffer ? 1 : 0)
    );
    await this.db.batch(stmts);
  }

  async findByStayId(stayId: string): Promise<StaySeat[]> {
    const result = await this.db
      .prepare("SELECT * FROM stay_seat WHERE stay_id = ?")
      .bind(stayId)
      .all<StaySeat>();
    return result.results ?? [];
  }

  async findOccupiedPositions(startTime: string, endTime: string): Promise<number[]> {
    const result = await this.db
      .prepare(
        `SELECT DISTINCT seat.position
         FROM stay_seat ss
         JOIN stay s ON ss.stay_id = s.id
         JOIN seat ON ss.seat_id = seat.id
         WHERE s.status IN ("seated", "extended")
         AND s.start_time < ? AND s.end_time > ?
         ORDER BY seat.position`
      )
      .bind(endTime, startTime)
      .all<{ position: number }>();
    return (result.results ?? []).map(r => r.position);
  }
}

/** 外取配件 Repository */
export class TakeoutRepository {
  constructor(private db: D1Database) {}

  async create(order: TakeoutOrder): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO takeout_order (id, customer_name, phone, pickup_time, item_note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(order.id, order.customer_name, order.phone, order.pickup_time, order.item_note, order.status, order.created_at)
      .run();
  }

  async findPending(): Promise<TakeoutOrder[]> {
    const result = await this.db
      .prepare("SELECT * FROM takeout_order WHERE status IN ("pending", "confirmed") ORDER BY pickup_time")
      .all<TakeoutOrder>();
    return result.results ?? [];
  }
}

/** 审批日認 Repository */
export class AuditLogRepository {
  constructor(private db: D1Database) {}

  async create(log: AuditLog): Promise<void> {
    await this.db
      .prepare("INSERT INTO audit_log (id, actor, action, target_type, target_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(log.id, log.actor, log.action, log.target_type, log.target_id, JSON.stringify(log.payload), log.created_at)
      .run();
  }
}
