from src.strategy.seating_strategy import SeatingStrategy
import random

class RandomSeatingStrategy(SeatingStrategy):
    def assign_seat(self, party_size, available_seats):
        if not available_seats:
            return None
        return random.choice(available_seats)