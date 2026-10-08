import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security HTTP Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Enable CORS with 24-hour preflight cache
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    maxAge: 86400,
  });

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Production Global Exception Filter (Prevent stack trace leak)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Validation Pipe with strict whitelisting
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Enable Graceful Shutdown Hooks
  app.enableShutdownHooks();

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Clinic Patient Management System API')
    .setDescription('REST API with Role-Based Access Control, Patient 360, and Real KHQR (pay-helper) Engine')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`[Clinic Backend] Running on http://localhost:${port}`);
  console.log(`[Swagger Docs] Available on http://localhost:${port}/api/docs`);
  console.log(`[Health Probe] Available on http://localhost:${port}/api/health`);
}

bootstrap();
