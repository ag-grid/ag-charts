import { type AreExact, Logger, isArray } from 'ag-charts-core';
import type { AgInitialStateLegendOptions as DefectAgInitialStateLegendOptions } from 'ag-charts-types';

import type { MementoOriginator } from 'ag-charts-core';
import type { EventsHub } from '../../core/eventsHub';
import type { CategoryLegendDatum } from './legendDatum';

// FIXME: AG-16068 locally patch API AgInitialStateLegendOptions, but force compilation error if&when
// AgInitialStateLegendOptions is publicly patched.
type AgInitialStateLegendOptions =
    AreExact<DefectAgInitialStateLegendOptions['itemId'], string | undefined> extends false
        ? never
        : Omit<DefectAgInitialStateLegendOptions, 'itemId'> & { itemId?: string | number };

type LegendDataMap = Map<string, CategoryLegendDatum[]>;

type LegendDataMemento = AgInitialStateLegendOptions[];

export class LegendManager implements MementoOriginator<LegendDataMemento> {
    public mementoOriginatorKey = 'legend' as const;

    private readonly legendDataMap: LegendDataMap = new Map();

    constructor(private readonly eventsHub: EventsHub) {}

    public createMemento() {
        return this.getData()
            .filter(({ hideInLegend, isFixed }) => !hideInLegend && !isFixed)
            .map(({ enabled, seriesId, itemId, legendItemName }) => ({
                visible: enabled,
                seriesId,
                itemId,
                legendItemName,
            }));
    }

    public guardMemento(blob: unknown): blob is LegendDataMemento | undefined {
        return blob == null || isArray(blob);
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: LegendDataMemento | undefined) {
        if (memento) {
            for (const datum of memento) {
                const { seriesId, data } = this.getRestoredData(datum) ?? {};

                if (!seriesId || !data) {
                    continue;
                }

                this.updateData(seriesId, data);
            }
        }

        this.update();
    }

    private getRestoredData(datum: AgInitialStateLegendOptions) {
        const { seriesId, itemId, legendItemName, visible } = datum;

        if (seriesId) {
            const legendData = this.legendDataMap.get(seriesId) ?? [];

            const data = legendData.map((d) => {
                const match = d.seriesId === seriesId && (!itemId || d.itemId === itemId);
                if (match && d.isFixed) {
                    this.warnFixed(d.seriesId, d.itemId);
                }
                return !d.isFixed && match ? { ...d, enabled: visible } : d;
            });

            return { seriesId, data };
        }

        if (itemId == null && legendItemName == null) {
            return;
        }

        for (const legendDatum of this.getData()) {
            if (
                (itemId != null && legendDatum.itemId !== itemId) ||
                (legendItemName != null && legendDatum.legendItemName !== legendItemName)
            ) {
                continue;
            }

            if (legendDatum.isFixed) {
                this.warnFixed(legendDatum.seriesId, itemId);
                return;
            }

            const seriesLegendData = (this.legendDataMap.get(legendDatum.seriesId) ?? []).map((d) =>
                d.itemId === itemId || d.legendItemName === legendItemName ? { ...d, enabled: visible } : d
            );

            return {
                seriesId: legendDatum.seriesId,
                data: seriesLegendData,
            };
        }
    }

    private warnFixed(seriesId: string, itemId: any) {
        Logger.warnOnce(
            `The legend item with seriesId [${seriesId}] and itemId [${itemId}] is not configurable, this series item cannot be toggled through the legend.`
        );
    }

    public update(data?: CategoryLegendDatum[]) {
        this.eventsHub.emit('legend:change', {
            legendData: data ?? this.getData(),
        });
    }

    public updateData(seriesId: string, data: CategoryLegendDatum[] = []) {
        this.eventsHub.emit('legend:change-partial', { seriesId, legendData: data });
        this.legendDataMap.set(seriesId, data);
    }

    public clearData() {
        this.legendDataMap.clear();
    }

    public toggleItem(enabled: boolean, seriesId: string, itemId?: any, legendItemName?: string) {
        if (legendItemName) {
            for (const datum of this.getData()) {
                const newData = (this.legendDataMap.get(datum.seriesId) ?? []).map((d) =>
                    d.legendItemName === legendItemName ? { ...d, enabled } : d
                );

                this.updateData(datum.seriesId, newData);
            }
            return;
        }

        const seriesLegendData = this.getData(seriesId);
        const singleLegendItem = seriesLegendData.length === 1;

        const data = seriesLegendData.map((datum) =>
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
    }

    public getItemEnabled({ seriesId, itemId }: { seriesId?: string; itemId?: string | number } = {}) {
        return this.getDatum({ seriesId, itemId })?.enabled ?? true;
    }
}
