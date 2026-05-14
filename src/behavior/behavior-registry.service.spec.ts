import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryModule } from '@nestjs/core';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { BehaviorRegistry } from './behavior-registry.service';
import { Behavior, DataWorkflowDto } from '../contracts';

@Injectable()
class BehaviorA implements Behavior {
  readonly name = 'a';
  async execute(): Promise<string> {
    return 'A';
  }
}

@Injectable()
class BehaviorB implements Behavior {
  readonly name = 'b';
  async execute(): Promise<string> {
    return 'B';
  }
}

const buildDto = (overrides: Partial<DataWorkflowDto> = {}): DataWorkflowDto =>
  ({
    flow: 'f',
    requestId: 'req-1',
    ...overrides,
  } as DataWorkflowDto);

const buildModule = async (
  providers: unknown[] = [BehaviorA, BehaviorB],
): Promise<TestingModule> => {
  return Test.createTestingModule({
    imports: [DiscoveryModule],
    providers: [BehaviorRegistry, ...(providers as never[])],
  }).compile();
};

describe('BehaviorRegistry', () => {
  it('descubre behaviors por propiedad name y los ejecuta', async () => {
    const module = await buildModule();
    await module.init();
    const reg = module.get(BehaviorRegistry);

    expect(await reg.run('a', buildDto())).toBe('A');
    expect(await reg.run('b', buildDto())).toBe('B');
  });

  it('lanza NotImplementedException si el behavior no existe', async () => {
    const module = await buildModule();
    await module.init();
    const reg = module.get(BehaviorRegistry);

    await expect(reg.run('no-existe', buildDto())).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });
});
