import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorrelationMiddleware } from './core/observability/correlation/ index';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation and transformation for all incoming requests.
  // - whitelist: removes properties not defined in DTOs
  // - forbidNonWhitelisted: throws 400 if extra properties are sent
  // - transform: enables class-transformer (@Transform, @Type)
  // - implicit conversion disabled to keep transformations explicit
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false
      }
    })
  );

  app.use(new CorrelationMiddleware().use);

  // Enable CORS if a frontend will consume this API
  // app.enableCors({ origin: true, credentials: true });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
