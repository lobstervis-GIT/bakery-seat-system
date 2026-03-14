import abc

class Strategy(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def allocate_seat(self, shop_type: str) -> str:
        pass

class StrategyFactory:
    def __init__(self):
        self.strategies = {}

    def register_strategy(self, shop_type: str, strategy: Strategy):
        self.strategies[shop_type] = strategy

    def get_strategy(self, shop_type: str) -> Strategy:
        return self.strategies.get(shop_type)
