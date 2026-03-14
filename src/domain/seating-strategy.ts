interface SeatingStrategy {
  execute(guests: number, availableSeats: Seat[]): Seat[]
}