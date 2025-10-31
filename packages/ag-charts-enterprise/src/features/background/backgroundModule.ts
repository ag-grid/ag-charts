import { type AgChartBackground, VERSION } from 'ag-charts-community';
import {
    type PluginModuleDefinition,
    boolean,
    color,
    number,
    positiveNumber,
    ratio,
    required,
    string,
} from 'ag-charts-core';

import { Background } from './background';

export const BackgroundModule: PluginModuleDefinition<AgChartBackground> = {
    type: 'plugin',
    name: 'background',
    enterprise: true,
    version: VERSION,

    options: {
        visible: boolean,
        fill: color,
        image: {
            url: required(string),
            top: number,
            right: number,
            bottom: number,
            left: number,
            width: positiveNumber,
            height: positiveNumber,
            opacity: ratio,
        },
    },

    create: (ctx) => new Background(ctx),
};
