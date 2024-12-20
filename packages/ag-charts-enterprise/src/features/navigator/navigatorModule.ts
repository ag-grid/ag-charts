import { _ModuleSupport } from 'ag-charts-community';

import { Navigator } from './navigator';

const { DEFAULT_INVERTED_BACKGROUND_COLOUR, DEFAULT_NAVIGATOR_STROKE } = _ModuleSupport.ThemeSymbols;

export const NavigatorModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'navigator',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new Navigator(ctx),
    removable: false, // Toggling this module causes zoom state flakiness.
    themeTemplate: {
        navigator: {
            enabled: false,
            height: 18,
            cornerRadius: 4,
            mask: {
                fill: DEFAULT_INVERTED_BACKGROUND_COLOUR,
                fillOpacity: 0.1,
                stroke: DEFAULT_NAVIGATOR_STROKE,
                strokeWidth: 1,
            },
            minHandle: {
                fill: { ref: 'backgroundColor' },
                stroke: DEFAULT_NAVIGATOR_STROKE,
                strokeWidth: 1,
                width: 12,
                height: 24,
                cornerRadius: 4,
            },
            maxHandle: {
                fill: { ref: 'backgroundColor' },
                stroke: DEFAULT_NAVIGATOR_STROKE,
                strokeWidth: 1,
                width: 12,
                height: 24,
                cornerRadius: 4,
            },
            miniChart: {
                enabled: false,
                label: {
                    color: { ref: 'foregroundColor' },
                    fontSize: 10,
                    fontFamily: { ref: 'fontFamily' },
                    spacing: 5,
                },
                padding: {
                    top: 0,
                    bottom: 0,
                },
            },
        },
    },
};
