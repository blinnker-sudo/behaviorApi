import { DynamicModule, Module } from '@nestjs/common';
import { CountryModule } from './country/country.module';
import { BehaviorModule } from './behavior/behavior.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({})
export class AppModule {
  static async register(): Promise<DynamicModule> {
    const country = await CountryModule.forRoot();
    return {
      module: AppModule,
      imports: [country, BehaviorModule, WorkflowsModule],
    };
  }
}
