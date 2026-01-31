import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    req.correlationId = req.headers['x-correlation-id'] || randomUUID();

    res.setHeader('x-correlation-id', req.correlationId);

    next();
  }
}
