import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { WebSocket } from "ws";
import { Observable, Subject, take, throwError, firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { GetInstrumentsDto, GetTickerHistoryDto } from "./dto";
import { Instrument, TickerHistoryItem, MessageFrame } from "./interfaces";

/**
 * Service for managing instrument data over a WebSocket connection.
 */
@Injectable()
export class InstrumentsService implements OnModuleInit, OnModuleDestroy {
  private ws: WebSocket;
  private instrumentsSubject: Subject<Instrument[]>;
  private tickerHistorySubject: Subject<number[][]>;
  private isConnected: boolean = false;

  constructor(private configService: ConfigService) {
    this.instrumentsSubject = new Subject<Instrument[]>();
    this.tickerHistorySubject = new Subject<number[][]>();
  }

  /**
   * Initializes the WebSocket connection when the module is initialized.
   */
  onModuleInit() {
    this.connectToWebSocket();
  }

  /**
   * Closes the WebSocket connection when the module is destroyed.
   */
  onModuleDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Connects to the WebSocket using the URL from the configuration service.
   * Sets up event handlers for various WebSocket events.
   */
  private connectToWebSocket() {
    const wsUrl = this.configService.get<string>("WEBSOCKET_URL");
    if (!wsUrl) {
      throw new Error(
        "WebSocket URL is not defined in the environment settings."
      );
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.on("open", () => this.onWebSocketOpen());
    this.ws.on("message", (data) => this.handleMessage(data));
    this.ws.on("error", (error) => this.handleError(error));
    this.ws.on("close", () => this.handleClose());
  }

  /**
   * Handles the 'open' event of the WebSocket.
   */
  private onWebSocketOpen() {
    console.log("WebSocket connected");
    this.isConnected = true;
  }

  /**
   * Processes messages received from the WebSocket.
   */
  private handleMessage(data: WebSocket.Data) {
    const message = data.toString("utf-8");
    try {
      const parsedData: MessageFrame = JSON.parse(message);
      if (parsedData && parsedData.n === "GetInstruments") {
        this.instrumentsSubject.next(JSON.parse(parsedData.o));
      } else if (parsedData && parsedData.n === "GetTickerHistory") {
        this.tickerHistorySubject.next(JSON.parse(parsedData.o));
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }

  /**
   * Handles errors from the WebSocket.
   */
  private handleError(error: Error) {
    console.error("WebSocket error:", error);
  }

  /**
   * Handles the 'close' event of the WebSocket.
   */
  private handleClose() {
    console.log("WebSocket disconnected");
  }

  /**
   * Requests instrument data via the WebSocket.
   */
  requestInstruments(OMSId: number): Observable<Instrument[]> {
    if (!this.isConnected) {
      console.error("WebSocket connection not established.");
      return throwError(
        () => new Error("WebSocket connection not established")
      );
    }

    const payload: GetInstrumentsDto = { OMSId };
    const frame: MessageFrame = {
      m: 0,
      i: 0,
      n: "GetInstruments",
      o: JSON.stringify(payload),
    };

    this.ws.send(JSON.stringify(frame));
    return this.instrumentsSubject.asObservable().pipe(take(1));
  }

  /**
   * Requests ticker history data via the WebSocket.
   */
  requestTickerHistory(payload: GetTickerHistoryDto): Observable<number[][]> {
    const frame: MessageFrame = {
      m: 0,
      i: 0,
      n: "GetTickerHistory",
      o: JSON.stringify(payload),
    };

    this.ws.send(JSON.stringify(frame));
    return this.tickerHistorySubject.asObservable().pipe(take(1));
  }

  /**
   * Retrieves top gainers based on given criteria.
   */
  async getTopGainers(
    omsId: number,
    FromDate: string,
    ToDate: string
  ): Promise<Instrument[]> {
    const instruments = await firstValueFrom(this.requestInstruments(omsId));
    const filteredInstruments = instruments.filter(
      (i) => i.Product2Symbol === "THB"
    );

    let tickerHistories: Instrument[] = [];
    for (const instrument of filteredInstruments) {
      const tickerHistoryRaw: number[][] = await firstValueFrom(
        this.requestTickerHistory({
          InstrumentId: instrument.InstrumentId,
          Interval: 60,
          FromDate,
          ToDate,
          OMSId: instrument.OMSId,
        })
      );

      instrument.TickerHistory =
        this.convertToTickerHistoryItems(tickerHistoryRaw);
      tickerHistories = tickerHistories.concat(instrument);
    }
    return tickerHistories;
  }

  /**
   * Converts raw ticker history data into TickerHistoryItem objects.
   */
  private convertToTickerHistoryItems(
    response: number[][]
  ): TickerHistoryItem[] {
    return response.map((item) => ({
      dateTime: item[0],
      high: item[1],
      low: item[2],
      open: item[3],
      close: item[4],
      volume: item[5],
      insideBidPrice: item[6],
      insideAskPrice: item[7],
      instrumentId: item[8],
    }));
  }
}
