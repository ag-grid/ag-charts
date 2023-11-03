import type { Module } from '../../module-support';

type EnterpriseModuleStub = Pick<Module<any>, 'type' | 'identifier' | 'optionsKey' | 'chartTypes'> & {
    useCount?: number;
};

const EXPECTED_ENTERPRISE_MODULES: EnterpriseModuleStub[] = [
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-number' },
    { type: 'root', optionsKey: 'animation', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    { type: 'root', optionsKey: 'background', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'box-plot' },
    { type: 'root', optionsKey: 'contextMenu', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    { type: 'axis-option', optionsKey: 'crosshair', chartTypes: ['cartesian'] },
    { type: 'series-option', optionsKey: 'errorBar', chartTypes: ['cartesian'], identifier: 'error-bars' },
    {
        type: 'legend',
        optionsKey: 'gradientLegend',
        chartTypes: ['cartesian', 'polar', 'hierarchy'],
        identifier: 'gradient',
    },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'heatmap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'histogram' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'nightingale' },
    { type: 'root', optionsKey: 'navigator', chartTypes: ['cartesian'] },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-line' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-column' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-number' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['hierarchy'], identifier: 'treemap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'waterfall' },
    { type: 'root', optionsKey: 'zoom', chartTypes: ['cartesian'] },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'bullet' },
];

export function verifyIfModuleExpected(module: Module<any>) {
    if (module.packageType !== 'enterprise') {
        throw new Error('AG Charts - internal configuration error, only enterprise modules need verification.');
    }

    const stub = EXPECTED_ENTERPRISE_MODULES.find((s) => {
        return (
            s.type === module.type &&
            s.optionsKey === module.optionsKey &&
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
