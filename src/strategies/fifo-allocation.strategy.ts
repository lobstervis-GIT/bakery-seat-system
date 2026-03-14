// fifo-allocation.strategy.ts

import { AllocationStrategy } from '../interfaces/allocation-strategy.interface';
import { Seat } from '../domain/seat';

export class FIFOAllocationStrategy implements AllocationStrategy {
  allocate(seats: Seat[]): Seat | null {
    // 簡單的先進先出策略：找到第一個可用的座位
    const availableSeat = seats.find(seat => !seat.isOccupied);
    return availableSeat || null;
  }
}