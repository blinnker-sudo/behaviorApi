export type Step = 'INIT' | 'LAYOUT' | 'COMPLETE';

export type FlowDefinition = Record<Step, string[]>;

export interface CountryConfig {
  country: string;
  flows: Record<string, FlowDefinition>;
}
