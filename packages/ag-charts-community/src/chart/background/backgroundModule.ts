import type { Module } from '../../module/module';
import { Background } from './background';

export const BackgroundModule: Module = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'community',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion', 'gauge'],
    moduleFactory: (ctx) => new Background(ctx),
};
