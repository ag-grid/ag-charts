import { jsonMerge } from '../../util/json';
import { getEnterpriseSeriesChartTypes } from './expectedEnterpriseModules';

export type ChartType = 'cartesian' | 'polar' | 'hierarchy';

const TYPES: Record<string, ChartType> = {};

const DEFAULTS: Record<string, {}> = {};

export const CHART_TYPES = {
    has(seriesType: string) {
        return Object.prototype.hasOwnProperty.call(TYPES, seriesType);
    },

    isCartesian(seriesType: string) {
        const type = TYPES[seriesType] ?? getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'cartesian');
        return type === 'cartesian';
    },
    isPolar(seriesType: string) {
        const type = TYPES[seriesType] ?? getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'polar');
        return type === 'polar';
    },
    isHierarchy(seriesType: string) {
        const type = TYPES[seriesType] ?? getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'hierarchy');
        return type === 'hierarchy';
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
    DEFAULTS[chartType] = jsonMerge([DEFAULTS[chartType] ?? {}, defaults]);
}

export function getChartDefaults(chartType: ChartType) {
    return DEFAULTS[chartType] ?? {};
}

export function getChartType(seriesType: string): ChartType | 'unknown' {
    return TYPES[seriesType] ?? 'unknown';
}
