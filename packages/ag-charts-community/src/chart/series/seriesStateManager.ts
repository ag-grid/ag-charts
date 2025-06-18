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
    visible: boolean;
};

type SeriesGroupingEntry = {
    grouping: SeriesGrouping;
    visible: boolean;
};

export class SeriesStateManager {
    private readonly groups: Map<string, Map<string, SeriesGroupingEntry>> = new Map();

    public registerSeries({ internalId, seriesGrouping, visible, type }: SeriesLike) {
        if (!seriesGrouping) return;

        if (!this.groups.has(type)) {
            this.groups.set(type, new Map());
        }
        this.groups.get(type)?.set(internalId, { grouping: seriesGrouping, visible });
    }

    public updateSeries({ internalId, seriesGrouping, visible, type }: SeriesLike) {
        if (!seriesGrouping) return;

        const entry = this.groups.get(type)?.get(internalId);
        if (entry) {
            entry.grouping = seriesGrouping;
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
}
