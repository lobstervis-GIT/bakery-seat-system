interface SeatingStrategy {
  execute(tables: Table[], partySize: number): Table | null;
}

interface Table {
  id: string;
  capacity: number;
  isAvailable: boolean;
}