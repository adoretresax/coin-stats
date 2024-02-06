import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { InstrumentsController } from "./instruments/instruments.controller";
import { InstrumentsService } from "./instruments/instruments.service";
import { InstrumentsModule } from "./instruments/instruments.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InstrumentsModule,
  ],
  controllers: [AppController, HealthController, InstrumentsController],
  providers: [InstrumentsService],
})
export class AppModule {}
