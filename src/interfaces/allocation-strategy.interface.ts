export interface AllocationStrategy {
  allocateSeat(storeConfig: StoreConfig, partySize: number): Seat | null;
}