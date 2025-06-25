import { mergeDefaults } from '../../util/object';

export type ChartType = 'cartesian' | 'polar' | 'topology' | 'standalone';

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
    isTopology(seriesType: string) {
        return this.get(seriesType) === 'topology';
    }
    isStandalone(seriesType: string) {
        return this.get(seriesType) === 'standalone';
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
    get topologyTypes() {
        return this.seriesTypes.filter((t) => this.isTopology(t));
    }
    get standaloneTypes() {
        return this.seriesTypes.filter((t) => this.isStandalone(t));
    }
}

class ChartDefaults extends Map<ChartType, object> {
    override set(chartType: ChartType, defaults: object) {
        return super.set(chartType, mergeDefaults(defaults, this.get(chartType)));
    }
}

export const chartTypes = new ChartTypes();
export const publicChartTypes = new ChartTypes();
export const chartDefaults = new ChartDefaults();
