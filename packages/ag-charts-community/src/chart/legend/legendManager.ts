import type { AgInitialStateLegendOptions } from 'ag-charts-types';

import type { MementoOriginator } from '../../api/state/memento';
import { BaseManager } from '../../util/baseManager';
import { isArray } from '../../util/type-guards';
import type { ChartService } from '../chartService';
import type { CategoryLegendDatum } from './legendDatum';

export interface LegendChangeEvent {
    type: 'legend-change';
    legendData?: CategoryLegendDatum[];
}

type LegendDataMap = Map<string, CategoryLegendDatum[]>;
export type LegendDataMemento = AgInitialStateLegendOptions[];

export class LegendManager
    extends BaseManager<LegendChangeEvent['type'], LegendChangeEvent>
    implements MementoOriginator<LegendDataMemento>
{
    public constructor(readonly chartService: ChartService) {
        super();
    }
    public mementoOriginatorKey = 'legend' as const;

    private readonly legendDataMap: LegendDataMap = new Map();

    public createMemento() {
        return this.getData().map(({ enabled, ...datum }) => ({ ...datum, visible: enabled }));
    }

    public guardMemento(blob: unknown): blob is LegendDataMemento | undefined {
        return blob == null || isArray(blob);
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: LegendDataMemento | undefined) {
        memento?.forEach((datum) => {
            const { seriesId, data } = this.getRestoredDatum(datum) ?? {};

            if (!seriesId || !data) {
                return;
            }

            this.updateData(seriesId, data);
        });

        this.update();
    }

    private getRestoredDatum(datum: AgInitialStateLegendOptions) {
        const { seriesId, itemId, visible } = datum;

        if (seriesId) {
            const legendData = this.legendDataMap.get(seriesId) ?? [];

            const data = legendData.map((d) =>
                d.seriesId === seriesId && (!datum.itemId || d.itemId === datum.itemId) ? { ...d, enabled: visible } : d
            );

            return { seriesId, data };
        }

        if (itemId) {
            const legendData = this.getData();

            for (const legendDatum of legendData) {
                if (legendDatum.itemId === datum.itemId) {
                    return { seriesId: legendDatum.seriesId, data: [{ ...legendDatum, enabled: visible }] };
                }
            }
        }
    }

    public update(data?: CategoryLegendDatum[]) {
        this.listeners.dispatch('legend-change', {
            type: 'legend-change',
            legendData: data ?? this.getData(),
        });
    }

    public updateData(seriesId: string, data: CategoryLegendDatum[] = []) {
        this.legendDataMap.set(seriesId, data);
    }

    public clearData() {
        this.legendDataMap.clear();
    }

    public toggleItem({
        enabled,
        seriesId,
        itemId,
        legendItemName,
    }: {
        enabled: boolean;
        seriesId: string;
        itemId?: any;
        legendItemName?: string;
    }) {
        if (legendItemName) {
            this.getData().forEach((datum) => {
                const newDatum = datum.legendItemName === legendItemName ? { ...datum, enabled } : datum;
                this.updateData(datum.seriesId, [newDatum]);
            });
            return;
        }

        const seriesLegendData = this.getData(seriesId);
        const singleLegendItem = seriesLegendData.length === 1;

        const data = this.getData(seriesId).map((datum) =>
            (itemId == null && singleLegendItem) || datum.itemId === itemId ? { ...datum, enabled } : datum
        );

        this.updateData(seriesId, data);
    }

    public getData(seriesId?: string) {
        if (seriesId) {
            return this.legendDataMap.get(seriesId) ?? [];
        }

        return [...this.legendDataMap].reduce(
            (data, [_, legendData]) => data.concat(legendData),
            [] as CategoryLegendDatum[]
        );
    }

    public getDatum({ seriesId, itemId }: { seriesId?: string; itemId?: any } = {}) {
        return this.getData(seriesId).find((datum) => datum.itemId === itemId);
    }

    public getSeriesEnabled(seriesId: string) {
        const data = this.getData(seriesId);

        if (data.length > 0) {
            return data.some((d) => d.enabled);
        }

        return true;
    }

    public getItemEnabled({ seriesId, itemId }: { seriesId?: string; itemId?: any } = {}) {
        return this.getDatum({ seriesId, itemId })?.enabled ?? true;
    }
}
