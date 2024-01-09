import { mergeDefaults } from '../../util/object';

export type ChartType = 'cartesian' | 'polar' | 'hierarchy';

const TYPES: Record<string, ChartType> = {};

const DEFAULTS: Record<string, {}> = {};

export const CHART_TYPES = {
    has(seriesType: string) {
        return Object.hasOwn(TYPES, seriesType);
    },

    isCartesian(seriesType: string) {
        return TYPES[seriesType] === 'cartesian';
    },
    isPolar(seriesType: string) {
        return TYPES[seriesType] === 'polar';
    },
    isHierarchy(seriesType: string) {
        return TYPES[seriesType] === 'hierarchy';
    },

    get seriesTypes() {
        return Object.keys(TYPES);
    },
    get cartesianTypes() {
        return this.seriesTypes.filter((t) => this.isCartesian(t));
    },
    get polarTypes() {
        return this.seriesTypes.filter((t) => this.isPolar(t));
    },
    get hierarchyTypes() {
        return this.seriesTypes.filter((t) => this.isHierarchy(t));
    },
};

export function registerChartSeriesType(seriesType: string, chartType: ChartType) {
    TYPES[seriesType] = chartType;
}

export function registerChartDefaults(chartType: ChartType, defaults: {}) {
    DEFAULTS[chartType] = mergeDefaults(defaults, DEFAULTS[chartType]);
}

export function getChartDefaults(chartType: ChartType) {
    return DEFAULTS[chartType] ?? {};
}

export function getChartType(seriesType: string): ChartType | 'unknown' {
    return TYPES[seriesType] ?? 'unknown';
}
