// Worker Entry Point - Cloudflare Workers
// Routes: /api/public/*, /api/staff/*

import { SeatRepository, StayRepository, StaySeatRepository, TakeoutRepository, AuditLogRepository } from "./infra/d1-repository";
import { StayService } from "./app/stay-service";
import { StatusService } from "./app/status-service";

interface Env {
  DB: D1Database;
  SEAT_COORDINATOR: DurableObjectNamespace;
}

interface D1Database {
  prepare(query: string): any;
  batch(statements: any[]): Promise<any[]>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {}
interface DurableObjectStub {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // Public API
      if (path === "/api/public/status" && request.method === "GET") {
        const statusService = new StatusService(new StayRepository(env.DB));
        const status = await statusService.getPublicStatus();
        return jsonResponse(status);
      }

      if (path === "/api/public/rules" && request.method === "GET") {
        return jsonResponse({
          average_duration_hours: 2,
          group_suggestion: "3 人以上建議提前致電確認座位",
          late_policy: "超過預定時間 30 分鐘未到視為取消",
          notes: ["請穿著輕便服裝", "店內提供圍裙及工具", "完成品需自行攜回"],
        });
      }

      if (path === "/api/public/takeout" && request.method === "POST") {
        const body = await request.json() as Record<string, string>;
        const repo = new TakeoutRepository(env.DB);
        await repo.create({
          id: crypto.randomUUID(),
          customer_name: body.customer_name || "",
          phone: body.phone || "",
          pickup_time: body.pickup_time || "",
          item_note: body.item_note || "",
          status: "pending",
          created_at: new Date().toISOString(),
        });
        return jsonResponse({ success: true, message: "外帶訂單已送出" }, 201);
      }

      // Staff API (TODO: add auth middleware via Cloudflare Access)
      if (path === "/api/staff/dashboard" && request.method === "GET") {
        const stayRepo = new StayRepository(env.DB);
        const takeoutRepo = new TakeoutRepository(env.DB);
        const statusService = new StatusService(stayRepo);

        const status = await statusService.getPublicStatus();
        const pendingTakeouts = await takeoutRepo.findPending();

        return jsonResponse({
          ...status,
          pending_takeout_count: pendingTakeouts.length,
        });
      }

      if (path === "/api/staff/stays/suggest-segments" && request.method === "POST") {
        const body = await request.json() as Record<string, unknown>;
        const service = new StayService(
          new SeatRepository(env.DB),
          new StayRepository(env.DB),
          new StaySeatRepository(env.DB),
          new AuditLogRepository(env.DB),
        );

        const result = await service.suggestSegments(
          body.party_size as number,
          body.start_time as string,
          body.duration_minutes as number,
        );

        return jsonResponse(result);
      }

      if (path === "/api/staff/stays" && request.method === "POST") {
        const body = await request.json() as Record<string, unknown>;
        const service = new StayService(
          new SeatRepository(env.DB),
          new StayRepository(env.DB),
          new StaySeatRepository(env.DB),
          new AuditLogRepository(env.DB),
        );

        const stay = await service.createStay({
          customer_label: (body.customer_label as string) || "",
          phone: body.phone as string,
          party_size: body.party_size as number,
          start_time: body.start_time as string,
          duration_minutes: body.duration_minutes as number,
          note: body.note as string,
          created_by: body.created_by as string || "staff",
        });

        return jsonResponse(stay, 201);
      }

      // /api/staff/stays/:id/extend
      const extendMatch = path.match(/^\/api\/staff\/stays\/([^/]+)\/extend$/);
      if (extendMatch && request.method === "POST") {
        const stayId = extendMatch[1];
        const body = await request.json() as Record<string, unknown>;
        const service = new StayService(
          new SeatRepository(env.DB),
          new StayRepository(env.DB),
          new StaySeatRepository(env.DB),
          new AuditLogRepository(env.DB),
        );
        const updated = await service.extendStay(
          stayId,
          (body.extra_minutes as number) || 30,
          (body.actor as string) || "staff",
        );
        return jsonResponse(updated);
      }

      // /api/staff/stays/:id/end
      const endMatch = path.match(/^\/api\/staff\/stays\/([^/]+)\/end$/);
      if (endMatch && request.method === "POST") {
        const stayId = endMatch[1];
        const body = await request.json() as Record<string, unknown>;
        const service = new StayService(
          new SeatRepository(env.DB),
          new StayRepository(env.DB),
          new StaySeatRepository(env.DB),
          new AuditLogRepository(env.DB),
        );
        await service.endStay(stayId, (body.actor as string) || "staff");
        return jsonResponse({ success: true, message: "已結束離座" });
      }

      if (path === "/api/staff/takeout-orders" && request.method === "GET") {
        const repo = new TakeoutRepository(env.DB);
        const orders = await repo.findPending();
        return jsonResponse(orders);
      }

      return errorResponse("Not Found", 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return errorResponse(message, 500);
    }
  },
};
