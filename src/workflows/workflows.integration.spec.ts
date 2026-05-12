import { Global, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BehaviorModule } from '../behavior/behavior.module';
import { COUNTRY_CONFIG } from '../behavior/behavior.tokens';
import { WorkflowsModule } from './workflows.module';
import { MexicoModule } from '@identity/lib-mexico';
import { PeruModule } from '@identity/lib-peru';
import { CountryConfig } from '../contracts';
import mexicoConfig from '../country/configs/mexico.behaviors.json';
import peruConfig from '../country/configs/peru.behaviors.json';

const buildConfigModule = (cfg: CountryConfig): unknown => {
  @Global()
  @Module({
    providers: [{ provide: COUNTRY_CONFIG, useValue: cfg }],
    exports: [COUNTRY_CONFIG],
  })
  class TestConfigModule {}
  return TestConfigModule;
};

const buildApp = async (
  countryModule: unknown,
  cfg: CountryConfig,
): Promise<INestApplication> => {
  const module = await Test.createTestingModule({
    imports: [
      buildConfigModule(cfg) as never,
      countryModule as never,
      BehaviorModule,
      WorkflowsModule,
    ],
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

const body = (
  flow: string,
  data?: { name: string; correlationId: string },
): Record<string, unknown> => ({
  flow,
  requestId: 'req-test',
  ...(data ? { data } : {}),
});

describe('Workflows integration (MX)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp(MexicoModule, mexicoConfig as CountryConfig);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /workflows/init con onboarding responde 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/init')
      .send(body('onboarding'));
    expect(res.status).toBe(201);
  });

  it('POST /workflows/init con credit-application responde 201 (MX lo tiene)', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/init')
      .send(body('credit-application'));
    expect(res.status).toBe(201);
  });

  it('POST /workflows/init con flow inexistente responde 501', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/init')
      .send(body('no-existe'));
    expect(res.status).toBe(501);
  });
});

describe('Workflows integration (PE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp(PeruModule, peruConfig as CountryConfig);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /workflows/init con onboarding responde 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/init')
      .send(body('onboarding'));
    expect(res.status).toBe(201);
  });

  it('POST /workflows/init con credit-application responde 501 (PE no lo tiene)', async () => {
    const res = await request(app.getHttpServer())
      .post('/workflows/init')
      .send(body('credit-application'));
    expect(res.status).toBe(501);
  });
});
