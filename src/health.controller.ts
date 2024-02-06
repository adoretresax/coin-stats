import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

// mainly for ECS healthcheck
@Controller("health")
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  public checkHealth(): Record<string, unknown> {
    return { status: "ok" };
  }
}
