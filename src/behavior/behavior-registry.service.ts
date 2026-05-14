import { Injectable, NotImplementedException, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { Behavior, BehaviorContext, DataWorkflowDto } from '../contracts';
import { BEHAVIOR_METADATA } from './behavior.tokens';

@Injectable()
export class BehaviorRegistry implements OnModuleInit {
  private readonly behaviors = new Map<string, Behavior>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    this.discover();
  }

  private discover(): void {
    for (const wrapper of this.discoveryService.getProviders()) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;
      const ctor = instance.constructor;
      if (!ctor) continue;
      const name = this.reflector.get<string>(BEHAVIOR_METADATA, ctor);
      if (!name) continue;
      if (this.behaviors.has(name)) {
        throw new Error(`Behavior duplicado '${name}'`);
      }
      this.behaviors.set(name, instance as Behavior);
    }
  }

  async run(name: string, input: DataWorkflowDto): Promise<unknown> {
    const behavior = this.behaviors.get(name);
    if (!behavior) {
      throw new NotImplementedException(`Behavior '${name}' no registrado`);
    }
    const ctx: BehaviorContext = {
      input,
      state: {},
      metadata: { requestId: input.requestId },
    };
    return behavior.execute(ctx);
  }
}
