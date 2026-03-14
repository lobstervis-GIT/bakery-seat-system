import { Seat } from './seat';
import { Table } from './table';

// 解耦合部分強化
class SeatManagement {
  private seats: Seat[];
  private tables: Table[];

  constructor() {
    this.seats = [];
    this.tables = [];
  }

  // 方法：添加座位
  addSeat(seat: Seat) {
    this.seats.push(seat);
  }

  // 方法：添加桌子
  addTable(table: Table) {
    this.tables.push(table);
  }

  // 方法：根據桌子ID查找座位
  findSeatByTableId(tableId: number) {
    return this.seats.find(seat => seat.tableId === tableId);
  }
}
