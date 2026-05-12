import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryModule } from '@nestjs/core';
import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { BehaviorRegistry } from './behavior-registry.service';
import { RegisterBehavior } from './register-behavior.decorator';
import { COUNTRY_CONFIG } from './behavior.tokens';
import {
  Behavior,
  BehaviorContext,
  CountryConfig,
  DataWorkflowDto,
} from '../contracts';

@Injectable()
@RegisterBehavior('a')
class BehaviorA implements Behavior {
  readonly name = 'a';
  async execute(): Promise<string> {
    return 'A';
  }
}

@Injectable()
@RegisterBehavior('b')
class BehaviorB implements Behavior {
  readonly name = 'b';
  async execute(ctx: BehaviorContext): Promise<{ prev: unknown }> {
    return { prev: ctx.state['a'] };
  }
}

@Injectable()
@RegisterBehavior('unused')
class UnusedBehavior implements Behavior {
  readonly name = 'unused';
  async execute(): Promise<null> {
    return null;
  }
}

const buildDto = (overrides: Partial<DataWorkflowDto> = {}): DataWorkflowDto =>
  ({
    flow: 'f',
    requestId: 'req-1',
    ...overrides,
  } as DataWorkflowDto);

const buildModule = async (
  config: CountryConfig,
  providers: unknown[] = [BehaviorA, BehaviorB, UnusedBehavior],
): Promise<TestingModule> => {
  return Test.createTestingModule({
    imports: [DiscoveryModule],
    providers: [
      BehaviorRegistry,
      { provide: COUNTRY_CONFIG, useValue: config },
      ...(providers as never[]),
    ],
  }).compile();
};

describe('BehaviorRegistry', () => {
  it('ejecuta behaviors en orden y propaga ctx.state', async () => {
    const module = await buildModule({
      country: 'TEST',
      flows: { f: { INIT: ['a', 'b'], LAYOUT: [], COMPLETE: [] } },
    });
    await module.init();
    const reg = module.get(BehaviorRegistry);

    const result = await reg.run('f', 'INIT', buildDto());
    expect(result).toEqual({ prev: 'A' });
  });

  it('lanza NotImplementedException si el flow no existe', async () => {
    const module = await buildModule({
      country: 'TEST',
      flows: { f: { INIT: ['a'], LAYOUT: [], COMPLETE: [] } },
    });
    await module.init();
    const reg = module.get(BehaviorRegistry);

    await expect(reg.run('otro', 'INIT', buildDto())).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it('lanza BadRequestException si el step es inválido', async () => {
    const module = await buildModule({
      country: 'TEST',
      flows: { f: { INIT: ['a'], LAYOUT: [], COMPLETE: [] } },
    });
    await module.init();
    const reg = module.get(BehaviorRegistry);

    await expect(
      reg.run('f', 'NOPE' as never, buildDto()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('falla en boot si un behavior declarado no está registrado', async () => {
    const module = await buildModule(
      {
        country: 'TEST',
        flows: {
          f: { INIT: ['a', 'no-existe'], LAYOUT: [], COMPLETE: [] },
        },
      },
      [BehaviorA],
    );
    await expect(module.init()).rejects.toThrow(/no-existe/);
  });
});
