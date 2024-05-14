import type { Destroyable } from '../../util/destroy';

export type SeriesGrouping = {
    groupIndex: number;
    groupCount: number;
    stackIndex: number;
    stackCount: number;
};

export class SeriesStateManager implements Destroyable {
    private readonly groups: {
        [type: string]: {
            [id: string]: {
                grouping: SeriesGrouping;
                visible: boolean;
            };
        };
    } = {};

    destroy() {}

    public registerSeries({
        id,
        seriesGrouping,
        visible,
        type,
    }: {
        id: string;
        seriesGrouping?: SeriesGrouping;
        visible: boolean;
        type: string;
    }) {
        if (!seriesGrouping) return;

        this.groups[type] ??= {};
        this.groups[type][id] = { grouping: seriesGrouping, visible };
    }

    public deregisterSeries({ id, type }: { id: string; type: string }) {
        if (this.groups[type]) {
            delete this.groups[type][id];
        }
        if (this.groups[type] && Object.keys(this.groups[type]).length === 0) {
            delete this.groups[type];
        }
    }

    public getVisiblePeerGroupIndex({
        type,
        seriesGrouping,
        visible,
    }: {
        type: string;
        seriesGrouping?: SeriesGrouping;
        visible: boolean;
    }): {
        visibleGroupCount: number;
        visibleSameStackCount: number;
        index: number;
    } {
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
