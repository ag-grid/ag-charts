import type { EventEmitter } from 'ag-charts-core';

import type { EventsHubMap } from '../../core/eventsHub';
import type { ModuleMap } from '../../module/moduleMap';
import type { BBox } from '../../scene/bbox';
import type { ChartAxisDirection } from 'ag-charts-core';
import type { DatumIndexType, ISeries } from '../series/seriesTypes';
import type { TooltipContent } from '../tooltip/tooltip';
import type { UpdateService } from '../updateService';
import type { HighlightManager } from './highlightManager';
import type { TooltipManager } from './tooltipManager';
import type { ZoomManager } from './zoomManager';

type GroupId = string | symbol;

/** Breaks circular dependencies which occur when importing ChartAxis. */
export type SyncAxisLike = {
    boundSeries: ISeries<any, any, any>[];
    direction: ChartAxisDirection;
    reverse?: boolean;
    nice: boolean;
    min?: number;
    max?: number;
};

export type SyncStatus = 'init' | 'domains-calculated' | 'ready';

/** Breaks circular dependencies which occur when importing Chart. */
export type SyncChartLike = {
    id: string;
    axes: SyncAxisLike[];
    series: ISeries<any, any, any>[];
    syncStatus: SyncStatus;
    modulesManager: ModuleMap;
    seriesAreaBoundingBox: BBox;
    tooltip: { enabled: boolean };
    ctx: {
        eventsHub: EventEmitter<EventsHubMap>;
        highlightManager: HighlightManager;
        tooltipManager: TooltipManager;
        updateService: UpdateService;
        zoomManager: ZoomManager;
    };
    getTooltipContent(
        series: ISeries<DatumIndexType, unknown, unknown>,
        datumIndex: unknown,
        removeThisDatum: unknown,
        purpose: 'aria-label' | 'tooltip'
    ): TooltipContent[];
};

type ChartDomainState = {
    [id: string]: Record<string, unknown[]>;
};

export type SyncDerivedDomain = {
    derived: unknown[];
    sources: ChartDomainState;
    dirty: boolean;
};

export type SyncGroupState = {
    members: Set<SyncChartLike>;
    domains?: { [key in 'x' | 'y']?: SyncDerivedDomain };
    domainsById?: { [key: string]: SyncDerivedDomain };
    domainsByPosition?: { [key: string]: SyncDerivedDomain };
};

export class SyncManager {
    private static readonly chartsGroups = new Map<GroupId, SyncGroupState>();
    private static readonly DEFAULT_GROUP = Symbol('sync-group-default');

    constructor(protected chart: SyncChartLike) {}

    subscribe(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        let syncGroup = this.get(groupId);
        if (!syncGroup) {
            syncGroup = { members: new Set() };
            SyncManager.chartsGroups.set(groupId, syncGroup);
        }
        syncGroup.members.add(this.chart);
        return this;
    }

    unsubscribe(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        const groupState = this.get(groupId);
        groupState?.members.delete(this.chart);
        delete groupState?.domains?.x?.sources?.[this.chart.id];
        delete groupState?.domains?.y?.sources?.[this.chart.id];
        return this;
    }

    getChart() {
        return this.chart;
    }

    getGroupState(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        return this.get(groupId);
    }

    getGroupMembers(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        const syncGroup = this.get(groupId);
        return syncGroup ? Array.from(syncGroup.members) : [];
    }

    getGroupSiblings(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        return this.getGroupMembers(groupId).filter((chart) => chart !== this.chart);
    }

    getGroupSyncMode(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        if (this.getGroupMembers(groupId).some((c) => c.series.length > 1)) {
            return 'multi-series';
        }
        return 'single-series';
    }

    private get(groupId: GroupId) {
        return SyncManager.chartsGroups.get(groupId);
    }
}
