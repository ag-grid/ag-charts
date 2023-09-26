import { Background } from './background';
import type { Module } from '../../module/module';

export const BackgroundModule: Module = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'community',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    instanceConstructor: Background,
};
