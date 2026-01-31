import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequests = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status']
  });

  private readonly httpLatency = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Request duration',
    labelNames: ['method', 'route']
  });

  countRequest(method: string, route: string, status: number) {
    this.httpRequests.inc({ method, route, status });
  }

  observeLatency(method: string, route: string, duration: number) {
    this.httpLatency.observe({ method, route }, duration);
  }

  async getMetrics() {
    return client.register.metrics();
  }
}
