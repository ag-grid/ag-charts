import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';
import { boolean, color, positiveNumber, ratio, strictUnion } from 'ag-charts-core';

import { FlashOnUpdate } from './flashOnUpdate';
import type { AgFlashOnUpdateItem, AgFlashOnUpdateOptions } from './flashOnUpdateTypes';

export const FlashOnUpdateModule: PluginModuleDefinition<AgFlashOnUpdateOptions> = {
    type: 'plugin',
    name: 'flashOnUpdate',
    enterprise: true,
    version: VERSION,
    options: {
        enabled: boolean,
        item: strictUnion<AgFlashOnUpdateItem>()('chart', 'category'),
        fill: color,
        fillOpacity: ratio,
        flashDuration: positiveNumber,
        fadeOutDuration: positiveNumber,
    },
    themeTemplate: {
        enabled: false,
        item: 'chart',
        fill: '#cfeeff',
        fillOpacity: 1,
        flashDuration: 100,
        fadeOutDuration: 900,
    },
    create: (ctx) => new FlashOnUpdate(ctx),
};
