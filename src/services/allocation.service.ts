// allocation.service.ts

import { StoreConfig } from "../interfaces/store-config.interface";
import { AllocationStrategy } from "../interfaces/allocation-strategy.interface";

export class AllocationService {
    private strategy: AllocationStrategy;

    constructor(strategy: AllocationStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: AllocationStrategy) {
        this.strategy = strategy;
    }

    allocateSeat(storeConfig: StoreConfig): Seat | null {
        return this.strategy.allocateSeat(storeConfig);
    }
}