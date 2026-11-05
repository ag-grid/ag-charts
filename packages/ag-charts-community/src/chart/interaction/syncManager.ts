import type { BBox, ChartAxisDirection, EventEmitter, ReactiveState, SyncStatus } from 'ag-charts-core';

import type { EventsHubMap } from '../../core/eventsHub';
import type { ModuleMap } from '../../module/moduleMap';
import type { ChartState } from '../chartState';
import type { ISeries, ISeriesOptions, SeriesNodeDatum } from '../series/seriesTypes';
import type { TooltipContent } from '../tooltip/tooltip';
import type { HighlightManager } from './highlightManager';
import type { TooltipManager } from './tooltipManager';
import type { ZoomManager } from './zoomManager';

type GroupId = string | symbol;

/** Breaks circular dependencies which occur when importing ChartAxis. */
export type SyncAxisLike = {
    id: string;
    position?: string;
    boundSeries: ISeries<any, any, any>[];
    direction: ChartAxisDirection;
    nice: boolean;
    options: { min?: unknown; max?: unknown; reverse?: boolean };
};

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
        chartState: ReactiveState<ChartState>;
        eventsHub: EventEmitter<EventsHubMap>;
        highlightManager: HighlightManager;
        tooltipManager: TooltipManager;
        zoomManager?: ZoomManager;
    };
    getTooltipContent(
        series: ISeries<SeriesNodeDatum, ISeriesOptions, unknown>,
        datumIndex: unknown,
        removeThisDatum: unknown,
        purpose: 'aria-label' | 'tooltip'
    ): TooltipContent[];
    onSyncActiveClear(): void;
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

/** What the sync module lends this chart's axis-domain pipeline. */
export interface SyncDomainProvider {
    readonly enabled: boolean;
    getSyncedDomain(axis: unknown): Promise<unknown[] | undefined>;
    removeAxis(axis: unknown): void;
}

export class SyncManager {
    private static readonly chartsGroups = new Map<GroupId, SyncGroupState>();
    private static readonly DEFAULT_GROUP = Symbol('sync-group-default');

    private domainProvider?: SyncDomainProvider;

    constructor(protected chart: SyncChartLike) {}

    setDomainProvider(provider: SyncDomainProvider | undefined) {
        this.domainProvider = provider;
    }

    async getSyncedDomain(axis: unknown) {
        const provider = this.domainProvider;
        if (!provider?.enabled) return;
        return await provider.getSyncedDomain(axis);
    }

    removeAxes(axes: Iterable<unknown>) {
        const provider = this.domainProvider;
        if (!provider?.enabled) return;
        for (const axis of axes) {
            provider.removeAxis(axis);
        }
    }

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
        if (!groupState) return this;

        groupState.members.delete(this.chart);
        const derivedDomains = [
            ...Object.values(groupState.domains ?? {}),
            ...Object.values(groupState.domainsById ?? {}),
            ...Object.values(groupState.domainsByPosition ?? {}),
        ];
        for (const derivedDomain of derivedDomains) {
            if (!(this.chart.id in derivedDomain.sources)) continue;
            delete derivedDomain.sources[this.chart.id];
            derivedDomain.dirty = true;
        }
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
