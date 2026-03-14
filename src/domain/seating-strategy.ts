interface SeatingStrategy {
  findAvailableSeat(seats: Seat[]): Seat | null;
  assignSeat(seat: Seat, customer: Customer): void;
  removeCustomer(seat: Seat): void;
}
