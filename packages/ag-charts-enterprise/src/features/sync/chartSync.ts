import { type AgChartSyncOptions, _ModuleSupport } from 'ag-charts-community';
import { AsyncAwaitQueue, Logger, arraysEqual, isDate, isDefined, isFiniteNumber, unique } from 'ag-charts-core';

const {
    BaseProperties,
    CartesianAxis,
    ContinuousScale,
    ChartUpdateType,
    ObserveChanges,
    TooltipManager,
    Property,
    findMinMax,
} = _ModuleSupport;

interface ZoomState {
    min: number;
    max: number;
}

interface AxisZoomState {
    x?: ZoomState;
    y?: ZoomState;
    autoScaleYAxis?: boolean;
}

interface ChartLike {
    id: string;
    ctx: {
        updateService: {
            update(type: _ModuleSupport.ChartUpdateType): void;
        };
        zoomManager: {
            getZoom(): AxisZoomState | undefined;
        };
    };
    getTooltipContent(
        series: _ModuleSupport.ISeries<unknown, unknown, unknown>,
        datumIndex: unknown,
        removeMeDatum: unknown
    ): _ModuleSupport.TooltipContent[];
}

const debug = _ModuleSupport.Debug.create('sync');

export class ChartSync extends BaseProperties implements _ModuleSupport.ModuleInstance, AgChartSyncOptions {
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

    private updateChart(chart: ChartLike, updateType = ChartUpdateType.UPDATE_DATA) {
        debug('ChartSync.updateChart()', chart.id, updateType, chart);
        chart.ctx.updateService.update(updateType);
    }

    private enabledZoomSync() {
        const { syncManager, zoomManager } = this.moduleContext;
        this.disableZoomSync = zoomManager.addListener('zoom-change', () => {
            for (const chart of syncManager.getGroupSiblings(this.groupId)) {
                if (chart.modulesManager.getModule<ChartSync>('sync')?.zoom) {
                    chart.ctx.zoomManager.updateZoom('sync', this.mergeZoom(chart));
                }
            }
        });
    }

    private disableZoomSync?: () => void;

    private enabledNodeInteractionSync() {
        const { highlightManager, syncManager } = this.moduleContext;
        this.disableNodeInteractionSync = highlightManager.addListener('highlight-change', (event) => {
            debug('ChartSync - highlight-change', event);

            for (const chart of syncManager.getGroupSiblings(this.groupId)) {
                if (!chart.modulesManager.getModule<ChartSync>('sync')?.nodeInteraction) continue;

                if (!event.currentHighlight?.datum) {
                    chart.ctx.highlightManager.updateHighlight(chart.id);
                    chart.ctx.tooltipManager.removeTooltip(chart.id);
                    continue;
                }

                for (const axis of chart.axes) {
                    const validDirection = this.axes === 'xy' ? 'x' : this.axes;
                    if (!CartesianAxis.is(axis) || axis.direction !== validDirection) continue;

                    const matchingNodes = chart.series
                        .map((series) => {
                            const seriesKeys = series.getKeys(axis.direction);

                            if (axis.keys.length && !axis.keys.some((key) => seriesKeys.includes(key))) return;

                            const { nodeData } = (series as any).contextNodeData;

                            if (!nodeData?.length) return;

                            const valueKey = nodeData[0][`${axis.direction}Key`];
                            let eventValue = event.currentHighlight!.datum[valueKey];
                            const valueIsDate = isDate(eventValue);

                            if (valueIsDate) {
                                eventValue = eventValue.getTime();
                            }

                            const nodeDatum = nodeData.find((datum: any) => {
                                const nodeValue = datum.datum[valueKey];
                                return valueIsDate ? nodeValue.getTime() === eventValue : nodeValue === eventValue;
                            });

                            return nodeDatum ? { series, nodeDatum } : null;
                        })
                        .filter(isDefined);

                    if (
                        matchingNodes.length < 2 &&
                        matchingNodes[0]?.nodeDatum !== chart.ctx.highlightManager.getActiveHighlight()
                    ) {
                        const { series, nodeDatum } = matchingNodes[0] ?? {};
                        chart.ctx.highlightManager.updateHighlight(chart.id, nodeDatum);

                        if (nodeDatum) {
                            const canvasX = nodeDatum.midPoint?.x ?? nodeDatum.point?.x ?? 0;
                            const canvasY = nodeDatum.midPoint?.y ?? nodeDatum.point?.y ?? 0;
                            const tooltipMeta = TooltipManager.makeTooltipMeta(
                                { type: 'pointermove', canvasX, canvasY },
                                series,
                                nodeDatum,
                                undefined
                            );

                            chart.ctx.tooltipManager.updateTooltip(
                                chart.id,
                                tooltipMeta,
                                chart.getTooltipContent(series, nodeDatum.datumIndex, nodeDatum)
                            );
                        } else {
                            chart.ctx.tooltipManager.removeTooltip(chart.id);
                        }

                        this.updateChart(chart, ChartUpdateType.SERIES_UPDATE);
                    }
                }
            }
        });
    }

    private disableNodeInteractionSync?: () => void;

    async getSyncedDomain(axis: unknown) {
        if (!CartesianAxis.is(axis) || (this.axes !== 'xy' && this.axes !== axis.direction)) {
            return;
        }

        const { syncManager } = this.moduleContext;
        const chartId = syncManager.getChart().id;
        const groupState = syncManager.getGroupState(this.groupId);
        if (!groupState) throw new Error('AG Charts - no GroupState for groupId: ' + this.groupId);

        // Update shared state of synced axis domain.
        const domains = (groupState.domains ??= {});
        const directionDomains = (domains[axis.direction] ??= { derived: [], sources: {} });
        const chartDomains = (directionDomains.sources[chartId] ??= {});
        chartDomains[axis.id] = axis.dataDomain.domain;

        await this.waitForDomainsToBeReady();

        const members = groupState.members;
        const [{ axes: syncAxes }] = members;

        const { direction, min, max, nice, reverse } = axis as (typeof syncAxes)[number];

        for (const mainAxis of syncAxes) {
            if (direction !== mainAxis.direction) continue;

            if (
                nice !== mainAxis.nice ||
                reverse !== mainAxis.reverse ||
                (min !== mainAxis.min && (isFiniteNumber(min) || isFiniteNumber(mainAxis.min))) ||
                (max !== mainAxis.max && (isFiniteNumber(max) || isFiniteNumber(mainAxis.max)))
            ) {
                Logger.warnOnce(
                    'To allow synchronization, ensure that all charts have matching min, max, nice, and reverse properties on the synchronized axes.'
                );
                this.enabled = false;
                return;
            }
        }

        const previousDerived = directionDomains.derived;
        directionDomains.derived = unique(
            Object.values(directionDomains.sources)
                .map((d) => Object.values(d))
                .flat()
                .flat()
        );

        if (ContinuousScale.is(axis.scale)) {
            directionDomains.derived = findMinMax(directionDomains.derived as number[]);
        }
        if (!arraysEqual(previousDerived, directionDomains.derived)) {
            this.updateSiblings();
        }

        return directionDomains.derived;
    }

    removeAxis(axis: unknown) {
        if (!CartesianAxis.is(axis) || (this.axes !== 'xy' && this.axes !== axis.direction)) {
            return;
        }

        const { syncManager } = this.moduleContext;
        const syncGroup = syncManager.getGroupState(this.groupId);

        delete syncGroup?.domains?.[axis.direction]?.sources?.[syncManager.getChart().id]?.[axis.id];
    }

    private async waitForDomainsToBeReady() {
        const { syncManager } = this.moduleContext;
        while (syncManager.getGroupMembers(this.groupId).some((c) => c.syncStatus === 'init')) {
            debug('ChartSync.waitForDomainsToBeReady() - waiting for all domains to be calculated', this.groupId);
            await this.domainSync.await();
        }
        this.domainSync.notify();
    }

    private mergeZoom(chart: ChartLike) {
        const { zoomManager } = this.moduleContext;

        if (this.axes === 'xy') {
            return zoomManager.getZoom();
        }

        const combinedZoom = chart.ctx.zoomManager.getZoom() ?? {};
        combinedZoom[this.axes] = zoomManager.getZoom()?.[this.axes];
        return combinedZoom;
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
