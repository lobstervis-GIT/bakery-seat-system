// Domain: 連續座位區段搜尋演算法
import type { Seat, SeatSegment, SuggestResult } from "./types";
import { getBuffer } from "./types";
import type { TimeRange } from "./overlap";
import { findConflictingPositions } from "./overlap";

/**
 * 在可用座位中尋找所有可容納指定人數的連續區段
 *
 * @param allSeats - 所有座位 (sorted by position)
 * @param partySize - 顧客人數
 * @param conflictingPositions - 該時段已被占用的座位 position
 * @returns 所有可用的連續區段
 */
export function findAvailableSegments(
  allSeats: Seat[],
  partySize: number,
  conflictingPositions: Set<number>,
): SuggestResult {
  const buffer = getBuffer(partySize);
  const totalNeeded = partySize + buffer;

  // 篩選出可用座位 (active 且不在衝突清單中)
  const activeSeats = allSeats
    .filter(s => s.is_active && !conflictingPositions.has(s.position))
    .sort((a, b) => a.position - b.position);

  const segments: SeatSegment[] = [];

  // 滑動窗口尋找連續區段
  for (let i = 0; i <= activeSeats.length - totalNeeded; i++) {
    const candidate = activeSeats.slice(i, i + totalNeeded);

    // 檢查是否為連續的 position
    const isConsecutive = candidate.every((seat, idx) => {
      if (idx === 0) return true;
      return seat.position === candidate[idx - 1].position + 1;
    });

    if (isConsecutive) {
      const mainSeats = candidate.slice(0, partySize);
      const bufferSeats = candidate.slice(partySize);

      segments.push({
        start_position: candidate[0].position,
        end_position: candidate[candidate.length - 1].position,
        seats: mainSeats,
        buffer_seats: bufferSeats,
      });
    }
  }

  return {
    segments,
    party_size: partySize,
    buffer,
    total_seats_needed: totalNeeded,
  };
}

/**
 * 建議最佳區段 (優先選擇靠中間的位置，減少座位碎片化)
 */
export function suggestBestSegment(
  result: SuggestResult,
  totalSeats: number,
): SeatSegment | null {
  if (result.segments.length === 0) return null;
  if (result.segments.length === 1) return result.segments[0];

  // 計算每個區段到中心的距離，選最接近中心的
  const center = (totalSeats + 1) / 2;
  return result.segments.reduce((best, seg) => {
    const segCenter = (seg.start_position + seg.end_position) / 2;
    const bestCenter = (best.start_position + best.end_position) / 2;
    return Math.abs(segCenter - center) < Math.abs(bestCenter - center) ? seg : best;
  });
}
