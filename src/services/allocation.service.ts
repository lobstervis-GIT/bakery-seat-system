// allocation.service.ts

import { AllocationStrategy } from '../interfaces/allocation-strategy.interface';
import { FIFOAllocationStrategy } from '../strategies/fifo-allocation.strategy';

export class AllocationService {
  private allocationStrategy: AllocationStrategy;

  constructor() {
    this.allocationStrategy = new FIFOAllocationStrategy();
  }

  allocateSeat(storeConfig: any): any {
    return this.allocationStrategy.allocate(storeConfig);
  }
}