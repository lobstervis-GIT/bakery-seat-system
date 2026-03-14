import { Seat } from './seat';
import { Table } from './table';

export class SeatService {
  async allocateSeat(seat: Seat, table: Table): Promise<boolean> {
    // 實現座位分配邏輯
  }
}
