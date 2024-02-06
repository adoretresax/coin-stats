import { WebSocket } from "ws";
import { ConfigService } from "@nestjs/config";
import { Subject, of } from "rxjs";
import { Test, TestingModule } from "@nestjs/testing";
import { InstrumentsService } from "./instruments.service";
import { Instrument } from "./interfaces";

jest.mock("ws");

describe("InstrumentsService", () => {
  let service: InstrumentsService;
  let wsMock: jest.Mocked<typeof WebSocket>;
  let configServiceMock: Partial<jest.Mocked<ConfigService>>;

  beforeEach(async () => {
    wsMock = {
      on: jest.fn(),
      close: jest.fn(),
    };

    (WebSocket as unknown as jest.Mock) = jest.fn(() => wsMock);

    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "WEBSOCKET_URL") {
          return "wss://mocked-url.com";
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<InstrumentsService>(InstrumentsService);
    service["instrumentsSubject"] = new Subject<Instrument[]>();
    service["tickerHistorySubject"] = new Subject<number[][]>();
    jest
      .spyOn(service["instrumentsSubject"], "next")
      .mockImplementation(() => {});
  });

  describe("WebSocket connection", () => {
    it("should connect on module initialization", () => {
      service.onModuleInit();
      expect(WebSocket).toHaveBeenCalled();
      expect(wsMock.on).toHaveBeenCalledTimes(4);
    });
  });

  describe("handleMessage", () => {
    it("should process and emit instrument data", () => {
      const testMessage = JSON.stringify({
        n: "GetInstruments",
        o: JSON.stringify([{ InstrumentId: 1 }]),
      });

      service["handleMessage"](testMessage);
      expect(service["instrumentsSubject"].next).toHaveBeenCalledWith([
        { InstrumentId: 1 },
      ]);
    });
  });

  describe("getTopGainers", () => {
    it("should retrieve and process top gainers", async () => {
      const mockInstruments: Instrument[] = [
        { InstrumentId: 1, Product2Symbol: "THB", OMSId: 1 } as Instrument,
      ];
      const mockTickerHistoryData: number[][] = [[1, 2, 3, 4, 5, 6, 7, 8, 9]];

      jest
        .spyOn(service, "requestInstruments")
        .mockReturnValue(of(mockInstruments));
      jest
        .spyOn(service, "requestTickerHistory")
        .mockReturnValue(of(mockTickerHistoryData));

      const topGainers = await service.getTopGainers(
        1,
        "2021-01-01",
        "2021-12-31"
      );
      expect(topGainers).toBeDefined();
      expect(topGainers).toEqual(mockInstruments);
    });
  });
});
