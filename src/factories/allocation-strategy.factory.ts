// allocation-strategy.factory.ts

import { AllocationStrategy } from "../interfaces/allocation-strategy.interface";
import { FIFOAllocationStrategy } from "../strategies/fifo-allocation.strategy";
import { LIFOAllocationStrategy } from "../strategies/lifo-allocation.strategy";

export class AllocationStrategyFactory {
    static create(strategyType: string): AllocationStrategy {
        switch (strategyType) {
            case "fifo":
                return new FIFOAllocationStrategy();
            case "lifo":
                return new LIFOAllocationStrategy();
            default:
                return new FIFOAllocationStrategy(); // 預設策略
        }
    }
}