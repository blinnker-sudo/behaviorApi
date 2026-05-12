import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { BehaviorModule } from '../behavior/behavior.module';

@Module({
  imports: [BehaviorModule],
  controllers: [WorkflowsController],
})
export class WorkflowsModule {}
