// Domain barrel export
export { isOverlapping, findOverlapping, findConflictingPositions } from "./overlap";
export type { TimeRange } from "./overlap";
export { findAvailableSegments, suggestBestSegment } from "./segment-finder";
export { getBuffer, DEFAULT_BUFFER_RULES } from "./types";
export type {
  Seat, Stay, StaySeat, StayStatus,
  TakeoutOrder, TakeoutStatus,
  AuditLog, BufferRule, SeatSegment, SuggestResult,
} from "./types";
