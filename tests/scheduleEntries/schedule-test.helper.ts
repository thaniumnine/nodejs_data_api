import { Test, TestingModule } from '@nestjs/testing';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { AppModule } from '../../src/app.module';
import { sql } from 'kysely';
import { DatabaseService } from '../../src/database/database.service';
import { OrganisationService } from '../../src/organisations/organisations.service';

export const organisation = 'simmtronic';
export const baseUrl = `/organisations/${organisation}`;
export const testTaskId = 1;

// Identifies records belonging to the test fixtures.
const testDeviceId = 'QSE-TEST-SCHEDULE-1970';
const testRuleId = 'FDD_TEST_SCHEDULING';
const testEngineerId = 'test-schedule-engineer';

async function seedScheduleTestData(app: NestFastifyApplication) {
    const database = app.get(DatabaseService);
    const organisationService = app.get(OrganisationService);

    // Never populate a production database accidentally.
    const connection = await database.query<{ database_name: string }>(
        'SELECT current_database() AS database_name',
    );

    const databaseName = connection.rows[0]?.database_name ?? '';

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not configured.');
    }

    const hostname = new URL(databaseUrl).hostname;

    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(hostname);

    const isLocalTest =
        databaseName === 'postgres' &&
        isLocal &&
        process.env.CI !== 'true';

    const isCiTest =
        databaseName === 'ci_test' &&
        isLocal &&
        process.env.CI === 'true' &&
        process.env.ALLOW_SCHEDULING_TEST_SEED === 'true';

    if (!isLocalTest && !isCiTest) {
        throw new Error(
            `Refusing to seed database ${databaseName} on ${hostname}`,
        );
    }

    // The organisation must already exist after project setup.
    const metadata =
        await organisationService.queryOrganisationMetadata(organisation);

    await database.db.transaction().execute(async trx => {
        // Prevent duplicate fixture creation if multiple suites start.
        await sql`
            SELECT pg_advisory_xact_lock(
                hashtext('schedule-e2e-fixtures'),
                1970
            )
        `.execute(trx);

        // Check whether task 1 already exists.
        const existingTask = await sql<{
            device_id: string;
            org_ref_id: string;
        }>`
            SELECT
                di.device_id,
                di.org_ref_id::text AS org_ref_id
            FROM public.task_entries te
            JOIN public.sim_fdd_assignment a
                ON a.id = te.assignment_id
            JOIN public.sim_fdd_history h
                ON h.id = a.fdd_history_id
            JOIN public.sim_device_identifier di
                ON di.id = h.device_ref_id
            WHERE te.task_id = ${testTaskId}
        `.execute(trx);

        if (existingTask.rows.length > 0) {
            const isOurFixture = existingTask.rows.every(
                row =>
                    row.device_id === testDeviceId &&
                    row.org_ref_id === String(metadata.id),
            );

            if (!isOurFixture) {
                throw new Error(
                    'Task ID 1 is already used by non-test data.',
                );
            }

            return;
        }

        // 1. FIND OR CREATE A TEST DEVICE
        let device = await sql<{ id: string }>`
            SELECT id::text AS id
            FROM public.sim_device_identifier
            WHERE device_id = ${testDeviceId}
              AND org_ref_id = ${metadata.id}
            LIMIT 1
        `.execute(trx);

        if (!device.rows.length) {
            device = await sql<{ id: string }>`
                INSERT INTO public.sim_device_identifier (
                    org_ref_id,
                    building,
                    level,
                    device_id
                )
                VALUES (
                    ${metadata.id},
                    'GB-LON-TEST',
                    'level-01',
                    ${testDeviceId}
                )
                RETURNING id::text AS id
            `.execute(trx);
        }

        const deviceId = device.rows[0].id;

        // 2. FIND OR CREATE AN FDD FINDING
        let finding = await sql<{ id: string }>`
            SELECT id::text AS id
            FROM public.sim_fdd_history
            WHERE device_ref_id = ${deviceId}::bigint
              AND rule_id = ${testRuleId}
            LIMIT 1
        `.execute(trx);

        if (!finding.rows.length) {
            finding = await sql<{ id: string }>`
            INSERT INTO public.sim_fdd_history (
                device_ref_id,
                timestamp,
                room,
                closed,
                rule_id,
                estimated_minutes
            )
            VALUES (
                ${deviceId}::bigint,
                '1970-01-01T09:00:00Z',
                'Test Room',
                FALSE,
                ${testRuleId},
                240
            )
            RETURNING id::text AS id
        `.execute(trx);
        }

        const findingId = finding.rows[0].id;

        // 3. FIND OR CREATE AN FDD ASSIGNMENT
        let assignment = await sql<{ id: string }>`
            SELECT id::text AS id
            FROM public.sim_fdd_assignment
            WHERE fdd_history_id = ${findingId}::bigint
              AND firebase_user_id = ${testEngineerId}
            LIMIT 1
        `.execute(trx);

        if (!assignment.rows.length) {
            assignment = await sql<{ id: string }>`
                INSERT INTO public.sim_fdd_assignment (
                    fdd_history_id,
                    firebase_user_id,
                    timestamp
                )
                VALUES (
                    ${findingId}::bigint,
                    ${testEngineerId},
                    '1970-01-02T09:00:00Z'
                )
                RETURNING id::text AS id
            `.execute(trx);
        }

        const assignmentId = assignment.rows[0].id;

        // 4. CREATE TASK 1
        await sql`
            INSERT INTO public.task_entries (
                task_id,
                assignment_id
            )
            VALUES (
                ${testTaskId},
                ${assignmentId}::bigint
            )
            ON CONFLICT (task_id, assignment_id)
            DO NOTHING
        `.execute(trx);

        // Keep the task sequence ahead of existing IDs.
        await sql`
            SELECT setval(
                'public.task_id_seq',
                GREATEST(
                    (SELECT COALESCE(MAX(task_id), 1)
                     FROM public.task_entries),
                    (SELECT last_value
                     FROM public.task_id_seq)
                ),
                true
            )
        `.execute(trx);
    });

    console.log('Scheduling test fixture ready: Task 1');
}

export async function createScheduleTestApp(): Promise<NestFastifyApplication> {
    const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideGuard(JwtAuthGuard)
        .useValue({
            canActivate: () => true,
        })
        .compile();

    const app = moduleRef.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
    );

    try {
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        await seedScheduleTestData(app);

        return app;
    } catch (error) {
        await app.close();
        throw error;
    }
}


export async function cleanupScheduleTestData(
    app: NestFastifyApplication,
): Promise<void> {
    const database = app.get(DatabaseService);
    const organisationService = app.get(OrganisationService);

    const metadata =
        await organisationService.queryOrganisationMetadata(organisation);

    await database.db.transaction().execute(async trx => {
        // Use the same lock as the seed function.
        await sql`
            SELECT pg_advisory_xact_lock(
                hashtext('schedule-e2e-fixtures'),
                1970
            )
        `.execute(trx);

        // Find the exact records belonging to our test task.
        const fixture = await sql<{
            assignment_id: string;
            finding_id: string;
            device_ref_id: string;
            device_id: string;
            rule_id: string;
            firebase_user_id: string;
            org_ref_id: string;
        }>`
            SELECT
                te.assignment_id::text AS assignment_id,
                h.id::text AS finding_id,
                di.id::text AS device_ref_id,
                di.device_id,
                h.rule_id,
                a.firebase_user_id,
                di.org_ref_id::text AS org_ref_id
            FROM public.task_entries te
            JOIN public.sim_fdd_assignment a
                ON a.id = te.assignment_id
            JOIN public.sim_fdd_history h
                ON h.id = a.fdd_history_id
            JOIN public.sim_device_identifier di
                ON di.id = h.device_ref_id
            WHERE te.task_id = ${testTaskId}
        `.execute(trx);

        // Nothing to clean up.
        if (fixture.rows.length === 0) {
            return;
        }

        // Never delete a task unless it is exactly our fixture.
        if (
            fixture.rows.length !== 1 ||
            fixture.rows[0].device_id !== testDeviceId ||
            fixture.rows[0].rule_id !== testRuleId ||
            fixture.rows[0].firebase_user_id !== testEngineerId ||
            fixture.rows[0].org_ref_id !== String(metadata.id)
        ) {
            throw new Error(
                'Refusing cleanup: Task contains non-test data.',
            );
        }

        const record = fixture.rows[0];

        // 1. Remove test bookings.
        await sql`
            DELETE FROM public.schedule_entries
            WHERE task_id = ${testTaskId}
        `.execute(trx);

        // 2. Remove the task assignment link.
        await sql`
            DELETE FROM public.task_entries
            WHERE task_id = ${testTaskId}
              AND assignment_id = ${record.assignment_id}::bigint
        `.execute(trx);

        // 3. Remove the test FDD assignment.
        await sql`
            DELETE FROM public.sim_fdd_assignment
            WHERE id = ${record.assignment_id}::bigint
        `.execute(trx);

        // 4. Remove the test FDD finding.
        await sql`
            DELETE FROM public.sim_fdd_history
            WHERE id = ${record.finding_id}::bigint
        `.execute(trx);

        // 5. Remove the test device.
        await sql`
            DELETE FROM public.sim_device_identifier
            WHERE id = ${record.device_ref_id}::bigint
        `.execute(trx);
    });

    console.log('Scheduling test fixtures cleaned up.');
}
