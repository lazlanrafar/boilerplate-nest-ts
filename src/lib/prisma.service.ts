import { PrismaClient, Prisma } from '@prisma/client';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, string>
  implements OnModuleInit
{
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {
    super({
      log: [
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'query' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    this.$on('info', (e) => this.logger.log(e));
    this.$on('warn', (e) => this.logger.warn(e));
    this.$on('error', (e) => this.logger.error(e));
    this.$on('query', (e) => this.logger.log(e));
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    const table_names = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    table_names
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    try {
      await this.$transaction([
        ...table_names.map((table) => {
          return this.$executeRawUnsafe(
            `TRUNCATE "public"."${table.tablename}" RESTART IDENTITY CASCADE;`,
          );
        }),
      ]);
    } catch (error) {
      console.log({ error });
      this.logger.error(error);
    }
  }
}
