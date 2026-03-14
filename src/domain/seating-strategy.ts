interface SeatingStrategy {
  assignSeat(customer: Customer, seats: Seat[]): Seat | null;
}