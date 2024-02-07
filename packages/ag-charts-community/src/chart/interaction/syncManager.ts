import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ISeries } from '../series/seriesTypes';
import { BaseManager } from './baseManager';
import type { ZoomManager } from './zoomManager';

type GroupId = string | symbol;

/** Breaks circular dependencies which occur when importing ChartAxis. */
type AxisLike = {
    boundSeries: ISeries<any>[];
    direction: ChartAxisDirection;
    keys: string[];
};

/** Breaks circular dependencies which occur when importing Chart. */
type ChartLike = {
    axes: AxisLike[];
    series: ISeries<any>[];
    zoomManager: ZoomManager;
};

export class SyncManager extends BaseManager {
    static chartsGroups = new Map<GroupId, Set<ChartLike>>();
    static DEFAULT_GROUP = Symbol('sync-group-default');

    constructor(protected chart: ChartLike) {
        super();
    }

    subscribe(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        let syncGroup = this.get(groupId);
        if (!syncGroup) {
            syncGroup = new Set();
            SyncManager.chartsGroups.set(groupId, syncGroup);
        }
        syncGroup.add(this.chart);
    }

    unsubscribe(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        this.get(groupId)?.delete(this.chart);
    }

    getChart() {
        return this.chart;
    }

    getSiblings(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        const syncGroup = this.get(groupId);
        return syncGroup ? Array.from(syncGroup).filter((chart) => chart !== this.chart) : [];
    }

    getGroup(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        const syncGroup = this.get(groupId);
        return syncGroup ? Array.from(syncGroup) : [];
    }

    private get(groupId: GroupId) {
        return SyncManager.chartsGroups.get(groupId);
    }
}
