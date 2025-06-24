import type { Module } from '../module/module';
import { Locale } from './locale';

export const LocaleModule: Module = {
    type: 'root',
    optionsKey: 'locale',
    packageType: 'community',
    chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
    moduleFactory: (ctx) => new Locale(ctx),
};
