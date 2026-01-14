import type { AgZoomAutoScaling } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { CartesianAxisDirection, DeepRequired, ZoomMinMax } from 'ag-charts-core';
import {
    BaseProperties,
    ChartAxisDirection,
    CleanupRegistry,
    Property,
    isFiniteNumber,
    objectsEqual,
    strictObjectKeys,
} from 'ag-charts-core';

type CartesianAxisLike = ReturnType<_ModuleSupport.ZoomManager['getAxes']>[number];
type ZoomAutoScalingOpts = DeepRequired<AgZoomAutoScaling>;

// `chart.zoom.autoScaling` options
export class ZoomAutoScalingProperties extends BaseProperties implements ZoomAutoScalingOpts {
    constructor() {
        super();
    }

    @Property
    enabled = false;

    @Property
    padding = 0;
}

// `chart.zoom` options that ZoomAutoScaler is affected by.
interface ZoomAutoScalerPropertiesDeps {
    readonly enabled: boolean;
    readonly enableIndependentAxes?: boolean;
}

export class ZoomAutoScaler {
    constructor(
        private readonly properties: ZoomAutoScalingProperties,
        private readonly zoomManager: _ModuleSupport.ZoomManager,
        private readonly deps: ZoomAutoScalerPropertiesDeps,
        eventsHub: _ModuleSupport.EventsHub,
        eventsCleanup: CleanupRegistry
    ) {
        eventsCleanup.register(
            eventsHub.on('zoom:save-memento', (e) => this.onSaveMemento(e)),
            eventsHub.on('zoom:load-memento', (e) => this.onLoadMemento(e)),
            eventsHub.on('zoom:change-request', (e) => this.onChangeRequest(e))
        );
    }

    private manuallyAdjusted: boolean = false;

    get enabled(): boolean {
        return this.deps.enabled && this.properties.enabled && !this.manuallyAdjusted;
    }

    onManualAdjustment(direction: ChartAxisDirection) {
        if (direction === ChartAxisDirection.Y) {
            this.manuallyAdjusted = true;
        }
    }

    private onChangeRequest(event: _ModuleSupport.ZoomChangeRequestEvent) {
        this.manuallyAdjusted = event.manualAdjustment ?? this.manuallyAdjusted;

        if (event.isReset) {
            for (const id of event.changedAxes) {
                if (event.state[id]?.direction === ChartAxisDirection.Y) {
                    this.manuallyAdjusted = false;
                }
            }
        }
        if (this.enabled) {
            const constrainedZoom = this.autoScaleYZoom(event.state);
            if (constrainedZoom) {
                event.constrainChanges(constrainedZoom);
            }
        }
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

        const { padding } = this.properties;
        let yZoom: ZoomMinMax | undefined;
        if (this.deps.enableIndependentAxes) {
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
        const zoom = this.zoomManager.getZoom();
        if (zoom && changes) {
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
        if (zoom?.x == null) return;

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
        // Because xScale is only updated after a chart update, working out a visible range
        // will be calculated with unpredictable - but always accurate - numbers
        // However, floating point rounding causes issues when doing that
        // Instead, set the xScale to a consistent range, then just unset it after
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
        if (isFiniteNumber(yAxis.min)) {
            min = 0;
        }

        if (isFiniteNumber(yAxis.max)) {
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
