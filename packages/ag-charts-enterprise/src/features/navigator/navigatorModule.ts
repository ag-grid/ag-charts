import { _ModuleSupport } from 'ag-charts-community';

import { Navigator } from './navigator';

const { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR } = _ModuleSupport.ThemeSymbols;

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
            height: 30,
            mask: {
                fill: '#999999',
                stroke: '#999999',
                strokeWidth: 1,
                fillOpacity: 0.2,
            },
            minHandle: {
                fill: '#f2f2f2',
                stroke: '#999999',
                strokeWidth: 1,
                width: 9,
                height: 16,
                gripLineGap: 1,
                gripLineLength: 8,
            },
            maxHandle: {
                fill: '#f2f2f2',
                stroke: '#999999',
                strokeWidth: 1,
                width: 9,
                height: 16,
                gripLineGap: 1,
                gripLineLength: 8,
            },
            miniChart: {
                enabled: false,
                label: {
                    color: DEFAULT_LABEL_COLOUR,
                    fontSize: 10,
                    fontFamily: DEFAULT_FONT_FAMILY,
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
