import type { ChartAxisDirection, DynamicContext } from 'ag-charts-core';
import { BaseManager } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import type { ISeries } from '../series/seriesTypes';

type GroupId = string | symbol;

export type SyncStatus = 'init' | 'domains-calculated' | 'ready';

/** Breaks circular dependencies which occur when importing ChartAxis. */
export type SyncAxisLike = {
    id: string;
    position?: string;
    boundSeries: ISeries<any, any, any>[];
    direction: ChartAxisDirection;
    nice: boolean;
    options: { min?: unknown; max?: unknown; reverse?: boolean };
};

type ChartDomainState = {
    [id: string]: Record<string, unknown[]>;
};

export type SyncDerivedDomain = {
    derived: unknown[];
    sources: ChartDomainState;
    dirty: boolean;
};

/** A chart's handle in a sync group, through which siblings reach it. */
export interface SyncGroupMember {
    readonly moduleContext: DynamicContext<ChartRegistry>;
    readonly syncStatus: SyncStatus;
    readonly axes: 'x' | 'y' | 'xy';
    readonly nodeInteraction: boolean;
    readonly zoom: boolean;
    readonly enabled: boolean;
    getSyncedDomain(axis: unknown): Promise<unknown[] | undefined>;
    removeAxis(axis: unknown): void;
}

export type SyncGroupState = {
    members: Set<SyncGroupMember>;
    domains?: { [key in 'x' | 'y']?: SyncDerivedDomain };
    domainsById?: { [key: string]: SyncDerivedDomain };
    domainsByPosition?: { [key: string]: SyncDerivedDomain };
};

export class SyncManager extends BaseManager {
    private static readonly chartsGroups = new Map<GroupId, SyncGroupState>();
    private static readonly DEFAULT_GROUP = Symbol('sync-group-default');

    syncStatus: SyncStatus = 'init';
    private member?: SyncGroupMember;

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {
        super();
        this.cleanup.register(
            ctx.eventsHub.on('update:process-data', () => {
                if (this.syncStatus === 'init') this.syncStatus = 'domains-calculated';
            }),
            ctx.eventsHub.on('update:settled', () => {
                this.syncStatus = 'ready';
            })
        );
    }

    setMember(member: SyncGroupMember | undefined) {
        this.member = member;
    }

    async getSyncedDomain(axis: unknown) {
        const { member } = this;
        if (!member?.enabled) return;
        return await member.getSyncedDomain(axis);
    }

    removeAxes(axes: Iterable<unknown>) {
        const { member } = this;
        if (!member?.enabled) return;
        for (const axis of axes) {
            member.removeAxis(axis);
        }
    }

    subscribe(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        if (!this.member) return this;
        let syncGroup = this.get(groupId);
        if (!syncGroup) {
            syncGroup = { members: new Set() };
            SyncManager.chartsGroups.set(groupId, syncGroup);
        }
        syncGroup.members.add(this.member);
        return this;
    }

    unsubscribe(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        const groupState = this.get(groupId);
        if (!groupState || !this.member) return this;

        groupState.members.delete(this.member);
        const chartId = this.getChartId();
        const derivedDomains = [
            ...Object.values(groupState.domains ?? {}),
            ...Object.values(groupState.domainsById ?? {}),
            ...Object.values(groupState.domainsByPosition ?? {}),
        ];
        for (const derivedDomain of derivedDomains) {
            if (!(chartId in derivedDomain.sources)) continue;
            delete derivedDomain.sources[chartId];
            derivedDomain.dirty = true;
        }
        return this;
    }

    getChartId() {
        return this.ctx.chartService.id;
    }

    getGroupState(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        return this.get(groupId);
    }

    getGroupMembers(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        const syncGroup = this.get(groupId);
        return syncGroup ? Array.from(syncGroup.members) : [];
    }

    getGroupSiblings(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        return this.getGroupMembers(groupId).filter((member) => member !== this.member);
    }

    getGroupSyncMode(groupId: GroupId = SyncManager.DEFAULT_GROUP) {
        if (this.getGroupMembers(groupId).some((m) => m.moduleContext.chartService.series.length > 1)) {
            return 'multi-series';
        }
        return 'single-series';
    }

    private get(groupId: GroupId) {
        return SyncManager.chartsGroups.get(groupId);
    }
}
