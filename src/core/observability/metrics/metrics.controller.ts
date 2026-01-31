import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private metrics: MetricsService) {}

  @Get('/metrics')
  async metricsEndpoint(@Res() res) {
    res.set('Content-Type', 'text/plain');
    res.send(await this.metrics.getMetrics());
  }
}
