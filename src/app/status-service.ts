// Application: Status Service (公開狀態)
// 對外顯示忙碌程度，不顯示精確資訊

import type { StayRepository } from "../infra/d1-repository";

export type BusyLevel = "low" | "medium" | "high";

export interface PublicStatus {
  occupied_seats: number;
  total_seats: number;
  busy_level: BusyLevel;
  suggestion: string;
}

export class StatusService {
  constructor(private stayRepo: StayRepository) {}

  async getPublicStatus(): Promise<PublicStatus> {
    const { occupied, total } = await this.stayRepo.countActiveSeats();
    const ratio = total > 0 ? occupied / total : 0;

    let busy_level: BusyLevel;
    let suggestion: string;

    if (ratio < 0.4) {
      busy_level = "low";
      suggestion = "目前店內座位充裕，歡迎直接來店體驗！";
    } else if (ratio < 0.75) {
      busy_level = "medium";
      suggestion = "目前有一定人數在體驗中，建議先致電確認。";
    } else {
      busy_level = "high";
      suggestion = "目前店內較為忙碌，建議擇時再來或先電話詢問。";
    }

    return { occupied_seats: occupied, total_seats: total, busy_level, suggestion };
  }
}
