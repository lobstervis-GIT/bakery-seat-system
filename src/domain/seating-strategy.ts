interface SeatingStrategy {
  assignSeat(seatManagement: SeatManagement): Seat | null;
}