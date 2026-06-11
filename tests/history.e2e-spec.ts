import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HistoryModule } from '../src/historyController/history.module'
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

describe('History E2E', () => {
  let app: NestFastifyApplication;

 
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
  imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
    await app.close();
  }
  });

  it('GET /history/data', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/history/data?from=2026-03-25T00:00:00.000Z&to=2026-03-26T00:00:00.000Z',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    expect(body).toBeDefined();
  });
});