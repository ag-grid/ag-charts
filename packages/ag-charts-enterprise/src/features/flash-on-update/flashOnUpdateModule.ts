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
        color: color,
        opacity: ratio,
        flashDuration: positiveNumber,
        fadeDuration: positiveNumber,
    },
    themeTemplate: {
        enabled: false,
        item: 'chart',
        color: '#cfeeff',
        opacity: 1,
        flashDuration: 100,
        fadeDuration: 900,
    },
    create: (ctx) => new FlashOnUpdate(ctx),
};
