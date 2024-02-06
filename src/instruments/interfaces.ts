export interface Instrument {
  AllowOnlyMarketMakerCounterParty: boolean;
  CreateWithMarketRunning: boolean;
  InstrumentId: number;
  InstrumentType: string;
  IsDisable: boolean;
  OMSId: number;
  Product1: number;
  Product1Symbol: string;
  Product2: number;
  Product2Symbol: string;
  Symbol: string;
  TickerHistory: TickerHistoryItem[];
}

export interface TickerHistoryItem {
  dateTime: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  insideBidPrice: number;
  insideAskPrice: number;
  instrumentId: number;
}

export interface MessageFrame {
  m: number;
  i: number;
  n: string;
  o: string;
}

export interface TickerHistoryOptions {
  fromDate?: string;
  toDate?: string;
}
