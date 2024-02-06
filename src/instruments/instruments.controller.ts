import { Controller, Get, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { InstrumentsService } from "./instruments.service";

// Controller that handles API routes under the 'api' path
@Controller("api")
export class InstrumentsController {
  constructor(private instrumentsService: InstrumentsService) {}

  // API endpoint to get the top gainers.
  // Accepts 'omsId', 'fromDate', and 'toDate' as query parameters.
  @Get("get-top-gainers")
  async getTopGainers(
    @Query("omsId") omsId: number,
    @Query("fromDate") fromDate: string = "2020-07-18",
    @Query("toDate") toDate: string,
    @Res() res: Response
  ) {
    toDate = toDate || new Date().toISOString().split("T")[0];

    try {
      const data = await this.instrumentsService.getTopGainers(
        omsId,
        fromDate,
        toDate
      );
      res.json(data);
    } catch (err) {
      console.error(err);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "An error occurred" });
    }
  }
}
