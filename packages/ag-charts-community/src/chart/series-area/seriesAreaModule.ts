import type { Module } from '../../module/module';
import { SeriesArea } from './seriesArea';

export const SeriesAreaModule: Module = {
    type: 'root',
    optionsKey: 'seriesArea',
    packageType: 'community',
    chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
    moduleFactory: (ctx) => new SeriesArea(ctx),
};
