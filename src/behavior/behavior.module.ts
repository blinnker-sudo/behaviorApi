import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BehaviorRegistry } from './behavior-registry.service';

@Module({
  imports: [DiscoveryModule],
  providers: [BehaviorRegistry],
  exports: [BehaviorRegistry],
})
export class BehaviorModule {}
