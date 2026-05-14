import { Module } from '@nestjs/common';
import { MexicoModule } from '@identity/lib-mexico';
import { BehaviorModule } from './behavior/behavior.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [MexicoModule, BehaviorModule, WorkflowsModule],
})
export class AppModule {}
