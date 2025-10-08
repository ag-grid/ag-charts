import type { ChartType } from './chartTypes';

type EnterpriseModuleStub = {
    packageType?: 'enterprise';
    identifier?: string;
    chartTypes: ChartType[];
    useCount?: number;
    optionsInnerKey?: string;
    community?: boolean;
} & (
    | {
          type: 'axis' | 'axis-option' | 'series' | 'series-option' | 'root' | 'legend';
          optionsKey: string;
      }
    | {
          type: 'context';
          contextKey: string;
      }
);

export const EXPECTED_ENTERPRISE_MODULES: EnterpriseModuleStub[] = [
    {
        type: 'root',
        optionsKey: 'animation',
        chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
    },
    { type: 'root', optionsKey: 'annotations', chartTypes: ['cartesian'] },
    {
        type: 'root',
        optionsKey: 'background',
        chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
        optionsInnerKey: 'image',
    },
    {
        type: 'root',
        optionsKey: 'foreground',
        chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
        optionsInnerKey: 'image',
    },
    {
        type: 'root',
        optionsKey: 'chartToolbar',
        chartTypes: ['cartesian'],
    },
    {
        type: 'root',
        optionsKey: 'contextMenu',
        chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
    },
    { type: 'root', optionsKey: 'statusBar', chartTypes: ['cartesian'], identifier: 'status-bar' },
    {
        type: 'root',
        optionsKey: 'dataSource',
        chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
    },
    { type: 'root', optionsKey: 'sync', chartTypes: ['cartesian'] },
    { type: 'root', optionsKey: 'zoom', chartTypes: ['cartesian', 'topology'] },
    { type: 'root', optionsKey: 'ranges', chartTypes: ['cartesian'] },
    {
        type: 'legend',
        optionsKey: 'gradientLegend',
        chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
        identifier: 'gradient',
    },
    { type: 'root', optionsKey: 'navigator', chartTypes: ['cartesian'] },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-number' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-number' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['cartesian'], identifier: 'ordinal-time' },
    { type: 'axis-option', optionsKey: 'crosshair', chartTypes: ['cartesian'] },
    { type: 'axis-option', optionsKey: 'bandHighlight', chartTypes: ['cartesian'] },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'box-plot' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'candlestick' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'cone-funnel' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'funnel' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'ohlc' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'heatmap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'waterfall' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'nightingale' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-line' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-column' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['topology'], identifier: 'map-shape' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['topology'], identifier: 'map-line' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['topology'], identifier: 'map-marker' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['topology'], identifier: 'map-shape-background' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['topology'], identifier: 'map-line-background' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'pyramid' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'linear-gauge' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'radial-gauge' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'sunburst' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'treemap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'chord' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'sankey' },
    { type: 'series-option', optionsKey: 'errorBar', chartTypes: ['cartesian'], identifier: 'error-bars' },
    { type: 'context', contextKey: 'sharedToolbar', chartTypes: ['cartesian'] },
];
