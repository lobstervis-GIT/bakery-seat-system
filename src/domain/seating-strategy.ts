interface SeatingStrategy {
  assignSeat(partySize: number): Seat | null;
}