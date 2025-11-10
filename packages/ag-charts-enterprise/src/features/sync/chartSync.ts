import { type AgChartSyncOptions, _ModuleSupport } from 'ag-charts-community';
import {
    AsyncAwaitQueue,
    BaseProperties,
    Debug,
    Logger,
    type ModuleInstance,
    Property,
    type Scale,
    arraysEqual,
    findMinMax,
    isDate,
    isDefined,
    isFiniteNumber,
    isObjectWithStringProperty,
    unique,
} from 'ag-charts-core';

import { readDatum } from '../../utils/datum';
import { definedZoomState } from '../zoom/zoomUtils';

const {
    CartesianAxis,
    ChartAxisDirection,
    ContinuousScale,
    TimeScale,
    UnitTimeScale,
    ChartUpdateType,
    ObserveChanges,
    TooltipManager,
} = _ModuleSupport;

const debug = Debug.create('sync');

function getDirectionKeys(
    series: _ModuleSupport.ISeries<any, any, any, any>,
    primary: _ModuleSupport.ChartAxisDirection,
    secondary: _ModuleSupport.ChartAxisDirection
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

export class ChartSync extends BaseProperties implements ModuleInstance, AgChartSyncOptions {
    static readonly className = 'Sync';

    @Property
    @ObserveChanges<ChartSync>((target) => target.onEnabledChange())
    enabled: boolean = false;

    @Property
    @ObserveChanges<ChartSync>((target, newValue, oldValue) => target.onGroupIdChange(newValue, oldValue))
    groupId?: string;

    @Property
    @ObserveChanges<ChartSync>((target) => target.onAxesChange())
    axes: 'x' | 'y' | 'xy' = 'x';

    @Property
    @ObserveChanges<ChartSync>((target) => target.onNodeInteractionChange())
    nodeInteraction: boolean = true;

    @Property
    @ObserveChanges<ChartSync>((target) => target.onZoomChange())
    zoom: boolean = true;

    @Property
    @ObserveChanges<ChartSync>((target) => target.onAxesChange())
    domainMode: 'direction' | 'position' | 'id' = 'id';

    private readonly domainSync = new AsyncAwaitQueue();

    constructor(protected moduleContext: _ModuleSupport.ModuleContext) {
        super();
    }

    updateSiblings(groupId?: string) {
        const { syncManager } = this.moduleContext;
        for (const chart of syncManager.getGroupSiblings(groupId ?? this.groupId)) {
            debug('ChartSync.updateSiblings()', chart.id, chart);
            this.updateChart(chart);
        }
    }

    private updateChart(chart: _ModuleSupport.SyncChartLike, updateType = ChartUpdateType.PROCESS_DOMAIN) {
        debug('ChartSync.updateChart()', chart.id, ChartUpdateType[updateType], chart);
        if (updateType === ChartUpdateType.PROCESS_DOMAIN) {
            chart.ctx.updateService.update(updateType, { forceNodeDataRefresh: true });
        } else {
            chart.ctx.updateService.update(updateType);
        }
    }

    private disableZoomSync?: () => void;
    private enabledZoomSync() {
        const { eventsHub } = this.moduleContext;
        this.disableZoomSync?.(); // Cleanup any existing listeners.
        this.disableZoomSync = eventsHub.on('zoom:change-request', this.onZoom.bind(this));
    }

    private onZoom() {
        const { syncManager } = this.moduleContext;
        for (const chart of syncManager.getGroupSiblings(this.groupId)) {
            const syncModule: any = chart.modulesManager.getModule('sync');
            if (!syncModule?.zoom) continue;
            const zoomModule: any = chart.modulesManager.getModule('zoom');
            if (!zoomModule) continue;

            const zoom = this.prepareZoomUpdate();

            debug('ChartsSyncManager.enabledZoomSync()', chart.id, zoom);
            zoomModule.updateSyncZoom(zoom);
        }
    }

    private disableNodeInteractionSync?: () => void;
    private enabledNodeInteractionSync() {
        this.disableNodeInteractionSync?.(); // Cleanup any existing listeners.
        this.disableNodeInteractionSync = this.moduleContext.eventsHub.on(
            'highlight:change',
            this.onHighlightChange.bind(this)
        );
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        const { syncManager } = this.moduleContext;

        if (event.callerId.endsWith('-sync')) return;

        debug('ChartSync.onHighlightChange()', event);

        const series = event.currentHighlight?.series;

        const [mainDirection] = syncedDirections(this.axes);
        const secondaryDirection = mainDirection === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const [primaryKeys, secondaryKeys] = series ? getDirectionKeys(series, mainDirection, secondaryDirection) : [];
        const datum = readDatum(event.currentHighlight);
        let eventValue = primaryKeys?.[0] ? datum?.[primaryKeys[0]] : undefined;
        let valueIsDate: boolean = false;
        if (isDate(eventValue)) {
            valueIsDate = true;
            eventValue = eventValue.getTime();
        }

        if (!event.currentHighlight?.datum) {
            for (const chart of syncManager.getGroupSiblings(this.groupId)) {
                const syncModule: any = chart.modulesManager.getModule('sync');
                if (!syncModule?.nodeInteraction) continue;

                chart.ctx.highlightManager.updateHighlight(`${chart.id}-sync`);
                chart.ctx.tooltipManager.removeTooltip(`${chart.id}-sync`);
            }
            return;
        }

        const useSecondaryDirectionKey = syncManager.getGroupSyncMode(this.groupId) === 'multi-series';
        this.findMatchingHighlightNodes(
            mainDirection,
            secondaryDirection,
            useSecondaryDirectionKey ? secondaryKeys : [],
            valueIsDate,
            eventValue,
            event
        );
    }

    private findMatchingHighlightNodes(
        primaryDirection: _ModuleSupport.ChartAxisDirection,
        secondaryDirection: _ModuleSupport.ChartAxisDirection,
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

        for (const chart of syncManager.getGroupSiblings(this.groupId)) {
            const syncModule: any = chart.modulesManager.getModule('sync');
            if (!syncModule?.nodeInteraction) continue;

            let dispatched = false;
            for (const axis of chart.axes) {
                if (!CartesianAxis.is(axis) || axis.direction !== primaryDirection) continue;

                // Find matching nodes for the main direction.
                const matchingNodes = chart.series
                    .filter((s) => {
                        if (!s.visible) return false;

                        // Narrow matches by matching the secondary direction keys of series, if multiple series are present.
                        if (secondaryKeys.length > 0) {
                            const [, seriesKeys] = getDirectionKeys(s, primaryDirection, secondaryDirection);
                            return secondaryKeys.every((key) => seriesKeys.includes(key));
                        }
                        return true;
                    })
                    .map(this.findMatchingNodes(axis, primaryDirection, valueIsDate, eventValue))
                    .filter(isDefined);

                if (
                    matchingNodes.length === 1 &&
                    matchingNodes[0]?.nodeDatum !== chart.ctx.highlightManager.getActiveHighlight()
                ) {
                    this.dispatchHighlightUpdate(chart, matchingNodes[0].nodeDatum);
                    dispatched = true;
                    break;
                }
            }

            if (!dispatched) {
                debug('ChartSync.findMatchingHighlightNodes() - no matching nodes', chart.id, event);
                this.dispatchHighlightUpdate(chart);
            }
        }
    }

    private findMatchingNodes(
        axis: _ModuleSupport.CartesianAxis<any, any>,
        mainDirection: string,
        valueIsDate: boolean,
        eventValue: any
    ) {
        return (series: _ModuleSupport.ISeries<any, any, any, any>) => {
            const seriesKeyAxis = series.getKeyAxis(axis.direction);
            if (seriesKeyAxis !== axis.id) return;

            const nodeData: _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType>[] =
                (series as any).contextNodeData?.nodeData ?? [];
            if (!nodeData?.length) return;

            const firstNode = nodeData[0];
            const mainDirectionKey = `${mainDirection}Key` as const;
            if (!isObjectWithStringProperty(firstNode, mainDirectionKey)) return;

            const valueKey = firstNode[mainDirectionKey];
            const nodeDatum = nodeData.find((datum: any) => {
                const nodeValue = datum.datum[valueKey];
                return valueIsDate ? nodeValue.getTime() === eventValue : nodeValue === eventValue;
            });

            return nodeDatum ? { series, nodeDatum } : null;
        };
    }

    private dispatchHighlightUpdate(
        chart: _ModuleSupport.SyncChartLike,
        nodeDatum?: _ModuleSupport.SeriesNodeDatum<any>
    ) {
        debug('ChartSync.dispatchHighlightUpdate()', chart.id, nodeDatum);

        chart.ctx.highlightManager.updateHighlight(`${chart.id}-sync`, nodeDatum);

        const tooltipEnabled = nodeDatum?.series.tooltipEnabled ?? chart.tooltip.enabled;
        if (nodeDatum && tooltipEnabled) {
            const bbox = chart.seriesAreaBoundingBox;
            const canvasX = bbox.x + (nodeDatum.midPoint?.x ?? nodeDatum.point?.x ?? 0);
            const canvasY = bbox.y + (nodeDatum.midPoint?.y ?? nodeDatum.point?.y ?? 0);
            const tooltipMeta = TooltipManager.makeTooltipMeta(
                { type: 'pointermove', canvasX, canvasY },
                nodeDatum.series,
                nodeDatum,
                undefined
            );

            chart.ctx.tooltipManager.updateTooltip(
                `${chart.id}-sync`,
                tooltipMeta,
                chart.getTooltipContent(nodeDatum.series, nodeDatum.datumIndex, nodeDatum, 'tooltip')
            );
        } else {
            chart.ctx.tooltipManager.removeTooltip(`${chart.id}-sync`);
        }

        this.updateChart(chart, ChartUpdateType.SERIES_UPDATE);
    }

    async getSyncedDomain(axis: unknown) {
        if (!CartesianAxis.is(axis) || (this.axes !== 'xy' && this.axes !== (axis.direction as string))) {
            return;
        }

        const { groupState, directionDomains, idDomains, positionDomains } = this.updateDomainState(axis);
        this.validateAxis(axis, groupState);

        await this.waitForDomainsToBeReady();

        if (this.domainMode === 'position') {
            return this.calculateDerivedDomain(axis, positionDomains);
        }

        if (this.domainMode === 'direction') {
            return this.calculateDerivedDomain(axis, directionDomains);
        }

        return this.calculateDerivedDomain(axis, idDomains);
    }

    private updateDomainState(axis: _ModuleSupport.CartesianAxis<any, any>) {
        const { syncManager } = this.moduleContext;
        const chartId = syncManager.getChart().id;
        const axisId = axis.id;
        const groupState = syncManager.getGroupState(this.groupId);
        if (!groupState) throw new Error('AG Charts - no GroupState for groupId: ' + this.groupId);

        // Update shared state of synced axis domain.
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
        const multiSeries = this.moduleContext.syncManager.getGroupSyncMode(this.groupId) === 'multi-series';

        if (!syncedDirections(this.axes).includes(axis.direction)) return;

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
        const { min, max, nice, reverse } = axis as _ModuleSupport.SyncAxisLike;
        const matchingKeys = new Set(axis.boundSeries.flatMap((s) => s.getKeys(axis.direction)));

        for (const member of groupState.members) {
            const { axes, modulesManager } = member;
            const syncModule: any = modulesManager.getModule('sync');
            const memberSyncDirections = syncedDirections(syncModule?.axes);

            const keyMatchedAxes = axes
                .filter((a) => memberSyncDirections.includes(a.direction))
                .filter((a) => a.boundSeries.some((s) => s.getKeys(a.direction).some((k) => matchingKeys.has(k))));
            if (keyMatchedAxes.length === 0) continue;

            const [firstAxis] = keyMatchedAxes;
            if (
                firstAxis.min !== min ||
                firstAxis.max !== max ||
                firstAxis.nice !== nice ||
                firstAxis.reverse !== reverse
            ) {
                Logger.warnOnce(
                    'To allow synchronization, ensure that all synchronized axes with matching keys have matching min, max, nice, and reverse properties.'
                );
                this.enabled = false;
                return;
            }
        }
    }

    private validateSingleSeries(
        axis: _ModuleSupport.CartesianAxis<any, any>,
        groupState: _ModuleSupport.SyncGroupState
    ) {
        const members = groupState.members;
        const [{ axes: syncAxes }] = members;

        const { direction, min, max, nice, reverse } = axis as (typeof syncAxes)[number];
        for (const nextAxis of syncAxes) {
            if (direction !== nextAxis.direction) continue;

            if (
                nice !== nextAxis.nice ||
                reverse !== nextAxis.reverse ||
                (min !== nextAxis.min && (isFiniteNumber(min) || isFiniteNumber(nextAxis.min))) ||
                (max !== nextAxis.max && (isFiniteNumber(max) || isFiniteNumber(nextAxis.max)))
            ) {
                Logger.warnOnce(
                    'To allow synchronization, ensure that all charts have matching min, max, nice, and reverse properties on the synchronized axes.'
                );
                this.enabled = false;
                return;
            }
        }
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
            // Sort category scale sources by their length, largest to smallest, so missing datums are not appended
            // to the end.
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
        if (!CartesianAxis.is(axis) || (this.axes !== 'xy' && this.axes !== (axis.direction as string))) {
            return;
        }

        const { syncManager } = this.moduleContext;
        const syncGroup = syncManager.getGroupState(this.groupId);

        const chartId = syncManager.getChart().id;
        const axisId = axis.id;
        delete syncGroup?.domains?.[axis.direction]?.sources?.[chartId]?.[axisId];
        delete syncGroup?.domainsByPosition?.[axis.position]?.sources?.[chartId]?.[axisId];
        delete syncGroup?.domainsById?.[axisId]?.sources?.[chartId]?.[axisId];
    }

    private async waitForDomainsToBeReady() {
        const { syncManager } = this.moduleContext;
        let count = 0;
        while (syncManager.getGroupMembers(this.groupId).some((c) => c.syncStatus === 'init')) {
            debug('ChartSync.waitForDomainsToBeReady() - waiting for all domains to be calculated', this.groupId);
            await this.domainSync.waitForCompletion();
            count++;
        }
        if (count > 0) {
            debug('ChartSync.waitForDomainsToBeReady() - waited for', count, 'iterations');
        }
        this.domainSync.notify();
    }

    private prepareZoomUpdate() {
        const { zoomManager } = this.moduleContext;

        const zoom = zoomManager.getZoom();
        if (this.axes === 'x') {
            delete zoom?.y;
        } else if (this.axes === 'y') {
            delete zoom?.x;
        }

        return definedZoomState(zoom);
    }

    private onEnabledChange() {
        const { syncManager } = this.moduleContext;
        if (this.enabled) {
            syncManager.subscribe(this.groupId);
        } else {
            syncManager.unsubscribe(this.groupId);
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
    }

    private onAxesChange() {
        if (!this.enabled) return;
        const { syncManager } = this.moduleContext;
        this.updateChart(syncManager.getChart());
    }

    private onNodeInteractionChange() {
        if (this.enabled && this.nodeInteraction) {
            this.enabledNodeInteractionSync();
        } else {
            this.disableNodeInteractionSync?.();
        }
    }

    private onZoomChange() {
        if (this.enabled && this.zoom) {
            this.enabledZoomSync();
        } else {
            this.disableZoomSync?.();
        }
    }

    destroy() {
        const { syncManager } = this.moduleContext;
        syncManager.unsubscribe(this.groupId);
        this.updateSiblings();
        this.disableZoomSync?.();
    }
}
