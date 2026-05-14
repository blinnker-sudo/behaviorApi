import { DataWorkflowDto } from './dto/data-workflow.dto';

export interface BehaviorMetadata {
  requestId: string;
}

export interface BehaviorContext<TInput = DataWorkflowDto> {
  input: TInput;
  state: Record<string, unknown>;
  metadata: BehaviorMetadata;
}

export interface Behavior<TInput = DataWorkflowDto, TOutput = unknown> {
  readonly name: string;
  execute(ctx: BehaviorContext<TInput>): Promise<TOutput>;
}
