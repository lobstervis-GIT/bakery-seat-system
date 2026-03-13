// Durable Object: SeatCoordinator
// Serializes all seat allocation writes to prevent race conditions

interface Env {
  DB: D1Database;
}

interface D1Database {
  prepare(query: string): any;
  batch(statements: any[]): Promise<any[]>;
}

export class SeatCoordinator {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const body = await request.json() as Record<string, unknown>;
      const action = body.action as string;

      switch (action) {
        case "allocate":
          return await this.handleAllocate(body);
        case "extend":
          return await this.handleExtend(body);
        case "end":
          return await this.handleEnd(body);
        default:
          return this.json({ error: "Unknown action" }, 400);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Internal error";
      return this.json({ error: msg }, 500);
    }
  }

  private json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleAllocate(body: Record<string, unknown>): Promise<Response> {
    const stayId = body.stay_id as string;
    const seatIds = body.seat_ids as string[];
    const partySize = body.party_size as number;
    const startTime = body.start_time as string;
    const endTime = body.end_time as string;

    // Double-check conflicts at write time
    const conflicts = await this.checkConflicts(seatIds, startTime, endTime, stayId);
    if (conflicts.length > 0) {
      return this.json({ error: "Seat conflict", conflicting_seats: conflicts }, 409);
    }

    const stmts = seatIds.map((seatId: string, idx: number) =>
      this.env.DB
        .prepare("INSERT INTO stay_seat (id, stay_id, seat_id, is_buffer) VALUES (?, ?, ?, ?)")
        .bind(crypto.randomUUID(), stayId, seatId, idx >= partySize ? 1 : 0)
    );
    await this.env.DB.batch(stmts);

    return this.json({ success: true, allocated: seatIds.length });
  }

  private async handleExtend(body: Record<string, unknown>): Promise<Response> {
    const stayId = body.stay_id as string;
    const newEndTime = body.new_end_time as string;

    const stay = await this.env.DB
      .prepare("SELECT end_time FROM stay WHERE id = ?")
      .bind(stayId)
      .first() as { end_time: string } | null;
    if (!stay) return this.json({ error: "Stay not found" }, 404);

    const staySeats = await this.env.DB
      .prepare("SELECT seat_id FROM stay_seat WHERE stay_id = ?")
      .bind(stayId)
      .all();
    const seatIds = (staySeats.results ?? []).map((r: any) => r.seat_id);

    const conflicts = await this.checkConflicts(seatIds, stay.end_time, newEndTime, stayId);
    if (conflicts.length > 0) {
      return this.json({ error: "Extension conflicts", conflicting_seats: conflicts }, 409);
    }

    await this.env.DB
      .prepare('UPDATE stay SET end_time = ?, status = "extended", updated_at = datetime("now") WHERE id = ?')
      .bind(newEndTime, stayId)
      .run();

    return this.json({ success: true, new_end_time: newEndTime });
  }

  private async handleEnd(body: Record<string, unknown>): Promise<Response> {
    const stayId = body.stay_id as string;
    await this.env.DB
      .prepare('UPDATE stay SET status = "left", end_time = datetime("now"), updated_at = datetime("now") WHERE id = ?')
      .bind(stayId)
      .run();
    return this.json({ success: true });
  }

  private async checkConflicts(
    seatIds: string[], startTime: string, endTime: string, excludeStayId: string,
  ): Promise<string[]> {
    const placeholders = seatIds.map(() => "?").join(",");
    const result = await this.env.DB
      .prepare(
        `SELECT DISTINCT ss.seat_id FROM stay_seat ss JOIN stay s ON ss.stay_id = s.id
         WHERE ss.seat_id IN (${placeholders}) AND s.id != ?
         AND s.status IN ("seated", "extended") AND s.start_time < ? AND s.end_time > ?`
      )
      .bind(...seatIds, excludeStayId, endTime, startTime)
      .all();
    return (result.results ?? []).map((r: any) => r.seat_id);
  }
}
