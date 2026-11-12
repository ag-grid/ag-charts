import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    AsyncAwaitQueue,
    ChartAxisDirection,
    ChartUpdateType,
    ContinuousScale,
    Debug,
    type DynamicContext,
    type NormalisedChartSyncOptions,
    type Scale,
    TimeScale,
    UnitTimeScale,
    arraysEqual,
    definedZoomState,
    findMinMax,
    isDate,
    isDefined,
    isObjectWithStringProperty,
    readDatumKey,
    unique,
} from 'ag-charts-core';

import { readDatum } from '../../utils/datum';

const { CartesianAxis, TooltipManager } = _ModuleSupport;

const debug = Debug.create('sync');

// `syncManager` is optional on ChartRegistry, but the sync module registers it as its own service.
export type SyncCtx = Omit<DynamicContext<_ModuleSupport.ChartRegistry>, 'syncManager'> & {
    readonly syncManager: _ModuleSupport.SyncManager;
};

function getDirectionKeys(
    series: _ModuleSupport.ISeries<any, any, any>,
    primary: ChartAxisDirection,
    secondary: ChartAxisDirection
) {
    const primaryKeys = series.getKeys(primary);
    const secondaryKeys = series.getKeys(secondary);
    if (series.shouldFlipXY?.()) {
        return [secondaryKeys, primaryKeys];
    }
    return [primaryKeys, secondaryKeys];
}

function syncedDirections(axes: 'x' | 'y' | 'xy' = 'x') {
    switch (axes) {
        case 'x':
            return [ChartAxisDirection.X];
        case 'y':
            return [ChartAxisDirection.Y];
        case 'xy':
            return [ChartAxisDirection.X, ChartAxisDirection.Y];
    }
}

function boundsEqual(a: unknown, b: unknown) {
    return isDate(a) && isDate(b) ? a.getTime() === b.getTime() : a === b;
}

function axesCompatible(a: _ModuleSupport.SyncAxisLike, b: _ModuleSupport.SyncAxisLike) {
    return (
        a.nice === b.nice &&
        a.options.reverse === b.options.reverse &&
        boundsEqual(a.options.min, b.options.min) &&
        boundsEqual(a.options.max, b.options.max)
    );
}

function domainChanged(scale: Scale<unknown, unknown>, a: unknown[], b: unknown[]) {
    if (TimeScale.is(scale) || UnitTimeScale.is(scale)) {
        return !arraysEqual(
            a.map((x) => x?.valueOf()),
            b.map((x) => x?.valueOf())
        );
    } else {
        return !arraysEqual(a, b);
    }
}

export class ChartSync extends AbstractModuleInstance implements _ModuleSupport.SyncGroupMember {
    private static readonly rejectedByValidation = new Set<ChartSync>();

    private readonly domainSync = new AsyncAwaitQueue();
    private disabledByValidation = false;

    // ChartSync is only created when the `sync` subtree is configured, so we
    // assert the subtree's presence here and rely on theme defaults for fields.
    private get opts(): NormalisedChartSyncOptions {
        return this.moduleContext.chartState.getValue('options', 'sync')!;
    }

    get enabled(): boolean {
        return !this.disabledByValidation && this.opts.enabled;
    }

    get groupId(): string | undefined {
        return this.opts.groupId;
    }

    get axes(): 'x' | 'y' | 'xy' {
        return this.opts.axes;
    }

    get nodeInteraction(): boolean {
        return this.opts.nodeInteraction;
    }

    get zoom(): boolean {
        return this.opts.zoom;
    }

    get syncStatus(): _ModuleSupport.SyncStatus {
        return this.moduleContext.syncManager.syncStatus;
    }

    constructor(readonly moduleContext: SyncCtx) {
        super();

        let prevEnabled: boolean | undefined;
        let prevGroupId: string | undefined;
        let prevAxes: 'x' | 'y' | 'xy' | undefined;
        let prevNodeInteraction: boolean | undefined;
        let prevZoom: boolean | undefined;

        moduleContext.syncManager.setMember(this);
        this.cleanup.register(
            () => moduleContext.syncManager.setMember(undefined),
            moduleContext.chartState.observe((get) => {
                const sync = get('options', 'sync');
                const enabled = sync?.enabled ?? false;
                const groupId = sync?.groupId;
                const axes = sync?.axes ?? 'x';
                const nodeInteraction = sync?.nodeInteraction ?? true;
                const zoom = sync?.zoom ?? true;

                if (enabled !== prevEnabled) {
                    this.onEnabledChange();
                    prevEnabled = enabled;
                    prevGroupId = groupId;
                    prevAxes = axes;
                    prevNodeInteraction = nodeInteraction;
                    prevZoom = zoom;
                    return;
                }

                if (groupId !== prevGroupId) {
                    this.onGroupIdChange(groupId, prevGroupId);
                    prevGroupId = groupId;
                }

                if (axes !== prevAxes) {
                    this.onAxesChange();
                    prevAxes = axes;
                }

                if (nodeInteraction !== prevNodeInteraction) {
                    this.onNodeInteractionChange();
                    prevNodeInteraction = nodeInteraction;
                }

                if (zoom !== prevZoom) {
                    this.onZoomChange();
                    prevZoom = zoom;
                }
            }),
            moduleContext.chartState.observe((get) => {
                get('options');
                this.revalidateRejected(this.groupId);
            })
        );
    }

    updateSiblings(groupId?: string) {
        const { syncManager } = this.moduleContext;
        for (const member of syncManager.getGroupSiblings(groupId ?? this.groupId)) {
            debug('ChartSync.updateSiblings()', member.moduleContext.chartService.id, member);
            this.updateChart(member);
        }
    }

    private updateChart(member: _ModuleSupport.SyncGroupMember, updateType = ChartUpdateType.PROCESS_DOMAIN) {
        const { chartService, eventsHub } = member.moduleContext;
        debug('ChartSync.updateChart()', chartService.id, ChartUpdateType[updateType], member);
        if (updateType === ChartUpdateType.PROCESS_DOMAIN) {
            eventsHub.emit('chart:request-update', {
                type: updateType,
                opts: { forceNodeDataRefresh: true },
            });
        } else {
            eventsHub.emit('chart:request-update', { type: updateType });
        }
    }

    private disableZoomSync?: () => void;
    private enabledZoomSync() {
        const { eventsHub } = this.moduleContext;
        this.disableZoomSync?.();
        this.disableZoomSync = eventsHub.on('zoom:change-complete', (e) => this.onZoom(e));
    }

    private onZoom(e: _ModuleSupport.ZoomChangeCompleteEvent) {
        const { syncManager } = this.moduleContext;
        for (const member of syncManager.getGroupSiblings(this.groupId)) {
            if (!member.zoom) continue;

            const zoom = this.prepareZoomUpdate();

            // A sync request emits change-requests with `changeType: 'sync'` so ChartSync ignores them; without
            // that, two synchronised charts recurse into each other's sync requests forever.
            if (e.source !== 'sync') {
                debug('ChartsSyncManager.enabledZoomSync()', member.moduleContext.chartService.id, zoom);
                member.moduleContext.eventsHub.emit('zoom:sync-request', zoom);
            }
        }
    }

    private disableNodeInteractionSync?: () => void;
    private enabledNodeInteractionSync() {
        this.disableNodeInteractionSync?.();
        const offHighlightChange = this.moduleContext.eventsHub.on(
            'highlight:change',
            this.onHighlightChange.bind(this)
        );
        const offActiveChangeListener = this.moduleContext.eventsHub.on(
            'active:load-memento',
            this.onActiveLoadMemento.bind(this)
        );
        this.disableNodeInteractionSync = () => {
            offHighlightChange();
            offActiveChangeListener();
        };
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        const { syncManager } = this.moduleContext;

        if (event.callerId.endsWith('-sync')) return;

        debug('ChartSync.onHighlightChange()', event);

        const series = event.currentHighlight?.series;

        const opts = this.opts;
        const [mainDirection] = syncedDirections(opts.axes);
        const secondaryDirection = mainDirection === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const [primaryKeys, secondaryKeys] = series ? getDirectionKeys(series, mainDirection, secondaryDirection) : [];
        const datum = readDatum(event.currentHighlight);
        const suppressFieldDotNotation =
            this.moduleContext.chartState.getValue('options', 'suppressFieldDotNotation') ?? false;
        let eventValue =
            primaryKeys?.[0] == null ? undefined : readDatumKey(datum, primaryKeys[0], suppressFieldDotNotation);
        let valueIsDate: boolean = false;
        if (isDate(eventValue)) {
            valueIsDate = true;
            eventValue = eventValue.getTime();
        }

        if (!event.currentHighlight?.datum) {
            for (const member of syncManager.getGroupSiblings(opts.groupId)) {
                if (!member.nodeInteraction) continue;

                const { chartService, highlightManager, tooltipManager } = member.moduleContext;
                highlightManager.updateHighlight(`${chartService.id}-sync`, undefined, true);
                tooltipManager.removeTooltip(`${chartService.id}-sync`, undefined, true);
            }
            return;
        }

        const useSecondaryDirectionKey = syncManager.getGroupSyncMode(opts.groupId) === 'multi-series';
        this.findMatchingHighlightNodes(
            mainDirection,
            secondaryDirection,
            useSecondaryDirectionKey ? secondaryKeys : [],
            valueIsDate,
            eventValue,
            event
        );
    }

    private onActiveLoadMemento(event: _ModuleSupport.ActiveLoadMementoEvent): void {
        const { activeItem, chartId } = event;
        if (activeItem === undefined) {
            this.moduleContext.highlightManager.updateHighlight(`${chartId}-sync`, undefined, false);
            this.moduleContext.tooltipManager.removeTooltip(`${chartId}-sync`, undefined, false);
            for (const member of this.moduleContext.syncManager.getGroupSiblings(this.groupId)) {
                member.moduleContext.eventsHub.emit('series-area:clear-active', null);
            }
        }
    }

    private findMatchingHighlightNodes(
        primaryDirection: ChartAxisDirection,
        secondaryDirection: ChartAxisDirection,
        secondaryKeys: string[],
        valueIsDate: boolean,
        eventValue: any,
        event: _ModuleSupport.HighlightChangeEvent
    ) {
        const { syncManager } = this.moduleContext;

        debug('ChartSync.findMatchingHighlightNodes()', {
            mainDirection: primaryDirection,
            secondaryKeys,
        });

        for (const member of syncManager.getGroupSiblings(this.groupId)) {
            if (!member.nodeInteraction) continue;

            const { chartService, chartState, highlightManager } = member.moduleContext;
            let dispatched = false;
            for (const axis of chartService.axes) {
                if (!CartesianAxis.is(axis) || axis.direction !== primaryDirection) continue;

                const matchingNodes = chartService.series
                    .filter((s) => {
                        if (!s.visible) return false;

                        if (secondaryKeys.length > 0) {
                            const [, seriesKeys] = getDirectionKeys(s, primaryDirection, secondaryDirection);
                            return secondaryKeys.every((key) => seriesKeys.includes(key));
                        }
                        return true;
                    })
                    .map(
                        this.findMatchingNodes(
                            axis,
                            primaryDirection,
                            valueIsDate,
                            eventValue,
                            chartState.getValue('options', 'suppressFieldDotNotation')
                        )
                    )
                    .filter(isDefined);

                if (
                    matchingNodes.length === 1 &&
                    matchingNodes[0]?.nodeDatum !== highlightManager.getActiveHighlight()
                ) {
                    this.dispatchHighlightUpdate(member, matchingNodes[0].nodeDatum);
                    dispatched = true;
                    break;
                }
            }

            if (!dispatched) {
                debug('ChartSync.findMatchingHighlightNodes() - no matching nodes', chartService.id, event);
                this.dispatchHighlightUpdate(member);
            }
        }
    }

    private findMatchingNodes(
        axis: _ModuleSupport.CartesianAxis<any, any>,
        mainDirection: string,
        valueIsDate: boolean,
        eventValue: any,
        suppressFieldDotNotation: boolean | undefined
    ) {
        return (series: _ModuleSupport.ISeries<_ModuleSupport.SeriesNodeDatum, any, any>) => {
            const seriesKeyAxis = series.getKeyAxis(axis.direction);
            if (seriesKeyAxis !== axis.id) return;

            const nodeData: _ModuleSupport.SeriesNodeDatum[] = (series as any).contextNodeData?.nodeData ?? [];
            if (nodeData.length === 0) return;

            const firstNode = nodeData[0];
            const mainDirectionKey = `${mainDirection}Key` as const;
            if (!isObjectWithStringProperty(firstNode, mainDirectionKey)) return;

            const valueKey = firstNode[mainDirectionKey];
            const nodeDatum = nodeData.find((datum: any) => {
                const nodeValue = readDatumKey(datum.datum, valueKey, suppressFieldDotNotation ?? false);
                return valueIsDate ? nodeValue.getTime() === eventValue : nodeValue === eventValue;
            });

            return nodeDatum ? { series, nodeDatum } : null;
        };
    }

    private dispatchHighlightUpdate(
        member: _ModuleSupport.SyncGroupMember,
        nodeDatum?: _ModuleSupport.SeriesNodeDatum
    ) {
        const { chartService, chartState, highlightManager, tooltipManager } = member.moduleContext;
        const chartId = chartService.id;
        debug('ChartSync.dispatchHighlightUpdate()', chartId, nodeDatum);

        const delayed = nodeDatum == null;
        highlightManager.updateHighlight(`${chartId}-sync`, nodeDatum, delayed);

        const tooltipEnabled =
            nodeDatum?.series.tooltipEnabled ?? chartState.getValue('options', 'tooltip')?.enabled ?? true;
        if (nodeDatum && tooltipEnabled) {
            const seriesRect = chartService.seriesRect;
            const canvasX = (seriesRect?.x ?? 0) + (nodeDatum.midPoint?.x ?? nodeDatum.point?.x ?? 0);
            const canvasY = (seriesRect?.y ?? 0) + (nodeDatum.midPoint?.y ?? nodeDatum.point?.y ?? 0);
            const tooltipMeta = TooltipManager.makeTooltipMeta(
                { type: 'pointermove', canvasX, canvasY },
                nodeDatum.series,
                nodeDatum,
                undefined
            );

            tooltipManager.updateTooltip(
                `${chartId}-sync`,
                tooltipMeta,
                chartService.getTooltipContent(nodeDatum.series, nodeDatum.datumIndex, nodeDatum, 'tooltip')
            );
        } else {
            tooltipManager.removeTooltip(`${chartId}-sync`, undefined, true);
        }

        this.updateChart(member, ChartUpdateType.SERIES_UPDATE);
    }

    async getSyncedDomain(axis: unknown) {
        const opts = this.opts;
        const axes = opts.axes;
        if (!CartesianAxis.is(axis) || (axes !== 'xy' && axes !== (axis.direction as string))) {
            return;
        }

        const { groupState, directionDomains, idDomains, positionDomains } = this.updateDomainState(axis);
        this.validateAxis(axis, groupState);

        await this.waitForDomainsToBeReady();

        const domainMode = opts.domainMode ?? 'id';
        if (domainMode === 'position') {
            return this.calculateDerivedDomain(axis, positionDomains);
        }

        if (domainMode === 'direction') {
            return this.calculateDerivedDomain(axis, directionDomains);
        }

        return this.calculateDerivedDomain(axis, idDomains);
    }

    private updateDomainState(axis: _ModuleSupport.CartesianAxis<any, any>) {
        const { syncManager } = this.moduleContext;
        const groupId = this.opts.groupId;
        const chartId = syncManager.getChartId();
        const axisId = axis.id;
        const groupState = syncManager.getGroupState(groupId);
        if (!groupState) throw new Error('AG Charts - no GroupState for groupId: ' + groupId);

        const domainsByDirection = (groupState.domains ??= {});
        const directionDomains = (domainsByDirection[axis.direction] ??= { derived: [], sources: {}, dirty: true });
        const chartDirectionDomains = (directionDomains.sources[chartId] ??= {});
        chartDirectionDomains[axisId] = axis.dataDomain.domain;
        directionDomains.dirty = true;

        const domainsById = (groupState.domainsById ??= {});
        const idDomains = (domainsById[axisId] ??= { derived: [], sources: {}, dirty: true });
        const chartIdDomains = (idDomains.sources[chartId] ??= {});
        chartIdDomains[axisId] = axis.dataDomain.domain;
        idDomains.dirty = true;

        const domainsByPosition = (groupState.domainsByPosition ??= {});
        const positionDomains = (domainsByPosition[axis.position] ??= { derived: [], sources: {}, dirty: true });
        const chartPositionDomains = (positionDomains.sources[chartId] ??= {});
        chartPositionDomains[axisId] = axis.dataDomain.domain;
        positionDomains.dirty = true;

        return { groupState, directionDomains, idDomains, positionDomains };
    }

    private validateAxis(axis: _ModuleSupport.CartesianAxis<any, any>, groupState: _ModuleSupport.SyncGroupState) {
        const opts = this.opts;
        const multiSeries = this.moduleContext.syncManager.getGroupSyncMode(opts.groupId) === 'multi-series';

        if (!syncedDirections(opts.axes).includes(axis.direction)) return;

        if (multiSeries) {
            this.validateMultiSeries(axis, groupState);
        } else {
            this.validateSingleSeries(axis, groupState);
        }
    }

    private validateMultiSeries(
        axis: _ModuleSupport.CartesianAxis<any, any>,
        groupState: _ModuleSupport.SyncGroupState
    ) {
        const matchingKeys = new Set(axis.boundSeries.flatMap((s) => s.getKeys(axis.direction)));

        for (const member of groupState.members) {
            const memberSyncDirections = syncedDirections(member.axes);

            const keyMatchedAxes = member.moduleContext.chartService.axes
                .filter((a): a is _ModuleSupport.CartesianAxis<any, any> => CartesianAxis.is(a))
                .filter((a) => memberSyncDirections.includes(a.direction))
                .filter((a) => a.boundSeries.some((s) => s.getKeys(a.direction).some((k) => matchingKeys.has(k))));
            if (keyMatchedAxes.length === 0) continue;

            const [firstAxis] = keyMatchedAxes;
            if (!axesCompatible(axis, firstAxis)) {
                this.moduleContext.logger.warnOnce(
                    'To allow synchronization, ensure that all synchronized axes with matching keys have matching min, max, nice, and reverse properties.'
                );
                this.disableSelf();
                return;
            }
        }
    }

    private validateSingleSeries(
        axis: _ModuleSupport.CartesianAxis<any, any>,
        groupState: _ModuleSupport.SyncGroupState
    ) {
        const [reference] = groupState.members;
        if (reference === this) return;

        const domainMode = this.opts.domainMode ?? 'id';
        for (const nextAxis of reference.moduleContext.chartService.axes) {
            if (!CartesianAxis.is(nextAxis) || axis.direction !== nextAxis.direction) continue;
            if (domainMode === 'id' && axis.id !== nextAxis.id) continue;
            if (domainMode === 'position' && axis.position !== nextAxis.position) continue;

            if (!axesCompatible(axis, nextAxis)) {
                this.moduleContext.logger.warnOnce(
                    'To allow synchronization, ensure that all charts have matching min, max, nice, and reverse properties on the synchronized axes.'
                );
                this.disableSelf();
                return;
            }
        }
    }

    private disableSelf() {
        if (this.disabledByValidation) return;
        this.disabledByValidation = true;
        ChartSync.rejectedByValidation.add(this);
        this.onEnabledChange();
    }

    private revalidateRejected(groupId: string | undefined) {
        for (const chartSync of ChartSync.rejectedByValidation) {
            if (chartSync.groupId === groupId) chartSync.revalidate();
        }
    }

    private revalidate() {
        this.disabledByValidation = false;
        ChartSync.rejectedByValidation.delete(this);
        this.onEnabledChange();
        this.updateChart(this);
    }

    private calculateDerivedDomain(
        axis: _ModuleSupport.CartesianAxis<any, any>,
        domains: _ModuleSupport.SyncDerivedDomain
    ) {
        if (!domains.dirty) return domains.derived;

        let previousDerived = domains.derived;
        const newDerivedBySource = Object.values(domains.sources).map((d) => Object.values(d));
        let newDerived: unknown[];
        if (ContinuousScale.is(axis.scale)) {
            newDerived = newDerivedBySource.flat(2);
        } else {
            newDerived = newDerivedBySource
                .flat()
                .toSorted((a, b) => (a.length > b.length ? -1 : 1))
                .flat();
        }
        domains.derived = unique(newDerived);

        if (ContinuousScale.is(axis.scale)) {
            previousDerived = findMinMax(previousDerived as number[]);
            domains.derived = findMinMax(domains.derived as number[]);
        }
        domains.dirty = false;

        if (domainChanged(axis.scale, previousDerived, domains.derived)) {
            debug(axis.id, 'updated', { before: previousDerived, after: domains.derived });
            this.updateSiblings();
        }

        return domains.derived;
    }

    removeAxis(axis: unknown) {
        const opts = this.opts;
        const axes = opts.axes;
        if (!CartesianAxis.is(axis) || (axes !== 'xy' && axes !== (axis.direction as string))) {
            return;
        }

        const { syncManager } = this.moduleContext;
        const syncGroup = syncManager.getGroupState(opts.groupId);

        const chartId = syncManager.getChartId();
        const axisId = axis.id;
        delete syncGroup?.domains?.[axis.direction]?.sources?.[chartId]?.[axisId];
        delete syncGroup?.domainsByPosition?.[axis.position]?.sources?.[chartId]?.[axisId];
        delete syncGroup?.domainsById?.[axisId]?.sources?.[chartId]?.[axisId];
    }

    private async waitForDomainsToBeReady() {
        const { syncManager } = this.moduleContext;
        const groupId = this.opts.groupId;
        let count = 0;
        while (syncManager.getGroupMembers(groupId).some((c) => c.syncStatus === 'init')) {
            debug('ChartSync.waitForDomainsToBeReady() - waiting for all domains to be calculated', groupId);
            await this.domainSync.waitForCompletion();
            count++;
        }
        if (count > 0) {
            debug('ChartSync.waitForDomainsToBeReady() - waited for', count, 'iterations');
        }
        this.domainSync.notify();
    }

    private prepareZoomUpdate() {
        const zoom = { ...this.moduleContext.chartState.getValue('zoom') };
        const axes = this.opts.axes;
        if (axes === 'x') {
            delete zoom?.y;
        } else if (axes === 'y') {
            delete zoom?.x;
        }

        return definedZoomState(zoom);
    }

    private onEnabledChange() {
        const { syncManager, highlightManager } = this.moduleContext;
        const opts = this.opts;
        const enabled = !this.disabledByValidation && opts.enabled;
        if (enabled) {
            syncManager.subscribe(opts.groupId);
            highlightManager.unhighlightDelay = 0;
        } else {
            syncManager.unsubscribe(opts.groupId);
            highlightManager.unhighlightDelay = 100;
        }
        this.updateSiblings();
        this.onNodeInteractionChange();
        this.onZoomChange();
    }

    private onGroupIdChange(newValue?: string, oldValue?: string) {
        if (!this.enabled || newValue === oldValue) return;
        const { syncManager } = this.moduleContext;
        syncManager.unsubscribe(oldValue);
        syncManager.subscribe(newValue);
        this.updateSiblings(oldValue);
        this.updateSiblings(newValue);
        this.revalidateRejected(oldValue);
    }

    private onAxesChange() {
        if (!this.enabled) return;
        this.updateChart(this);
    }

    private onNodeInteractionChange() {
        const opts = this.opts;
        const enabled = !this.disabledByValidation && opts.enabled;
        if (enabled && opts.nodeInteraction) {
            this.enabledNodeInteractionSync();
        } else {
            this.disableNodeInteractionSync?.();
        }
    }

    private onZoomChange() {
        const opts = this.opts;
        const enabled = !this.disabledByValidation && opts.enabled;
        if (enabled && opts.zoom) {
            this.enabledZoomSync();
        } else {
            this.disableZoomSync?.();
        }
    }

    override destroy() {
        ChartSync.rejectedByValidation.delete(this);
        const { syncManager } = this.moduleContext;
        syncManager.unsubscribe(this.groupId);
        this.updateSiblings();
        this.revalidateRejected(this.groupId);
        this.disableZoomSync?.();
        super.destroy();
    }
}
