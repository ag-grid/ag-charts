import { _ModuleSupport } from 'ag-charts-community';
import type {
    CartesianAxisDirection,
    CleanupRegistry,
    NormalisedZoomAutoScaling,
    ReactiveState,
    ZoomMinMax,
} from 'ag-charts-core';
import { ChartAxisDirection, isFiniteNumber, objectsEqual, strictObjectKeys } from 'ag-charts-core';

type CartesianAxisLike = ReturnType<_ModuleSupport.ZoomManager['getAxes']>[number];

export interface ZoomAutoScalerCtx {
    readonly zoomManager: _ModuleSupport.ZoomManager;
    readonly eventsHub: _ModuleSupport.EventsHub;
    readonly chartState: ReactiveState<_ModuleSupport.ChartState>;
    readonly cleanup: CleanupRegistry;
    // Reactive option access delegated from parent via getter properties.
    readonly opts: {
        readonly enabled: boolean;
        readonly enableIndependentAxes?: boolean;
        readonly autoScaling: NormalisedZoomAutoScaling;
    };
}

export class ZoomAutoScaler {
    constructor(private readonly ctx: ZoomAutoScalerCtx) {
        ctx.cleanup.register(
            ctx.eventsHub.on('zoom:save-memento', (e) => this.onSaveMemento(e)),
            ctx.eventsHub.on('zoom:load-memento', (e) => this.onLoadMemento(e)),
            ctx.eventsHub.on('zoom:change-request', (e) => this.onChangeRequest(e))
        );
    }

    private get zoomManager() {
        return this.ctx.zoomManager;
    }

    private get autoScalingOpts(): NormalisedZoomAutoScaling {
        return this.ctx.opts.autoScaling;
    }

    private manuallyAdjusted: boolean = false;

    get enabled(): boolean {
        return this.ctx.opts.enabled && this.autoScalingOpts.enabled && !this.manuallyAdjusted;
    }

    onManualAdjustment(direction: ChartAxisDirection) {
        if (direction === ChartAxisDirection.Y) {
            this.manuallyAdjusted = true;
        }
    }

    private onChangeRequest(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const hasYAxisChange = this.hasYAxisChange(event);
        if (event.sourceDetail === 'scrollbar' && hasYAxisChange) {
            this.manuallyAdjusted = true;
        }
        if (event.isReset && hasYAxisChange) {
            this.manuallyAdjusted = false;
        }
        if (this.enabled) {
            const constrainedZoom = this.autoScaleYZoom(event.state);
            if (constrainedZoom) {
                event.constrainChanges(constrainedZoom);
            }
        }
    }

    private hasYAxisChange(event: _ModuleSupport.ZoomChangeRequestEvent): boolean {
        for (const id of event.changedAxes) {
            if (event.state[id]?.direction === ChartAxisDirection.Y) {
                return true;
            }
        }
        return false;
    }

    private onSaveMemento(event: _ModuleSupport.ZoomSaveMementoEvent) {
        event.memento.autoScaledAxes = this.enabled ? ['y'] : undefined;
    }

    private onLoadMemento(event: _ModuleSupport.ZoomLoadMementoEvent) {
        const { zoom, memento, navigatorModule, zoomModule } = event;
        // Do not adjust the y-axis zoom if the navigator module is enabled by itself
        if (!navigatorModule || zoomModule) {
            let yAutoScale: boolean | undefined = memento?.autoScaledAxes?.includes('y');
            if (memento?.rangeY) {
                yAutoScale ??= false;
                zoom.y = this.zoomManager.rangeToRatioDirection(ChartAxisDirection.Y, memento.rangeY) ?? {
                    min: 0,
                    max: 1,
                };
            } else if (memento?.ratioY) {
                yAutoScale ??= false;
                zoom.y = {
                    min: memento.ratioY.start ?? 0,
                    max: memento.ratioY.end ?? 1,
                };
            } else {
                yAutoScale ??= true;
                const autoZoomY = yAutoScale ? this.getAutoScaleYZoom(zoom.x) : undefined;
                zoom.y = autoZoomY ?? { min: 0, max: 1 };
            }

            if (yAutoScale != undefined) {
                this.manuallyAdjusted = !yAutoScale;
            }
        }
    }

    private getAutoScaleYZoom(zoomX: ZoomMinMax): ZoomMinMax | undefined {
        if (!this.enabled) return;

        const { padding } = this.autoScalingOpts;
        let yZoom: ZoomMinMax | undefined;
        if (this.ctx.opts.enableIndependentAxes) {
            yZoom = this.primaryAxisZoom(ChartAxisDirection.Y, zoomX, { padding });
        } else {
            yZoom = this.combinedAxisZoom(ChartAxisDirection.Y, zoomX, { padding });
        }

        if (zoomX.min === 0 && zoomX.max === 1) {
            // If autoScaling is not possible (i.e. horizontal bar series), do not autoscale when zoomed out
            return yZoom == null ? undefined : { min: 0, max: 1 };
        } else {
            return yZoom;
        }
    }

    private autoScaleYZoom(changes?: _ModuleSupport.UpdateZoomChanges): _ModuleSupport.CoreZoomState | undefined {
        const zoom = { ...this.ctx.chartState.getValue('zoom') };
        if (changes) {
            // The `zoom` is outdated, let's patch in the updates from `changes`.
            const state = this.zoomManager.getAxisZooms();
            for (const dir of [ChartAxisDirection.X, ChartAxisDirection.Y] as const) {
                for (const id of strictObjectKeys(changes)) {
                    if (state[id]?.direction === dir) {
                        zoom[dir] = changes[id];
                        break;
                    }
                }
            }
        }
        if (zoom.x == null) return;

        const zoomY = this.getAutoScaleYZoom(zoom.x);
        if (zoomY == null || objectsEqual(zoom.y, zoomY)) return;

        return this.zoomManager.toCoreZoomState({ x: zoom.x, y: zoomY });
    }

    private zoomBounds(
        xAxis: CartesianAxisLike,
        yAxis: CartesianAxisLike,
        zoom: { min: number; max: number },
        padding: number
    ): ZoomMinMax | undefined {
        // The scale ranges are only refreshed on chart update, so pin them to [0, 1] for the duration
        // of this calculation and restore them after, avoiding floating-point rounding artefacts.
        const xScale = xAxis.scale;
        const xScaleRange = xScale.range;
        xScale.range = [0, 1];

        const yScale = yAxis.scale;
        const yScaleRange = yScale.range;
        yScale.range = [0, 1];

        let min = 1;
        let minPadding = false;
        let max = 0;
        let maxPadding = false;
        for (const series of yAxis.boundSeries) {
            if (!series.visible) continue;

            const { connectsToYAxis } = series;
            const yValues = series.getRange(ChartAxisDirection.Y, [zoom.min, zoom.max]);

            for (const yValue of yValues) {
                const y = yScale.convert(yValue);

                if (!Number.isFinite(y)) continue;

                if (y < min) {
                    min = y;
                    minPadding = !connectsToYAxis || yValue < 0;
                }

                if (y > max) {
                    max = y;
                    maxPadding = !connectsToYAxis || yValue > 0;
                }
            }
        }

        // We could avoid the loop if both these are set, but it's not worth the complexity
        if (isFiniteNumber(yAxis.options?.min)) {
            min = 0;
        }

        if (isFiniteNumber(yAxis.options?.max)) {
            max = 1;
        }

        xScale.range = xScaleRange;
        yScale.range = yScaleRange;

        if (min >= max) return;

        const totalPadding = (minPadding ? padding : 0) + (maxPadding ? padding : 0);
        const paddedDelta = Math.min((max - min) * (1 + totalPadding), 1);
        if (paddedDelta <= 0) return;

        if (minPadding && maxPadding) {
            const mid = (max + min) / 2;
            min = mid - paddedDelta / 2;
            max = mid + paddedDelta / 2;
        } else if (!minPadding && maxPadding) {
            max = min + paddedDelta;
        } else if (minPadding && !maxPadding) {
            min = max - paddedDelta;
        }

        if (min < 0) {
            max += -min;
            min = 0;
        } else if (max > 1) {
            min -= max - 1;
            max = 1;
        }

        return { min, max };
    }

    private primaryAxisZoom(
        direction: CartesianAxisDirection,
        zoom: ZoomMinMax,
        { padding = 0 } = {}
    ): ZoomMinMax | undefined {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const xAxis = this.zoomManager.getPrimaryAxis(crossDirection);
        const yAxis = this.zoomManager.getPrimaryAxis(direction);

        if (xAxis == null || yAxis == null) return;

        return this.zoomBounds(xAxis, yAxis, zoom, padding);
    }

    private combinedAxisZoom(
        direction: CartesianAxisDirection,
        zoom: ZoomMinMax,
        { padding = 0 } = {}
    ): ZoomMinMax | undefined {
        const axes = this.zoomManager.getAxes();
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const seriesXAxes = new Map<any, CartesianAxisLike>();
        for (const xAxis of axes) {
            if (xAxis.direction !== crossDirection) continue;

            for (const series of xAxis.boundSeries) {
                seriesXAxes.set(series, xAxis);
            }
        }

        let min = 1;
        let max = 0;
        for (const yAxis of axes) {
            if (yAxis.direction !== direction) continue;

            for (const series of yAxis.boundSeries) {
                const xAxis = seriesXAxes.get(series);
                if (xAxis == null) continue;

                const bounds = this.zoomBounds(xAxis, yAxis, zoom, padding);
                if (bounds == null) return;

                min = Math.min(min, bounds.min);
                max = Math.max(max, bounds.max);
            }
        }

        const delta = 1e-6;
        if (min < delta) min = 0;
        if (max > 1 - delta) max = 1;

        if (min > max) return;

        return { min, max };
    }
}
