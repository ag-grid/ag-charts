import { type AgGradientLegendOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type PluginModuleDefinition,
    and,
    array,
    boolean,
    borderOptionsDef,
    callback,
    colorUnion,
    fontOptionsDef,
    greaterThan,
    legendPositionValidator,
    lessThan,
    number,
    numberFormatValidator,
    padding,
    positiveNumber,
    ratio,
} from 'ag-charts-core';

import { GradientLegend } from './gradientLegend';

export const GradientLegendModule: PluginModuleDefinition<AgGradientLegendOptions> = {
    type: 'plugin',
    name: 'gradientLegend',
    enterprise: true,
    version: VERSION,
    // removable: 'standalone-only',

    options: {
        enabled: boolean,
        position: legendPositionValidator,
        spacing: positiveNumber,
        reverseOrder: boolean,
        border: borderOptionsDef,
        cornerRadius: number,
        padding: padding,
        fill: colorUnion,
        fillOpacity: ratio,
        gradient: {
            preferredLength: positiveNumber,
            thickness: positiveNumber,
        },
        scale: {
            label: {
                ...fontOptionsDef,
                minSpacing: positiveNumber,
                format: numberFormatValidator,
                formatter: callback,
            },
            padding: positiveNumber,
            interval: {
                step: number,
                values: array,
                minSpacing: and(positiveNumber, lessThan('maxSpacing')),
                maxSpacing: and(positiveNumber, greaterThan('minSpacing')),
            },
        },
    },
    themeTemplate: {
        ..._ModuleSupport.LEGEND_CONTAINER_THEME,
        enabled: false,
        position: 'bottom',
        spacing: 20,
        scale: {
            padding: 13,
            label: {
                color: { $ref: 'textColor' },
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                minSpacing: 5,
            },
            interval: {
                minSpacing: 15,
            },
        },
        gradient: {
            preferredLength: 100,
            thickness: 16,
        },
        reverseOrder: false,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $ref: 'chartBackgroundColour' },
                ['gradient', _ModuleSupport.FILL_GRADIENT_BLANK_DEFAULTS],
                ['pattern', _ModuleSupport.FILL_PATTERN_BLANK_DEFAULTS],
                ['image', _ModuleSupport.FILL_IMAGE_BLANK_DEFAULTS],
            ],
        },
    },

    create: (ctx) => {
        const moduleInstance = new GradientLegend(ctx);
        moduleInstance.attachLegend(ctx.scene);
        return moduleInstance;
    },
};
