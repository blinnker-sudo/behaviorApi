import { Injectable, NotImplementedException, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { Behavior, BehaviorContext, DataWorkflowDto } from '../contracts';

@Injectable()
export class BehaviorRegistry implements OnModuleInit {
  private readonly behaviors = new Map<string, Behavior>();

  constructor(private readonly discoveryService: DiscoveryService) {}

  onModuleInit(): void {
    this.discover();
  }

  private discover(): void {
    for (const wrapper of this.discoveryService.getProviders()) {
      if (!wrapper.metatype) continue;
      const instance = wrapper.instance as Partial<Behavior> | null;
      if (!instance) continue;
      if (typeof instance.name !== 'string') continue;
      if (typeof instance.execute !== 'function') continue;
      if (this.behaviors.has(instance.name)) {
        throw new Error(`Behavior duplicado '${instance.name}'`);
      }
      this.behaviors.set(instance.name, instance as Behavior);
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
