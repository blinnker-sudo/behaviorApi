import { Body, Controller, Post } from '@nestjs/common';
import { BehaviorRegistry } from '../behavior/behavior-registry.service';
import { DataWorkflowDto } from '../contracts';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly registry: BehaviorRegistry) {}

  @Post('init')
  async init(@Body() dto: DataWorkflowDto): Promise<unknown> {
    return this.registry.run(dto.flow, 'INIT', dto);
  }

  @Post('layout')
  async layout(@Body() dto: DataWorkflowDto): Promise<unknown> {
    return this.registry.run(dto.flow, 'LAYOUT', dto);
  }

  @Post('complete')
  async complete(@Body() dto: DataWorkflowDto): Promise<unknown> {
    return this.registry.run(dto.flow, 'COMPLETE', dto);
  }
}
