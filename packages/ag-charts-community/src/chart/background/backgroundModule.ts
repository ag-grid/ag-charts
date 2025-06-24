import type { Module } from '../../module/module';
import { Background } from './background';

export const BackgroundModule: Module = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'community',
    chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
    moduleFactory: (ctx) => new Background(ctx),
};
