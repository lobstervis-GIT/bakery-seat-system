// allocation.service.ts

import { StoreConfig } from '../interfaces/store-config.interface';
import { StoreModel } from '../models/store.model';

export class AllocationService {
  private storeConfig: StoreConfig;
  private storeModel: StoreModel;

  constructor(config: StoreConfig) {
    this.storeConfig = config;
    this.storeModel = new StoreModel(config);
  }

  allocateSeat(): number {
    // 根據 storeConfig 決定劃位邏輯
    return 0; // 預留位置
  }
}