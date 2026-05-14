import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BehaviorModule } from '../behavior/behavior.module';
import { WorkflowsModule } from './workflows.module';
import { MexicoModule } from '@identity/lib-mexico';

const buildApp = async (): Promise<INestApplication> => {
  const module = await Test.createTestingModule({
    imports: [MexicoModule, BehaviorModule, WorkflowsModule],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  return app;
};

const body = (data?: {
  name: string;
  correlationId: string;
}): Record<string, unknown> => ({
  flow: 'n2',
  requestId: 'req-test',
  ...(data ? { data } : {}),
});

describe('Workflows integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /workflows/compare.ocr responde 201 con datos válidos', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/compare.ocr')
      .send(body({ name: 'N2', correlationId: 'corr-abc' }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ valid: true });
  });

  it('POST /workflows/compare.ocr sin correlationId retorna invalid', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/compare.ocr')
      .send(body());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ valid: false, reason: 'missing-correlation-id' });
  });

  it('POST /workflows/no-existe responde 501', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/no-existe')
      .send(body());
    expect(res.status).toBe(501);
  });
});
