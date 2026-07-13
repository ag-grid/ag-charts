import { dateToNumber } from 'ag-charts-core';
import type { PlainObject } from 'ag-charts-core';

import type { SeriesGrouping } from '../../module/seriesGrouping';
import { IrregularBandScale } from '../../scale/irregularBandScale';

type SeriesGroupingResult = {
    visibleGroupCount: number;
    visibleSameStackCount: number;
    index: number;
};

type SeriesIdLike = {
    internalId: string;
    type: string;
};

type SeriesLike = SeriesIdLike & {
    seriesGrouping?: SeriesGrouping;
    width?: number;
    visible: boolean;
};

type SeriesGroupingEntry = {
    grouping: SeriesGrouping;
    width?: number;
    visible: boolean;
};

export class SeriesStateManager {
    private readonly groups: Map<string, Map<string, SeriesGroupingEntry>> = new Map();

    private readonly groupScales: Map<string, IrregularBandScale> = new Map();

    /** Canonicalised category keys at which each series has a rendered (non-null, valid) bar, keyed by `internalId`. */
    private readonly datumValidKeys: Map<string, Set<unknown>> = new Map();

    public registerSeries({ internalId, seriesGrouping, visible, width, type }: SeriesLike) {
        if (!seriesGrouping) return;

        let group = this.groups.get(type);
        if (group == null) {
            group = new Map();
            this.groups.set(type, group);
        }
        group.set(internalId, { grouping: seriesGrouping, visible, width });
    }

    public updateSeries({ internalId, seriesGrouping, visible, width, type }: SeriesLike) {
        if (!seriesGrouping) return;

        const entry = this.groups.get(type)?.get(internalId);
        if (entry) {
            entry.grouping = seriesGrouping;
            entry.width = width;
            entry.visible = visible;
        }
    }

    public deregisterSeries({ internalId, type }: SeriesIdLike) {
        this.datumValidKeys.delete(internalId);

        const group = this.groups.get(type);
        if (group == null) return;

        group.delete(internalId);
        if (group.size === 0) {
            this.groups.delete(type);
        }
    }

    /**
     * Record the category keys at which a series has a rendered bar, so that `getDatumOffset` can close the gaps left
     * by categories a series does not draw — whether the bar is null/missing in a shared data array or the category is
     * absent from the series' own per-series `data` array. Keys are canonicalised (dates to epoch numbers) to match by
     * value across series. Pass `undefined` to clear (e.g. when `skipNullBars` is off).
     */
    public setSeriesDatumValidKeys(internalId: string, keys: Iterable<unknown> | undefined) {
        if (keys == null) {
            this.datumValidKeys.delete(internalId);
            return;
        }

        const validKeys = new Set<unknown>();
        for (const key of keys) {
            validKeys.add(dateToNumber(key));
        }

        if (validKeys.size === 0) {
            this.datumValidKeys.delete(internalId);
        } else {
            this.datumValidKeys.set(internalId, validKeys);
        }
    }

    public getVisiblePeerGroupIndex({ type, seriesGrouping, visible }: SeriesLike): SeriesGroupingResult {
        if (!seriesGrouping) {
            return { visibleGroupCount: visible ? 1 : 0, visibleSameStackCount: visible ? 1 : 0, index: 0 };
        }

        const visibleGroupsSet = new Set<number>();
        const visibleSameStackSet = new Set<number>();
        const group = this.groups.get(type);
        for (const entry of group?.values() ?? []) {
            if (!entry.visible) continue;

            visibleGroupsSet.add(entry.grouping.groupIndex);

            if (entry.grouping.groupIndex === seriesGrouping.groupIndex) {
                visibleSameStackSet.add(entry.grouping.stackIndex);
            }
        }
        const visibleGroups = Array.from(visibleGroupsSet);

        visibleGroups.sort((a, b) => a - b);

        return {
            visibleGroupCount: visibleGroups.length,
            visibleSameStackCount: visibleSameStackSet.size,
            index: visibleGroups.indexOf(seriesGrouping.groupIndex),
        };
    }

    public updateGroupScale(
        { type }: SeriesLike,
        bandwidth: number,
        axis: PlainObject // TODO: ChartAxis circular dependency
    ) {
        const groupScale = this.groupScales.get(type) ?? new IrregularBandScale();
        this.groupScales.set(type, groupScale);

        // TODO: can we short-circuit here if the groupScale already exists (with this bandwidth and axis?)

        groupScale.domain = []; // reset domain and band ranges

        const group = this.groups.get(type);
        for (const entry of group?.values() ?? []) {
            if (!entry.visible) continue;
            groupScale.addBand(entry.grouping.groupIndex, entry.grouping.stackIndex, entry.width);
        }

        // When no series have been added to a group, instead add a single band that occupies the full range.
        if (groupScale.domain.length === 0) {
            groupScale.addBand(0, 0, undefined);
        }

        groupScale.range = [0, bandwidth];

        if (axis.type === 'grouped-category') {
            // TODO: `instanceof GroupedCategoryAxis` circular dependency
            groupScale.paddingInner = (axis.options as { groupPaddingInner: number }).groupPaddingInner;
        } else if (axis.type === 'category' || axis.type === 'unit-time') {
            // TODO: `instanceof CategoryAxis` circular dependency
            groupScale.paddingInner = (axis.options as { groupPaddingInner: number }).groupPaddingInner;
            // To get exactly `0` padding we need to turn off rounding
            groupScale.round = groupScale.padding !== 0; // TODO: can this just be `groupScale.round = true;` since padding is never set?
        } else {
            // Number or Time axis
            groupScale.padding = 0;
        }

        groupScale.update(); // TODO: don't hardcode this
    }

    public getGroupScale({ type }: SeriesLike): IrregularBandScale | undefined {
        return this.groupScales.get(type);
    }

    public getGroupBandWidth(series: SeriesLike): number {
        const { seriesGrouping } = series;
        if (!seriesGrouping) return 0;

        const groupScale = this.getGroupScale(series);
        if (!groupScale) return 0;

        const group = this.groups.get(series.type);
        if (!group) return groupScale.bandwidth;

        let maxWidth = 0;
        for (const entry of group.values()) {
            if (!entry.visible) continue;
            if (entry.grouping.groupIndex !== seriesGrouping.groupIndex) continue;
            maxWidth = Math.max(maxWidth, entry.width ?? groupScale.bandwidth);
        }

        return maxWidth || groupScale.bandwidth;
    }

    public getGroupOffset(series: SeriesLike): number {
        const { seriesGrouping } = series;
        if (!seriesGrouping) return 0;

        const groupScale = this.getGroupScale(series);
        if (!groupScale) return 0;

        const domainValue = groupScale.getDomainValue(seriesGrouping.groupIndex, seriesGrouping.stackIndex);
        return groupScale.convert(domainValue);
    }

    public getStackOffset(series: SeriesLike, barWidth: number): number {
        const { seriesGrouping } = series;
        if (!seriesGrouping) return 0;

        const group = this.groups.get(series.type);
        if (!group) return 0;

        const scale = this.getGroupScale(series);
        if (!scale) return 0;

        const stackCount = seriesGrouping.stackCount ?? 0;
        if (stackCount < 1) return 0;

        let maxStackWidth = 0;
        for (const entry of group.values()) {
            if (!entry.visible) continue;
            if (entry.grouping.groupIndex !== seriesGrouping.groupIndex) continue;
            maxStackWidth = Math.max(maxStackWidth, entry.width ?? scale.bandwidth);
        }
        if (maxStackWidth === 0) return 0;

        return maxStackWidth / 2 - barWidth / 2;
    }

    public getDatumOffset(series: SeriesLike, datumKey: unknown) {
        const group = this.groups.get(series.type);

        if (!series.visible || !series.seriesGrouping || !group) {
            return 0;
        }

        const key = dateToNumber(datumKey);

        // This series draws no bar at this category (null/missing value, or the category is absent from its data), so
        // it needs no offset of its own.
        if (!this.datumValidKeys.get(series.internalId)?.has(key)) {
            return 0;
        }

        // A group contributes a bar at this category if any of its series draws one there.
        const partialValidGroups = new Set<number>();
        for (const [seriesId, compareSeries] of group) {
            if (!compareSeries.visible) continue;
            if (this.datumValidKeys.get(seriesId)?.has(key)) {
                partialValidGroups.add(compareSeries.grouping.groupIndex);
            }
        }

        // If every group has a bar at this category, there is no gap to close.
        if (partialValidGroups.size === series.seriesGrouping?.groupCount) {
            return 0;
        }

        const groupScale = this.groupScales.get(series.type);

        const before = new Map<number, number>();
        const after = new Map<number, number>();
        for (const [seriesId, compareSeries] of group) {
            if (seriesId === series.internalId) continue;
            if (!compareSeries.visible) continue;
            if (partialValidGroups.has(compareSeries.grouping.groupIndex)) continue;

            if (series.seriesGrouping.groupIndex < compareSeries.grouping.groupIndex) {
                after.set(
                    compareSeries.grouping.groupIndex,
                    Math.max(
                        compareSeries.width ?? groupScale?.bandwidth ?? 0,
                        after.get(compareSeries.grouping.groupIndex) ?? 0
                    )
                );
            } else if (series.seriesGrouping.groupIndex > compareSeries.grouping.groupIndex) {
                before.set(
                    compareSeries.grouping.groupIndex,
                    Math.max(
                        compareSeries.width ?? groupScale?.bandwidth ?? 0,
                        before.get(compareSeries.grouping.groupIndex) ?? 0
                    )
                );
            }
        }

        let widthOffset = 0;
        for (const [, a] of after) {
            widthOffset += a;
        }
        for (const [, b] of before) {
            widthOffset -= b;
        }
        widthOffset /= 2;

        const paddingInnerWidth = (groupScale?.paddingInnerWidth ?? 0) / 2;
        const paddingOffset = (after.size - before.size) * paddingInnerWidth;

        return widthOffset + paddingOffset;
    }
}
