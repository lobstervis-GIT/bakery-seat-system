// Domain: 時間重疊判定邏輯
// 兩筆入座紀錄若滿足 A.start < B.end AND B.start < A.end 即為重疊

export interface TimeRange {
  start_time: string;  // ISO 8601
  end_time: string;    // ISO 8601
}

/**
 * 判定兩個時間區間是否重疊
 * Rule: A.start_time < B.end_time AND B.start_time < A.end_time
 */
export function isOverlapping(a: TimeRange, b: TimeRange): boolean {
  const aStart = new Date(a.start_time).getTime();
  const aEnd = new Date(a.end_time).getTime();
  const bStart = new Date(b.start_time).getTime();
  const bEnd = new Date(b.end_time).getTime();

  return aStart < bEnd && bStart < aEnd;
}

/**
 * 從一組入座紀錄中，找出與指定時間區間重疊的所有紀錄
 */
export function findOverlapping<T extends TimeRange>(
  target: TimeRange,
  records: T[],
): T[] {
  return records.filter(record => isOverlapping(target, record));
}

/**
 * 檢查新的入座是否與現有紀錄產生衝突
 * 回傳衝突的座位 position 清單
 */
export function findConflictingPositions(
  newStay: TimeRange,
  occupiedPositions: { position: number; time_range: TimeRange }[],
): number[] {
  return occupiedPositions
    .filter(op => isOverlapping(newStay, op.time_range))
    .map(op => op.position);
}
