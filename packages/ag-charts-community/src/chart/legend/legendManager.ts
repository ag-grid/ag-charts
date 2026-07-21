import type { MementoOriginator, ReactiveState } from 'ag-charts-core';
import { type AreExact, Logger, isArray } from 'ag-charts-core';
import type { AgInitialStateLegendOptions as DefectAgInitialStateLegendOptions } from 'ag-charts-types';

import type { ChartState } from '../chartState';
import type { CategoryLegendDatum } from './legendDatum';

// FIXME: AG-16068 locally patch API AgInitialStateLegendOptions, but force compilation error if&when
// AgInitialStateLegendOptions is publicly patched.
type AgInitialStateLegendOptions =
    AreExact<DefectAgInitialStateLegendOptions['itemId'], string | undefined> extends false
        ? never
        : Omit<DefectAgInitialStateLegendOptions, 'itemId'> & { itemId?: string | number };

type LegendDataMemento = AgInitialStateLegendOptions[];

export class LegendManager implements MementoOriginator<LegendDataMemento> {
    public mementoOriginatorKey = 'legend' as const;

    private readonly chartState: ReactiveState<ChartState>;

    constructor(ctx: { chartState: ReactiveState<ChartState> }) {
        this.chartState = ctx.chartState;
    }

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
    }

    private getRestoredData(datum: AgInitialStateLegendOptions) {
        const { seriesId, itemId, legendItemName, visible } = datum;

        if (seriesId) {
            const legendData = this.legendDataRecord[seriesId] ?? [];

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

            const seriesLegendData = (this.legendDataRecord[legendDatum.seriesId] ?? []).map((d) =>
                d.itemId === itemId || d.legendItemName === legendItemName ? { ...d, enabled: visible } : d
            );

            return {
                seriesId: legendDatum.seriesId,
                data: seriesLegendData,
            };
        }
    }

    private warnFixed(seriesId: string, itemId: any) {
        Logger.default.warnOnce(
            `The legend item with seriesId [${seriesId}] and itemId [${itemId}] is not configurable, this series item cannot be toggled through the legend.`
        );
    }

    private get legendDataRecord(): Record<string, CategoryLegendDatum[]> {
        return this.chartState.getValue('legendData') ?? {};
    }

    public updateData(seriesId: string, data: CategoryLegendDatum[] = []) {
        this.chartState.setValue('legendData', { ...this.legendDataRecord, [seriesId]: data });
    }

    public clearData() {
        this.chartState.setValue('legendData', {});
    }

    public toggleItem(enabled: boolean, seriesId: string, itemId?: any, legendItemName?: string) {
        if (legendItemName) {
            const record = this.legendDataRecord;
            for (const datum of this.getData()) {
                const newData = (record[datum.seriesId] ?? []).map((d) =>
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
        const record = this.legendDataRecord;

        if (seriesId) {
            return record[seriesId] ?? [];
        }

        return Object.values(record).flat();
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
