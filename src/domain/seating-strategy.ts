interface SeatingStrategy {
  getFirstAvailableSeat(seats: Seat[]): Seat | null;
}