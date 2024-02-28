import { mergeDefaults } from '../../util/object';

export type ChartType = 'cartesian' | 'polar' | 'hierarchy' | 'topology';

class ChartTypes extends Map<string, ChartType | 'unknown'> {
    override get(seriesType: string) {
        return super.get(seriesType) ?? 'unknown';
    }
    isCartesian(seriesType: string) {
        return this.get(seriesType) === 'cartesian';
    }
    isPolar(seriesType: string) {
        return this.get(seriesType) === 'polar';
    }
    isHierarchy(seriesType: string) {
        return this.get(seriesType) === 'hierarchy';
    }
    isTopology(seriesType: string) {
        return this.get(seriesType) === 'topology';
    }
    get seriesTypes() {
        return Array.from(this.keys());
    }
    get cartesianTypes() {
        return this.seriesTypes.filter((t) => this.isCartesian(t));
    }
    get polarTypes() {
        return this.seriesTypes.filter((t) => this.isPolar(t));
    }
    get hierarchyTypes() {
        return this.seriesTypes.filter((t) => this.isHierarchy(t));
    }
    get topologyTypes() {
        return this.seriesTypes.filter((t) => this.isTopology(t));
    }
}

class ChartDefaults extends Map<ChartType, object> {
    override set(chartType: ChartType, defaults: object) {
        return super.set(chartType, mergeDefaults(defaults, this.get(chartType)));
    }
}

export const chartTypes = new ChartTypes();
export const chartDefaults = new ChartDefaults();
