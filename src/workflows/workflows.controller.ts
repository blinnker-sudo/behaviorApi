import { Body, Controller, Param, Post } from '@nestjs/common';
import { BehaviorRegistry } from '../behavior/behavior-registry.service';
import { DataWorkflowDto } from '../contracts';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly registry: BehaviorRegistry) {}

  @Post(':name')
  async run(
    @Param('name') name: string,
    @Body() dto: DataWorkflowDto,
  ): Promise<unknown> {
    return this.registry.run(name, dto);
  }
}
