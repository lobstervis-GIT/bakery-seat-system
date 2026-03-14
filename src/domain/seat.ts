import { Seat } from './seat.interface';

export class SeatService {
  private seats: Seat[];

  constructor() {
    this.seats = [];
  }

  addSeat(seat: Seat) {
    this.seats.push(seat);
  }

  getSeats() {
    return this.seats;
  }
}