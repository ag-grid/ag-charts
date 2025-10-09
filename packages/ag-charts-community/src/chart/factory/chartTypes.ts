export type ChartType = 'cartesian' | 'polar' | 'topology' | 'standalone';

class ChartTypes extends Map<string, ChartType | 'unknown'> {
    override get(seriesType: string) {
        return super.get(seriesType) ?? 'unknown';
    }
}

export const chartTypes = new ChartTypes();
