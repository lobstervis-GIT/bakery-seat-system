class StrategyFactory:
    def __init__(self, strategy_type):
        self.strategy_type = strategy_type

    def create_strategy(self):
        if self.strategy_type == 'bakery':
            return BakeryStrategy()
        elif self.strategy_type == 'restaurant':
            return RestaurantStrategy()
        else:
            raise ValueError('Invalid strategy type')
