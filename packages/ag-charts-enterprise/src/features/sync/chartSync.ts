import { type AgChartSyncOptions, _ModuleSupport, _Util } from 'ag-charts-community';

const {
    BOOLEAN,
    STRING,
    UNION,
    BaseProperties,
    CartesianAxis,
    ChartUpdateType,
    isDate,
    isFiniteNumber,
    ObserveChanges,
    Validate,
} = _ModuleSupport;
const { Logger } = _Util;

export class ChartSync extends BaseProperties implements _ModuleSupport.ModuleInstance, AgChartSyncOptions {
    static className = 'Sync';

    @Validate(BOOLEAN)
    @ObserveChanges<ChartSync>((target) => target.onEnabledChange())
    enabled: boolean = false;

    @Validate(STRING, { optional: true })
    @ObserveChanges<ChartSync>((target, newValue, oldValue) => target.onGroupIdChange(newValue, oldValue))
    groupId?: string;

    @Validate(UNION(['x', 'y', 'xy'], 'an axis'))
    @ObserveChanges<ChartSync>((target) => target.onAxesChange())
    axes: 'x' | 'y' | 'xy' = 'x';

    @Validate(BOOLEAN)
    @ObserveChanges<ChartSync>((target) => target.onNodeInteractionChange())
    nodeInteraction: boolean = true;

    @Validate(BOOLEAN)
    @ObserveChanges<ChartSync>((target) => target.onZoomChange())
    zoom: boolean = true;

    constructor(protected moduleContext: _ModuleSupport.ModuleContext) {
        super();
    }

    private updateChart(chart: any, updateType = ChartUpdateType.UPDATE_DATA) {
        chart.updateService.update(updateType, { skipSync: true });
    }

    private updateSiblings(groupId?: string) {
        const { syncManager } = this.moduleContext;
        for (const chart of syncManager.getGroupSiblings(groupId)) {
            this.updateChart(chart);
        }
    }

    private enabledZoomSync() {
        const { syncManager, zoomManager } = this.moduleContext;
        this.disableZoomSync = zoomManager.addListener('zoom-change', () => {
            for (const chart of syncManager.getGroupSiblings(this.groupId)) {
                if ((chart.modules.get('sync') as ChartSync)?.zoom) {
                    chart.zoomManager.updateZoom(this.mergeZoom(chart));
                }
            }
        });
    }

    private disableZoomSync?: () => void;

    private enabledNodeInteractionSync() {
        const { highlightManager, syncManager } = this.moduleContext;
        this.disableNodeInteractionSync = highlightManager.addListener('highlight-change', (event) => {
            for (const chart of syncManager.getGroupSiblings(this.groupId)) {
                if (!(chart.modules.get('sync') as ChartSync)?.nodeInteraction) continue;

                if (!event.currentHighlight) {
                    chart.highlightManager.updateHighlight(chart.id);
                    continue;
                }

                for (const axis of chart.axes) {
                    const validDirection = this.axes === 'xy' ? 'x' : this.axes;
                    if (!CartesianAxis.is(axis) || axis.direction !== validDirection) continue;

                    const matchingNodes = chart.series
                        .map((series) => {
                            const seriesKeys = series.getKeys(axis.direction);

                            if (axis.keys.length && !axis.keys.some((key) => seriesKeys.includes(key))) return;

                            const [{ nodeData }] = (series as any).contextNodeData;

                            if (!nodeData?.length) return;

                            const valueKey = nodeData[0][`${axis.direction}Key`];
                            let eventValue = event.currentHighlight!.datum[valueKey];
                            const valueIsDate = isDate(eventValue);
                            if (valueIsDate) {
                                eventValue = eventValue.getTime();
                            }

                            return nodeData.find((nodeDatum: any) => {
                                const nodeValue = nodeDatum.datum[valueKey];
                                return valueIsDate ? nodeValue.getTime() === eventValue : nodeValue === eventValue;
                            });
                        })
                        .filter(Boolean);

                    if (matchingNodes.length < 2 && matchingNodes[0] !== chart.highlightManager.getActiveHighlight()) {
                        chart.highlightManager.updateHighlight(chart.id, matchingNodes[0]);
                        this.updateChart(chart, ChartUpdateType.SERIES_UPDATE);
                    }
                }
            }
        });
    }

    private disableNodeInteractionSync?: () => void;

    syncAxes(stopPropagation = false) {
        const { syncManager } = this.moduleContext;
        const chart = syncManager.getChart();

        const syncSeries = syncManager.getGroup(this.groupId).flatMap((chart) => chart.series);
        const syncAxes = syncManager.getGroupSiblings(this.groupId).flatMap((chart) => chart.axes);

        chart.axes.forEach((axis) => {
            if (!CartesianAxis.is(axis) || (this.axes !== 'xy' && this.axes !== axis.direction)) return;

            const { direction, min, max, nice, reverse } = axis as (typeof syncAxes)[number];

            for (const siblingAxis of syncAxes) {
                if (direction !== siblingAxis.direction) continue;

                if (
                    nice !== siblingAxis.nice ||
                    reverse !== siblingAxis.reverse ||
                    (min !== siblingAxis.min && (isFiniteNumber(min) || isFiniteNumber(siblingAxis.min))) ||
                    (max !== siblingAxis.max && (isFiniteNumber(max) || isFiniteNumber(siblingAxis.max)))
                ) {
                    Logger.warnOnce('For axes sync, ensure matching `min`, `max`, `nice`, and `reverse` properties.');
                    return;
                }
            }

            axis.boundSeries = syncSeries.filter((series) => {
                const seriesKeys = series.getKeys(axis.direction);
                return axis.keys.length ? axis.keys.some((key) => seriesKeys.includes(key)) : true;
            });
        });

        if (!stopPropagation) {
            this.updateSiblings(this.groupId);
        }
    }

    private mergeZoom(chart: any) {
        const { zoomManager } = this.moduleContext;

        if (this.axes === 'xy') {
            return zoomManager.getZoom();
        }

        const combinedZoom = chart.zoomManager.getZoom() ?? {};
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
        this.updateSiblings(this.groupId);
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
        this.updateSiblings(this.groupId);
        this.disableZoomSync?.();
    }
}
