import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

const organisation = 'simmtronic';
const baseUrl = `/organisations/${organisation}`;
const testTaskId = process.env.E2E_SCHEDULE_TASK_ID;

describe('Schedule Entries E2E', () => {
    let app: NestFastifyApplication;

    const createdIds: string[] = []; // track onlu records created by these tests for now

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
        if (!app) return;

        try {
            //remove only entries created by this test suite
            if (createdIds.length > 0) {
                const database = app.get(DatabaseService);

                await database.db
                    .deleteFrom('schedule_entries')
                    .where('id', 'in', createdIds)
                    .execute();
            }
        } finally {
            await app.close();
        }
    });

    // -------------------------------
    // GET TESTS
    // -------------------------------

    // it should be tasks/{id} so setting it to invalid should return a 400 bad request
    it(`GET schedule entries - invalid task ID`, async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/tasks/invalid/schedule-entries`,
        });

        expect(result.statusCode).toEqual(400);
    });

    it(`GET organisation schedule entries`, async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-01-01&to=1970-01-31`,
        });

        expect(result.statusCode).toEqual(200);

        const body = JSON.parse(result.payload);

        expect(Array.isArray(body.records)).toBe(true);
        expect(body.count).toBe(body.records.length);
    });

    it(`GET missing to date`, async () => {
        const result = await app.inject({
            method: `GET`,
            url: `${baseUrl}/schedule-entries?from=1970-01-01`,
        });

        expect(result.statusCode).toBe(400);
    });

    it('GET - from date after to date', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-01-31&to=1970-01-01`,
        });

        expect(result.statusCode).toBe(400);
    });

    it('GET - invalid calendar date', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-02-30&to=1970-03-05`,
        });

        expect(result.statusCode).toBe(400);
    });

    it('GET - incorrect date format', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=01-01-1970&to=31-01-1970`,
        });

        expect(result.statusCode).toBe(400);
    });





});

