import abc

class Strategy(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def arrange_seat(self, shop_type: str) -> str:
        pass

class ConcreteStrategyA(Strategy):
    def arrange_seat(self, shop_type: str) -> str:
        return f"Arranging seats for {shop_type}"

class ConcreteStrategyB(Strategy):
    def arrange_seat(self, shop_type: str) -> str:
        return f"Arranging seats for {shop_type}"

class StrategyFactory:
    def create_strategy(self, shop_type: str) -> Strategy:
        if shop_type == "A":
            return ConcreteStrategyA()
        elif shop_type == "B":
            return ConcreteStrategyB()
        else:
            raise ValueError("Invalid shop type")
