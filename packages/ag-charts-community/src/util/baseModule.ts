import type { JsonApplyParams } from './json';

export interface ModuleInstance {
    destroy(): void;
}

export interface BaseModule {
    optionsKey: string;
    packageType: 'community' | 'enterprise';
    chartTypes: ('cartesian' | 'polar' | 'hierarchy')[];
    identifier?: string;

    optionConstructors?: JsonApplyParams['constructors'];
}
