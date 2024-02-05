import type { Chart } from '../chart';
import { BaseManager } from './baseManager';

type GroupId = string | symbol;

export class SyncManager extends BaseManager {
    static chartsGroups = new Map<GroupId, Set<Chart>>();
    static DEFAULT_GROUP = Symbol('sync-group-default');

    constructor(protected chart: Chart) {
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
