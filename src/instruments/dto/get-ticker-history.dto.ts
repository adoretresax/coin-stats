export interface GetTickerHistoryDto {
  InstrumentId: number;
  Interval: number;
  FromDate: string;
  ToDate: string;
  OMSId: number;
}
