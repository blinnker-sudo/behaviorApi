import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import {
  Behavior,
  BehaviorContext,
  CountryConfig,
  DataWorkflowDto,
  Step,
} from '../contracts';
import { BEHAVIOR_METADATA, COUNTRY_CONFIG } from './behavior.tokens';

@Injectable()
export class BehaviorRegistry implements OnModuleInit {
  private readonly logger = new Logger(BehaviorRegistry.name);
  private readonly behaviors = new Map<string, Behavior>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    @Inject(COUNTRY_CONFIG) private readonly config: CountryConfig,
  ) {}

  onModuleInit(): void {
    this.discover();
    this.validateConfig();
    this.warnUnused();
  }

  private discover(): void {
    const providers = this.discoveryService.getProviders();
    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') {
        continue;
      }
      const ctor = instance.constructor;
      if (!ctor) {
        continue;
      }
      const name = this.reflector.get<string>(BEHAVIOR_METADATA, ctor);
      if (!name) {
        continue;
      }
      if (this.behaviors.has(name)) {
        throw new Error(
          `Behavior duplicado '${name}': ya está registrado por otra clase`,
        );
      }
      this.behaviors.set(name, instance as Behavior);
    }
  }

  private validateConfig(): void {
    const declared = new Set<string>();
    for (const flow of Object.values(this.config.flows)) {
      for (const step of Object.keys(flow) as Step[]) {
        for (const name of flow[step]) {
          declared.add(name);
        }
      }
    }
    const missing = [...declared].filter((n) => !this.behaviors.has(n));
    if (missing.length > 0) {
      throw new Error(
        `Behaviors declarados en config sin implementación registrada: ${missing.join(
          ', ',
        )}`,
      );
    }
  }

  private warnUnused(): void {
    const declared = new Set<string>();
    for (const flow of Object.values(this.config.flows)) {
      for (const step of Object.keys(flow) as Step[]) {
        for (const name of flow[step]) {
          declared.add(name);
        }
      }
    }
    for (const name of this.behaviors.keys()) {
      if (!declared.has(name)) {
        this.logger.warn(
          `Behavior '${name}' registrado pero no usado por ningún flow del config`,
        );
      }
    }
  }

  async run(flow: string, step: Step, input: DataWorkflowDto): Promise<unknown> {
    const flowDef = this.config.flows[flow];
    if (!flowDef) {
      throw new NotImplementedException(
        `Flow '${flow}' no soportado en ${this.config.country}`,
      );
    }
    const pipeline = flowDef[step];
    if (!pipeline) {
      throw new BadRequestException(`Step '${step}' inválido para flow '${flow}'`);
    }

    const ctx: BehaviorContext = {
      input,
      state: {},
      metadata: {
        country: this.config.country,
        flow,
        step,
        requestId: input.requestId,
        correlationId: input.correlationId,
        attempts: input.attempts ?? 0,
      },
    };

    let lastResult: unknown = undefined;
    for (const name of pipeline) {
      const behavior = this.behaviors.get(name);
      if (!behavior) {
        throw new Error(
          `Behavior '${name}' del pipeline no encontrado en runtime`,
        );
      }
      lastResult = await behavior.execute(ctx);
      ctx.state[name] = lastResult;
    }
    return lastResult;
  }
}
