import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  health() {
    return {
      status: 'ok',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }
}
