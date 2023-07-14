import type { ExampleType } from '../types.d';

export const isGeneratedExample = (type: ExampleType) => ['generated', 'mixed', 'typescript'].includes(type);
