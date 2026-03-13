// Application: Stay Service - seat management use cases
import type { Stay, StaySeat, SeatSegment, SuggestResult } from "../domain/types";
import { findAvailableSegments } from "../domain/segment-finder";
import type { SeatRepository, StayRepository, StaySeatRepository, AuditLogRepository } from "../infra/d1-repository";

const genId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export interface CreateStayInput {
  customer_label: string;
  phone?: string;
  party_size: number;
  start_time: string;
  duration_minutes: number;
  note?: string;
  created_by: string;
}

export class StayService {
  constructor(
    private seatRepo: SeatRepository,
    private stayRepo: StayRepository,
    private staySeatRepo: StaySeatRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async suggestSegments(partySize: number, startTime: string, durationMin: number): Promise<SuggestResult> {
    const endTime = new Date(new Date(startTime).getTime() + durationMin * 60000).toISOString();
    const allSeats = await this.seatRepo.findAll();
    const occupied = await this.staySeatRepo.findOccupiedPositions(startTime, endTime);
    return findAvailableSegments(allSeats, partySize, new Set(occupied));
  }

  async createStay(input: CreateStayInput): Promise<Stay> {
    const endTime = new Date(new Date(input.start_time).getTime() + input.duration_minutes * 60000).toISOString();
    const stay: Stay = {
      id: genId(), customer_label: input.customer_label, phone: input.phone ?? "",
      party_size: input.party_size, start_time: input.start_time, end_time: endTime,
      status: "seated", note: input.note ?? "", created_by: input.created_by,
      created_at: now(), updated_at: now(),
    };
    await this.stayRepo.create(stay);
    return stay;
  }

  async allocateSegment(stayId: string, segment: SeatSegment, actor: string): Promise<StaySeat[]> {
    const stay = await this.stayRepo.findById(stayId);
    if (!stay) throw new Error("Stay not found");
    if (stay.status === "left" || stay.status === "cancelled") throw new Error("Stay ended");
    const occupied = await this.staySeatRepo.findOccupiedPositions(stay.start_time, stay.end_time);
    const conflictSet = new Set(occupied);
    const allPos = [...segment.seats, ...segment.buffer_seats].map(s => s.position);
    const conflicts = allPos.filter(p => conflictSet.has(p));
    if (conflicts.length > 0) throw new Error("Seats occupied: " + conflicts.join(", "));
    const records: StaySeat[] = [
      ...segment.seats.map(s => ({ id: genId(), stay_id: stayId, seat_id: s.id, is_buffer: false })),
      ...segment.buffer_seats.map(s => ({ id: genId(), stay_id: stayId, seat_id: s.id, is_buffer: true })),
    ];
    await this.staySeatRepo.createBatch(records);
    return records;
  }

  async extendStay(stayId: string, extraMin: number, actor: string): Promise<Stay> {
    const stay = await this.stayRepo.findById(stayId);
    if (!stay) throw new Error("Stay not found");
    if (stay.status === "left") throw new Error("Already ended");
    const newEnd = new Date(new Date(stay.end_time).getTime() + extraMin * 60000).toISOString();
    await this.stayRepo.updateEndTime(stayId, newEnd);
    return { ...stay, end_time: newEnd, status: "extended", updated_at: now() };
  }

  async endStay(stayId: string, actor: string): Promise<void> {
    const stay = await this.stayRepo.findById(stayId);
    if (!stay) throw new Error("Stay not found");
    await this.stayRepo.endStay(stayId);
  }
}
