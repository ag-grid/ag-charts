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
        chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
    },
    { type: 'root', optionsKey: 'annotations', chartTypes: ['cartesian'] },
    {
        type: 'root',
        optionsKey: 'background',
        chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
        optionsInnerKey: 'image',
    },
    {
        type: 'root',
        optionsKey: 'foreground',
        chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
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
        chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
    },
    { type: 'root', optionsKey: 'statusBar', chartTypes: ['cartesian'], identifier: 'status-bar' },
    {
        type: 'root',
        optionsKey: 'dataSource',
        chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
    },
    { type: 'root', optionsKey: 'sync', chartTypes: ['cartesian'] },
    { type: 'root', optionsKey: 'zoom', chartTypes: ['cartesian', 'topology'] },
    { type: 'root', optionsKey: 'ranges', chartTypes: ['cartesian'] },
    {
        type: 'legend',
        optionsKey: 'gradientLegend',
        chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
        identifier: 'gradient',
    },
    { type: 'root', optionsKey: 'navigator', chartTypes: ['cartesian'] },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-number' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-number' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'bar', community: true },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'line', community: true },
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
    { type: 'series', optionsKey: 'series[]', chartTypes: ['flow-proportion'], identifier: 'chord' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['flow-proportion'], identifier: 'sankey' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'pyramid' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'linear-gauge' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'radial-gauge' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'sunburst' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['standalone'], identifier: 'treemap' },
    { type: 'series-option', optionsKey: 'errorBar', chartTypes: ['cartesian'], identifier: 'error-bars' },
    { type: 'context', contextKey: 'sharedToolbar', chartTypes: ['cartesian'] },
];

export function isEnterpriseSeriesType(type: string) {
    return EXPECTED_ENTERPRISE_MODULES.some((s) => s.type === 'series' && s.identifier === type);
}

function getEnterpriseSeriesChartTypes(type: string) {
    return EXPECTED_ENTERPRISE_MODULES.find((s) => s.type === 'series' && s.identifier === type)?.chartTypes;
}

export function isEnterpriseCartesian(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'cartesian');
    return type === 'cartesian';
}
export function isEnterprisePolar(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'polar');
    return type === 'polar';
}
export function isEnterpriseTopology(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'topology');
    return type === 'topology';
}
export function isEnterpriseFlowProportion(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'flow-proportion');
    return type === 'flow-proportion';
}
export function isEnterpriseStandalone(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'standalone');
    return type === 'standalone';
}

type UnknownPackage = { packageType: string } | EnterpriseModuleStub;
function isEnterpriseModule(module: UnknownPackage): module is EnterpriseModuleStub {
    return module.packageType === 'enterprise';
}

export function verifyIfModuleExpected(module: UnknownPackage) {
    if (!isEnterpriseModule(module)) {
        throw new Error('AG Charts - internal configuration error, only enterprise modules need verification.');
    }

    const stub = EXPECTED_ENTERPRISE_MODULES.find((s) => {
        return (
            s.type === module.type &&
            ('optionsKey' in s && 'optionsKey' in module ? s.optionsKey === module.optionsKey : true) &&
            ('contextKey' in s && 'contextKey' in module ? s.contextKey === module.contextKey : true) &&
            s.identifier === module.identifier &&
            module.chartTypes.every((t) => s.chartTypes.includes(t))
        );
    });

    if (stub) {
        stub.useCount ??= 0;
        stub.useCount++;
    }

    return stub != null;
}

export function getUnusedExpectedModules() {
    return EXPECTED_ENTERPRISE_MODULES.filter(({ useCount }) => useCount == null || useCount === 0);
}
