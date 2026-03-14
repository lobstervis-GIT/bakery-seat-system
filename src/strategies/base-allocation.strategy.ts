export abstract class BaseAllocationStrategy {
  abstract allocateSeat(storeConfig: any, partySize: number): any;
}