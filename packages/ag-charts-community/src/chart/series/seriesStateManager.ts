export type SeriesGrouping = {
    groupIndex: number;
    groupCount: number;
    stackIndex: number;
    stackCount: number;
};

export type SeriesGroupingResult = {
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

export class SeriesStateManager {
    private readonly groups: {
        [type: string]: {
            [id: string]: {
                grouping: SeriesGrouping;
                visible: boolean;
            };
        };
    } = {};

    public registerSeries({ internalId, seriesGrouping, visible, type }: SeriesLike) {
        if (!seriesGrouping) return;

        this.groups[type] ??= {};
        this.groups[type][internalId] = { grouping: seriesGrouping, visible };
    }

    public updateSeries({ internalId, seriesGrouping, visible, type }: SeriesLike) {
        if (!seriesGrouping) return;

        const entry = this.groups[type]?.[internalId];
        if (entry) {
            entry.grouping = seriesGrouping;
            entry.visible = visible;
        }
    }

    public deregisterSeries({ internalId, type }: SeriesIdLike) {
        if (this.groups[type]) {
            delete this.groups[type][internalId];
        }
        if (this.groups[type] && Object.keys(this.groups[type]).length === 0) {
            delete this.groups[type];
        }
    }

    public getVisiblePeerGroupIndex({ type, seriesGrouping, visible }: SeriesLike): SeriesGroupingResult {
        if (!seriesGrouping)
            return { visibleGroupCount: visible ? 1 : 0, visibleSameStackCount: visible ? 1 : 0, index: 0 };

        const visibleGroupsSet = new Set<number>();
        const visibleSameStackSet = new Set<number>();
        for (const entry of Object.values(this.groups[type] ?? {})) {
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
