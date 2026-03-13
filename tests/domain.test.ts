// Domain Tests - 時間重疊 + 連續座位區段
import { describe, it, expect } from "vitest";
import { isOverlapping, findOverlapping, findConflictingPositions } from "../src/domain/overlap";
import { getBuffer, DEFAULT_BUFFER_RULES } from "../src/domain/types";
import { findAvailableSegments, suggestBestSegment } from "../src/domain/segment-finder";
import type { Seat } from "../src/domain/types";

// === 時間重疊測試 ===
describe("isOverlapping", () => {
  it("detects overlapping ranges", () => {
    expect(isOverlapping(
      { start_time: "2026-01-01T10:00:00Z", end_time: "2026-01-01T12:00:00Z" },
      { start_time: "2026-01-01T11:00:00Z", end_time: "2026-01-01T13:00:00Z" },
    )).toBe(true);
  });

  it("detects non-overlapping ranges", () => {
    expect(isOverlapping(
      { start_time: "2026-01-01T10:00:00Z", end_time: "2026-01-01T12:00:00Z" },
      { start_time: "2026-01-01T12:00:00Z", end_time: "2026-01-01T14:00:00Z" },
    )).toBe(false);
  });

  it("detects contained range", () => {
    expect(isOverlapping(
      { start_time: "2026-01-01T10:00:00Z", end_time: "2026-01-01T14:00:00Z" },
      { start_time: "2026-01-01T11:00:00Z", end_time: "2026-01-01T13:00:00Z" },
    )).toBe(true);
  });

  it("edge case: same start and end", () => {
    expect(isOverlapping(
      { start_time: "2026-01-01T10:00:00Z", end_time: "2026-01-01T12:00:00Z" },
      { start_time: "2026-01-01T10:00:00Z", end_time: "2026-01-01T12:00:00Z" },
    )).toBe(true);
  });
});

// === Buffer 規則測試 ===
describe("getBuffer", () => {
  it("returns 0 for 1-2 people", () => {
    expect(getBuffer(1)).toBe(0);
    expect(getBuffer(2)).toBe(0);
  });

  it("returns 1 for 3-4 people", () => {
    expect(getBuffer(3)).toBe(1);
    expect(getBuffer(4)).toBe(1);
  });

  it("returns 2 for 5-6 people", () => {
    expect(getBuffer(5)).toBe(2);
    expect(getBuffer(6)).toBe(2);
  });

  it("returns 3 for 7+ people", () => {
    expect(getBuffer(7)).toBe(3);
    expect(getBuffer(10)).toBe(3);
    expect(getBuffer(20)).toBe(3);
  });
});

// === 連續座位區段測試 ===
function makeSeats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `seat-${String(i + 1).padStart(2, "0")}`,
    position: i + 1,
    is_active: true,
  }));
}

describe("findAvailableSegments", () => {
  const seats = makeSeats(20);

  it("finds all segments for 2 people with no conflicts", () => {
    const result = findAvailableSegments(seats, 2, new Set());
    // 2 people + 0 buffer = 2 consecutive seats
    // positions 1-2, 2-3, ..., 19-20 = 19 segments
    expect(result.segments.length).toBe(19);
    expect(result.buffer).toBe(0);
    expect(result.total_seats_needed).toBe(2);
  });

  it("finds segments for 4 people (needs 5 seats with buffer)", () => {
    const result = findAvailableSegments(seats, 4, new Set());
    // 4 people + 1 buffer = 5 consecutive seats
    expect(result.total_seats_needed).toBe(5);
    expect(result.buffer).toBe(1);
    expect(result.segments.length).toBe(16); // 20 - 5 + 1
  });

  it("skips conflicting positions", () => {
    // seats 5,6,7 are occupied
    const conflicts = new Set([5, 6, 7]);
    const result = findAvailableSegments(seats, 2, conflicts);
    // No segment should include positions 5, 6, or 7
    for (const seg of result.segments) {
      const positions = [...seg.seats, ...seg.buffer_seats].map(s => s.position);
      expect(positions.every(p => !conflicts.has(p))).toBe(true);
    }
  });

  it("returns empty when no space available", () => {
    // All seats occupied
    const allOccupied = new Set(Array.from({ length: 20 }, (_, i) => i + 1));
    const result = findAvailableSegments(seats, 2, allOccupied);
    expect(result.segments.length).toBe(0);
  });
});

describe("suggestBestSegment", () => {
  const seats = makeSeats(20);

  it("suggests center-most segment", () => {
    const result = findAvailableSegments(seats, 2, new Set());
    const best = suggestBestSegment(result, 20);
    expect(best).not.toBeNull();
    // Center of 20 seats is position 10.5
    // Best 2-seat segment near center: 10-11
    if (best) {
      const center = (best.start_position + best.end_position) / 2;
      expect(Math.abs(center - 10.5)).toBeLessThanOrEqual(1);
    }
  });

  it("returns null when no segments", () => {
    const allOccupied = new Set(Array.from({ length: 20 }, (_, i) => i + 1));
    const result = findAvailableSegments(seats, 2, allOccupied);
    const best = suggestBestSegment(result, 20);
    expect(best).toBeNull();
  });
});
