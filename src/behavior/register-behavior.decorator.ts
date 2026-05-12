import { SetMetadata } from '@nestjs/common';
import { BEHAVIOR_METADATA } from './behavior.tokens';

export const RegisterBehavior = (name: string): ClassDecorator =>
  SetMetadata(BEHAVIOR_METADATA, name);
