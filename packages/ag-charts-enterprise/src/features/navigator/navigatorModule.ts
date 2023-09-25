import type { _ModuleSupport } from 'ag-charts-community';
import { Navigator } from './navigator';

export const NavigatorModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'navigator',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Navigator,
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
                width: 8,
                height: 16,
                gripLineGap: 2,
                gripLineLength: 8,
            },
            maxHandle: {
                fill: '#f2f2f2',
                stroke: '#999999',
                strokeWidth: 1,
                width: 8,
                height: 16,
                gripLineGap: 2,
                gripLineLength: 8,
            },
        },
    },
};
