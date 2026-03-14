interface SeatingStrategy {
  assignSeat(customer: Customer, availableSeats: Seat[]): Seat | null;
}