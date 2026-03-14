interface SeatingStrategy {
  assignSeats(seats: Seat[], partySize: number): Seat[] | null;
}