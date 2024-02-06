import { Test, TestingModule } from "@nestjs/testing";
import { InstrumentsController } from "./instruments.controller";
import { InstrumentsService } from "./instruments.service";
import { Instrument } from "./interfaces";
import { Response } from "express";

jest.mock("./instruments.service");

describe("InstrumentsController", () => {
  let controller: InstrumentsController;
  let service: InstrumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstrumentsController],
      providers: [InstrumentsService],
    }).compile();

    controller = module.get<InstrumentsController>(InstrumentsController);
    service = module.get<InstrumentsService>(InstrumentsService);
  });

  const mockResponse = (): Partial<Response> => ({
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  });

  it("should return top gainers data", async () => {
    const mockInstruments: Instrument[] = [];
    jest.spyOn(service, "getTopGainers").mockResolvedValue(mockInstruments);

    const res = mockResponse();

    await controller.getTopGainers(
      1,
      "2020-07-18",
      "2024-01-01",
      res as Response
    );

    expect(service.getTopGainers).toHaveBeenCalledWith(
      1,
      "2020-07-18",
      "2024-01-01"
    );
    expect(res.json).toHaveBeenCalledWith(mockInstruments);
  });
});
