interface SeatingStrategy {
  execute(seats: Seat[], partySize: number): Seat | null;
}