import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ISeries } from '../series/seriesTypes';
import { BaseManager } from './baseManager';
import type { HighlightManager } from './highlightManager';
import type { TooltipManager } from './tooltipManager';
import type { ZoomManager } from './zoomManager';

type GroupId = string | symbol;

/** Breaks circular dependencies which occur when importing ChartAxis. */
type AxisLike = {
    boundSeries: ISeries<any, any>[];
    direction: ChartAxisDirection;
    keys: string[];
    reverse?: boolean;
    nice: boolean;
    min?: number;
    max?: number;
};

/** Breaks circular dependencies which occur when importing Chart. */
type ChartLike = {
    id: string;
    axes: AxisLike[];
    series: ISeries<any, any>[];
    highlightManager: HighlightManager;
    modulesManager: { getModule<R>(module: string): R | undefined };
    tooltipManager: TooltipManager;
    zoomManager: ZoomManager;
    waitForDataProcess(timeout?: number): Promise<void>;
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
        return this;
    }

    unsubscribe(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        this.get(groupId)?.delete(this.chart);
        return this;
    }

    getChart() {
        return this.chart;
    }

    getGroup(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        const syncGroup = this.get(groupId);
        return syncGroup ? Array.from(syncGroup) : [];
    }

    getGroupSiblings(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        return this.getGroup(groupId).filter((chart) => chart !== this.chart);
    }

    private get(groupId: GroupId) {
        return SyncManager.chartsGroups.get(groupId);
    }
}
