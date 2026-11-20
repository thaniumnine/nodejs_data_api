import { Test, TestingModule } from '@nestjs/testing';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { AppModule } from '../../src/app.module';

export const organisation = 'simmtronic';
export const baseUrl = `/organisations/${organisation}`;
export const testTaskId = 1;

export async function createScheduleTestApp(): Promise<NestFastifyApplication> {
    const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .compile();

    const app = moduleRef.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    return app;
}
