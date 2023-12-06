import type { ExampleType } from '../types';

export const isGeneratedExample = (type: ExampleType) => ['generated', 'mixed', 'typescript'].includes(type);
