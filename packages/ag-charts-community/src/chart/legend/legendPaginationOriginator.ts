import type { MementoOriginator } from 'ag-charts-core';

import type { ChartLegend, ChartLegendType } from './legendDatum';

export function findCategoryLegend(
    legends: Iterable<{ legendType: ChartLegendType; legend: ChartLegend }>
): ChartLegend | undefined {
    for (const { legendType, legend } of legends) {
        if (legendType === 'category') return legend;
    }
    return undefined;
}

export class LegendPaginationOriginator implements MementoOriginator<number> {
    public mementoOriginatorKey = 'legendPagination' as const;

    constructor(private readonly legend: ChartLegend) {}

    public createMemento(): number {
        return this.legend.pagination?.currentPage ?? 0;
    }

    public guardMemento(blob: unknown): blob is number | undefined {
        return blob == null || (typeof blob === 'number' && Number.isInteger(blob) && blob >= 0);
    }

    public restoreMemento(_version: string, _mementoVersion: string, page: number | undefined): void {
        if (page != null) {
            this.legend.restorePage?.(page);
        }
    }
}
