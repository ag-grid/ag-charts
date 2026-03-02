import type { PlainObject } from 'ag-charts-core';

import { IrregularBandScale } from '../../scale/irregularBandScale';

export type SeriesGrouping = {
    groupIndex: number;
    groupCount: number;
    stackIndex: number;
    stackCount: number;
};

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
        const group = this.groups.get(type);
        if (group == null) return;

        group.delete(internalId);
        if (group.size === 0) {
            this.groups.delete(type);
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
            groupScale.paddingInner = axis.groupPaddingInner;
        } else if (axis.type === 'category' || axis.type === 'unit-time') {
            // TODO: `instanceof CategoryAxis` circular dependency
            groupScale.paddingInner = axis.groupPaddingInner;
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

    public getDatumOffset(
        series: SeriesLike,
        invalidData: Map<string, boolean[]>,
        missingData: Map<string, boolean[]>,
        datumIndex: number
    ) {
        const group = this.groups.get(series.type);

        if (!series.visible || !series.seriesGrouping || !group) {
            return 0;
        }

        // If this series has an invalid datum it will not be visible, so skip any further processing.
        if (invalidData.get(series.internalId)?.[datumIndex] || missingData.get(series.internalId)?.[datumIndex]) {
            return 0;
        }

        // The datum only needs to be offset if every datum in a group (visually stacked) is invalid.
        const partialValidGroups = new Set<number>();
        for (const [seriesId, compareSeries] of group) {
            if (!compareSeries.visible) continue;
            if (!invalidData.get(seriesId)?.[datumIndex] && !missingData.get(seriesId)?.[datumIndex]) {
                partialValidGroups.add(compareSeries.grouping.groupIndex);
            }
        }

        // If every datum in the group is valid, there is no offset.
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
