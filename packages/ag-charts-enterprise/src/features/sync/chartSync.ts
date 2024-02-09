import { type AgChartSyncOptions, _ModuleSupport, _Util } from 'ag-charts-community';

const {
    BOOLEAN,
    STRING,
    UNION,
    BaseProperties,
    CartesianAxis,
    ChartUpdateType,
    isFiniteNumber,
    ObserveChanges,
    Validate,
} = _ModuleSupport;
const { Logger } = _Util;

export class ChartSync extends BaseProperties implements _ModuleSupport.ModuleInstance, AgChartSyncOptions {
    static className = 'Sync';

    @Validate(BOOLEAN)
    @ObserveChanges<ChartSync>((target, newValue) => {
        const { syncManager } = target.moduleContext;
        if (newValue) {
            syncManager.subscribe(target.groupId);
        } else {
            syncManager.unsubscribe(target.groupId);
        }
    })
    enabled: boolean = false;

    @Validate(STRING, { optional: true })
    @ObserveChanges<ChartSync>((target, newValue, oldValue) => {
        const { syncManager } = target.moduleContext;
        syncManager.unsubscribe(oldValue);
        syncManager.subscribe(newValue);
        target.updateSiblings(oldValue);
        target.updateSiblings(newValue);
    })
    groupId?: string;

    @Validate(UNION(['x', 'y', 'xy'], 'an axis'))
    @ObserveChanges<ChartSync>((target) => {
        const { syncManager } = target.moduleContext;
        target.updateChart(syncManager.getChart());
    })
    axes: 'x' | 'y' | 'xy' = 'x';

    @Validate(BOOLEAN)
    @ObserveChanges<ChartSync>((target, newValue) => {
        if (newValue) {
            target.enabledZoomSync();
        } else {
            target.disableZoomSync?.();
        }
    })
    zoom: boolean = true;

    constructor(protected moduleContext: _ModuleSupport.ModuleContext) {
        super();
    }

    private updateChart(chart: any) {
        chart.updateService.update(ChartUpdateType.UPDATE_DATA, { skipSync: true });
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
                chart.zoomManager.updateZoom(zoomManager.getZoom());
            }
        });
    }

    private disableZoomSync?: () => void;

    syncAxes(stopPropagation = false) {
        const { syncManager } = this.moduleContext;
        const chart = syncManager.getChart();

        const syncSeries = syncManager.getGroup(this.groupId).flatMap((chart) => chart.series);
        const syncAxes = syncManager.getGroupSiblings(this.groupId).flatMap((chart) => chart.axes);

        chart.axes.forEach((axis) => {
            if (!CartesianAxis.is(axis) || (this.axes !== 'xy' && this.axes !== axis.direction)) return;

            const { direction, nice, min, max } = axis as (typeof syncAxes)[number];

            for (const siblingAxis of syncAxes) {
                if (direction !== siblingAxis.direction) continue;

                if (
                    nice !== siblingAxis.nice ||
                    (min !== siblingAxis.min && (isFiniteNumber(min) || isFiniteNumber(siblingAxis.min))) ||
                    (max !== siblingAxis.max && (isFiniteNumber(max) || isFiniteNumber(siblingAxis.max)))
                ) {
                    Logger.warnOnce('For axes sync, ensure matching `nice`, `min`, and `max` properties.');
                    return;
                }
            }

            axis.boundSeries = syncSeries.filter((series) => {
                const seriesKeys = series.getKeys(axis.direction);
                return axis.keys.length ? axis.keys.some((key) => seriesKeys?.includes(key)) : true;
            });
        });

        if (!stopPropagation) {
            this.updateSiblings(this.groupId);
        }
    }

    // syncMouseInteractions() {
    //     // TODO: translate x, y according to each chart dimensions
    //     const { interactionManager, syncManager } = this.moduleContext;
    //     interactionManager.addListener('hover', (e) => {
    //         if ('stopPropagation' in e && e.stopPropagation) return;
    //         for (const chart of syncManager.getSiblings(this.groupId)) {
    //             (chart as any).interactionManager.listeners.dispatch('hover', { ...e, stopPropagation: true });
    //         }
    //     });
    //     interactionManager.addListener('leave', (e) => {
    //         if ('stopPropagation' in e && e.stopPropagation) return;
    //         for (const chart of syncManager.getSiblings(this.groupId)) {
    //             (chart as any).interactionManager.listeners.dispatch('leave', { ...e, stopPropagation: true });
    //         }
    //     });
    // }

    destroy() {
        const { syncManager } = this.moduleContext;
        syncManager.unsubscribe(this.groupId);
        this.updateSiblings(this.groupId);
        this.disableZoomSync?.();
    }
}
