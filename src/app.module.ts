import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './lib/prisma.service';
import { ValidationService } from './lib/validation.service';

import { HttpExceptionFilter } from './http-exception.filter';

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'debug',
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [
    PrismaService,
    ValidationService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  exports: [PrismaService, ValidationService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply().forRoutes('/api/*');
  }
}
