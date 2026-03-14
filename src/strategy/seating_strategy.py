import abc

class SeatingStrategy(abc.ABC):
    """
    劃位策略的抽象類別
    """

    @abc.abstractmethod
    def assign_seat(self, party_size, tables):
        """
        分配座位的方法
        """
        pass