import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

describe('Schedule Entries E2E', () => {
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

    // it should be tasks/{id} so setting it to invalid should return a 400 bad request
    it(`GET schedule entries - invalid task ID`, async () => {
        const result = await app.inject({
            method: 'GET',
            url: ' /organisations/simmtronic/tasks/invalid/schedule-entries',
        });

        expect(result.statusCode).toEqual(400);
    });
});

