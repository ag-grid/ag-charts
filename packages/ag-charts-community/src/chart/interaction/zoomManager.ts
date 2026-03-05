import {
    ChartAxisDirection,
    Debug,
    Logger,
    ScaleAlignment,
    attachDescription,
    clamp,
    deepClone,
    deepFreeze,
    defined,
    definedZoomState,
    isFiniteNumber,
    isObject,
    strictObjectKeys,
    validate,
} from 'ag-charts-core';
import type {
    AxisID,
    BoxBounds,
    CartesianAxisDirection,
    DeepReadonly,
    DefinedZoomState,
    MementoOriginator,
    OptionsDefs,
    RequireOptional,
    Scale,
    ZoomMinMax,
    ZoomState,
} from 'ag-charts-core';
import type { AgZoomEvent, AgZoomEventSource, AgZoomRange, AgZoomRatio } from 'ag-charts-types';

import type {
    EventsHub,
    ZoomChangeRequestEvent,
    ZoomChangeState,
    ZoomEventSourceDetail,
    ZoomMemento,
} from '../../core/eventsHub';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { BBox } from '../../scene/bbox';
import { BaseManager } from '../../util/baseManager';
import type { TypedEvent } from '../../util/observable';
import { calcPanToBBoxRatios } from '../../util/panToBBox';
import { rangeAlignment } from '../rangeAlignment';
import type { ISeries } from '../series/seriesTypes';
import type { UpdateService } from '../updateService';

type CoreZoomEntry = ZoomMinMax & { direction: CartesianAxisDirection };
export type CoreZoomState = Record<AxisID, CoreZoomEntry>;
export type CoreZoomStateSafeRetrieval = { readonly [K in AxisID]: CoreZoomEntry | undefined };

export type SimpleAxis = {
    id: AxisID;
    direction: CartesianAxisDirection;
};

export type CartesianAxisLike = SimpleAxis & {
    visibleRange: [number, number];
    scale: Scale<any, any>;
    range: [number, number];
    boundSeries: ISeries<any, any, any>[];
    min?: number;
    max?: number;
};

const rangeValidator = (axis?: CartesianAxisLike) =>
    attachDescription((value, { options }) => {
        if (!ContinuousScale.is(axis?.scale) && !DiscreteTimeScale.is(axis?.scale)) return true;
        if (value == null || options.end == null) return true;
        return value < options.end;
    }, `to be less than end`);

function validateChanges(changes: UpdateZoomChanges): void {
    for (const axisId of strictObjectKeys(changes)) {
        const zoom = changes[axisId];
        if (!zoom) continue;

        const { min, max } = zoom;

        if (min < 0 || max > 1) {
            Logger.warnOnce(
                `Attempted to update axis (${axisId}) zoom to an invalid ratio of [{ min: ${min}, max: ${max} }], expecting a ratio of 0 to 1. Ignoring.`
            );

            // Remove invalid zoom state for this axis
            delete changes[axisId];
        }
    }
}

export type UpdateZoomSourcing = {
    source: AgZoomEventSource;
    sourceDetail: ZoomEventSourceDetail;
};
export type UpdateZoomChanges = Record<AxisID, ZoomMinMax | undefined>;
export type UpdateZoomParams = UpdateZoomSourcing & {
    isReset: boolean;
    changes: UpdateZoomChanges;
};

export type UpdateZoomWithFunction = (
    start: Date | number,
    end: Date | number,
    windowStart: Date | number,
    windowEnd: Date | number
) => [Date | number | undefined, Date | number | undefined];

function refreshCoreState(nextAxes: Array<CartesianAxisLike> | Array<SimpleAxis>, state: CoreZoomStateSafeRetrieval) {
    const result: CoreZoomState = {};
    for (const { id, direction } of nextAxes) {
        const { min, max } = state[id] ?? { min: 0, max: 1 };
        result[id] = { min, max, direction };
    }
    return result;
}

function areEqualCoreZooms(p: CoreZoomStateSafeRetrieval, q: CoreZoomStateSafeRetrieval) {
    const pKeys = strictObjectKeys(p);
    const qKeys = strictObjectKeys(q);

    // Check that pKeys & qKeys are the same set of strings:
    if (pKeys.length !== qKeys.length) return false;
    for (const k of pKeys) if (!qKeys.includes(k)) return false;

    for (const k of pKeys) {
        const pVal = p[k];
        const qVal = q[k];
        if (pVal === qVal) {
            continue;
        } else if (
            pVal == undefined ||
            qVal == undefined ||
            pVal.direction !== qVal.direction ||
            pVal.min !== qVal.min ||
            pVal.max !== qVal.max
        ) {
            return false;
        }
    }
    return true;
}

export function userInteraction<D extends ZoomEventSourceDetail>(sourceDetail: D) {
    return { source: 'user-interaction' as const, sourceDetail };
}

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager implements MementoOriginator<ZoomMemento> {
    public mementoOriginatorKey = 'zoom' as const;

    private state: CoreZoomStateSafeRetrieval = {};
    private readonly axes: CartesianAxisLike[] = [];
    private didLayoutAxes = false;
    private pendingZoomEventSource?: AgZoomEventSource;

    private lastRestoredState: CoreZoomStateSafeRetrieval = {};
    private lastRestoredRequiredRange?: number;
    private lastRestoredRequiredRangeDirection?: CartesianAxisDirection;
    private restoreRequiredRangeIterations = 0;
    private independentAxes = false;
    private navigatorModule = false;
    private zoomModule = false;
    private readonly debug = Debug.create(true, 'zoom');

    // The initial state memento can not be restored until the chart has performed its first layout. Instead save it as
    // pending and restore then delete it on the first layout.
    private pendingMemento:
        | {
              version: string;
              mementoVersion: string;
              memento: ZoomMemento | undefined;
          }
        | undefined = undefined;

    constructor(
        private readonly eventsHub: EventsHub,
        updateService: UpdateService,
        private readonly fireChartEvent: <TEvent extends TypedEvent>(event: TEvent) => void
    ) {
        super();

        this.cleanup.register(
            eventsHub.on('zoom:change-request', (event) => {
                this.constrainZoomToRequiredWidth(event);
            }),
            updateService.addListener('pre-series-update', ({ requiredRangeRatio, requiredRangeDirection }) => {
                this.didLayoutAxes = true;

                const { pendingMemento } = this;
                if (pendingMemento) {
                    this.restoreMemento(pendingMemento.version, pendingMemento.mementoVersion, pendingMemento.memento);
                } else {
                    this.restoreRequiredRange(requiredRangeRatio, requiredRangeDirection);
                }

                // Maybe fire 'zoom:change-request' if the zoom-state has changed in this redraw:
                this.updateZoom({
                    source: 'chart-update', // FIXME(AG-16412): this is "probably" what caused, but we don't really know
                    sourceDetail: 'unspecified',
                });
            }),
            updateService.addListener('update-complete', ({ wasShortcut }) => {
                if (wasShortcut) return;
                if (this.pendingZoomEventSource) {
                    const source = this.pendingZoomEventSource;
                    this.fireChartEvent<AgZoomEvent>({ type: 'zoom', source, ...this.getMementoRanges() });
                    this.pendingZoomEventSource = undefined;
                }
            })
        );
    }

    // FIXME: should be private
    public toCoreZoomState(axisZoom: DeepReadonly<ZoomState>): CoreZoomState {
        const result: CoreZoomState = {};
        let ids: AxisID[];
        const { state } = this;

        if (this.independentAxes) {
            const xId = this.getPrimaryAxisId(ChartAxisDirection.X);
            const yId = this.getPrimaryAxisId(ChartAxisDirection.Y);
            ids = [];
            if (xId) ids.push(xId);
            if (yId) ids.push(yId);
        } else {
            ids = strictObjectKeys(state);
        }

        for (const id of ids) {
            const { direction } = state[id] ?? {};
            if (direction != undefined) {
                const zoom = axisZoom[direction];
                if (zoom) {
                    const { min, max } = zoom;
                    result[id] = { min, max, direction };
                }
            }
        }

        return result;
    }

    // FIXME: should be private
    public toZoomState(coreZoom: DeepReadonly<CoreZoomStateSafeRetrieval>): ZoomState | undefined {
        let x: ZoomMinMax | undefined;
        let y: ZoomMinMax | undefined;

        // Use the zoom on the primary (first) axis in each direction
        for (const id of strictObjectKeys(coreZoom)) {
            const { min, max, direction } = coreZoom[id]!;
            if (direction === ChartAxisDirection.X) {
                x ??= { min, max };
            } else if (direction === ChartAxisDirection.Y) {
                y ??= { min, max };
            }
        }

        if (x || y) {
            return { x, y };
        }
    }

    public createMemento(): ZoomMemento {
        return this.getMementoRanges();
    }

    public guardMemento(blob: unknown, messages: string[]): blob is ZoomMemento | undefined {
        if (blob == null) return true;
        if (!isObject(blob)) return false;

        const primaryX = this.getPrimaryAxis(ChartAxisDirection.X);
        const primaryY = this.getPrimaryAxis(ChartAxisDirection.Y);

        // Already validated by the optionsModule validator
        const zoomMementoDefs: OptionsDefs<ZoomMemento> = {
            rangeX: { start: rangeValidator(primaryX), end: defined },
            rangeY: { start: rangeValidator(primaryY), end: defined },
            ratioX: { start: defined, end: defined },
            ratioY: { start: defined, end: defined },
            autoScaledAxes: defined,
        };

        const { invalid } = validate(blob, zoomMementoDefs);
        if (invalid.length > 0) {
            messages.push(...invalid.map(String));
            return false;
        }

        return true;
    }

    public restoreMemento(version: string, mementoVersion: string, memento: ZoomMemento | undefined) {
        if (!this.axes || !this.didLayoutAxes) {
            this.pendingMemento = { version, mementoVersion, memento };
            return;
        }
        this.pendingMemento = undefined;

        // Migration from older versions can be implemented here.

        const zoom = definedZoomState(this.getZoom());
        if (memento?.rangeX) {
            zoom.x = this.rangeToRatioDirection(ChartAxisDirection.X, memento.rangeX) ?? { min: 0, max: 1 };
        } else if (memento?.ratioX) {
            zoom.x = {
                min: memento.ratioX.start ?? 0,
                max: memento.ratioX.end ?? 1,
            };
        } else {
            zoom.x = { min: 0, max: 1 };
        }
        const { navigatorModule, zoomModule } = this;
        this.eventsHub.emit('zoom:load-memento', { zoom, memento, navigatorModule, zoomModule });

        const changes = this.toCoreZoomState(zoom);
        this.lastRestoredState = deepFreeze(deepClone(changes));
        this.updateChanges({
            source: 'state-change',
            sourceDetail: 'internal-restoreMemento',
            changes,
            isReset: false,
        });
    }

    private findAxis(axisId: AxisID): CartesianAxisLike | undefined {
        for (const a of this.axes) {
            if (a.id === axisId) return a;
        }
    }

    public getAxes() {
        return this.axes;
    }

    public setAxes(nextAxes: Parameters<typeof refreshCoreState>[0]) {
        const { axes } = this;
        axes.length = 0;
        for (const axis of nextAxes) {
            if ('range' in axis) {
                axes.push(axis);
            }
        }

        const oldState = this.state;
        const changes = refreshCoreState(nextAxes, oldState);
        this.state = changes;
        this.lastRestoredState = refreshCoreState(nextAxes, this.lastRestoredState);

        this.updateChanges({ source: 'chart-update', sourceDetail: 'internal-setAxes', changes, isReset: false });
    }

    public setIndependentAxes(independent = true) {
        this.independentAxes = independent;
    }

    public setNavigatorEnabled(enabled = true) {
        this.navigatorModule = enabled;
    }

    public setZoomModuleEnabled(enabled = true) {
        this.zoomModule = enabled;
    }

    public isNavigatorEnabled() {
        return this.navigatorModule;
    }

    public isZoomEnabled() {
        return this.zoomModule;
    }

    public updateZoom({ source, sourceDetail }: UpdateZoomSourcing, newZoom?: ZoomState): boolean {
        const changes = this.toCoreZoomState(newZoom ?? {});
        return this.updateChanges({ source, sourceDetail, changes, isReset: false });
    }

    private computeChangedAxesIds(newState: UpdateZoomChanges): readonly AxisID[] {
        const result: AxisID[] = [];
        const oldState = this.state;
        for (const id of strictObjectKeys(newState)) {
            const newAxisState = newState[id] ?? { min: 0, max: 1 };
            const oldAxisState = oldState[id];
            if (
                oldAxisState == undefined ||
                oldAxisState.min !== newAxisState.min ||
                oldAxisState.max !== newAxisState.max
            ) {
                result.push(id);
            }
        }
        return result;
    }

    public updateChanges(params: UpdateZoomParams): boolean {
        const { source, sourceDetail, isReset, changes } = params;
        validateChanges(changes);

        const changedAxes = this.computeChangedAxesIds(changes);
        const oldState: CoreZoomStateSafeRetrieval = deepClone(this.state);
        const newState: CoreZoomStateSafeRetrieval = deepClone(this.state);

        for (const id of changedAxes) {
            const axis = newState[id];
            if (axis != undefined) {
                axis.min = changes[id]?.min ?? 0;
                axis.max = changes[id]?.max ?? 1;
            }
        }
        this.state = newState;

        return this.dispatch(source, sourceDetail, changedAxes, isReset, oldState);
    }

    public resetZoom({ source, sourceDetail }: UpdateZoomSourcing) {
        this.updateChanges({ source, sourceDetail, changes: this.getRestoredZoom(), isReset: true });
    }

    public resetAxisZoom({ source, sourceDetail }: UpdateZoomSourcing, axisId: AxisID) {
        this.updateChanges({
            source,
            sourceDetail,
            changes: { [axisId]: this.getRestoredZoom()[axisId] },
            isReset: true,
        });
    }

    public panToBBox(seriesRect: BBox, target: BoxBounds): boolean {
        if (!this.isZoomEnabled() && !this.isNavigatorEnabled()) return false;

        const zoom = this.getZoom();
        if (zoom === undefined || (!zoom.x && !zoom.y)) return false;

        const panIsPossible =
            seriesRect.width > 0 &&
            seriesRect.height > 0 &&
            Math.abs(target.width) <= Math.abs(seriesRect.width) &&
            Math.abs(target.height) <= Math.abs(seriesRect.height);
        if (!panIsPossible) {
            Logger.warnOnce(`cannot pan to target BBox - chart too small?`);
            return false;
        }

        const newZoom: ZoomState = calcPanToBBoxRatios(seriesRect, zoom, target);
        const changes = this.toCoreZoomState(newZoom);
        return this.updateChanges({
            source: 'user-interaction',
            sourceDetail: 'internal-panToBBox',
            changes,
            isReset: false,
        });
    }

    // Fire this event to signal to listeners that the view is changing through a zoom and/or pan change.
    public fireZoomPanStartEvent(callerId: 'navigator' | 'zoom') {
        this.eventsHub.emit('zoom:pan-start', { callerId });
    }

    public updateWith(
        { source, sourceDetail }: UpdateZoomSourcing,
        direction: CartesianAxisDirection,
        fn: UpdateZoomWithFunction
    ) {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return;

        const extents = axis.scale.getDomainMinMax();
        if (!extents) return;

        const [min, max] = axis.visibleRange;
        const range = this.getRange(axis.id, { min, max });
        if (!range) return;

        const [domainStart, domainEnd] = extents;
        const { start: windowStart, end: windowEnd } = range;

        const [start, end] = fn(domainStart, domainEnd, windowStart as Date | number, windowEnd as Date | number);

        const ratio = this.rangeToRatioAxis(axis, { start, end });
        if (!ratio) return;

        this.updateChanges({ source, sourceDetail, changes: { [direction]: ratio }, isReset: false });
    }

    public isValidUpdateWith(direction: CartesianAxisDirection, fn: UpdateZoomWithFunction) {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return true;

        const extents = axis.scale.getDomainMinMax();
        if (!extents) return true;

        const [min, max] = axis.visibleRange;
        const range = this.getRange(axis.id, { min, max });
        if (!range) return true;

        const [domainStart, domainEnd] = extents;
        const { start: windowStart, end: windowEnd } = range;

        const [start, end] = fn(domainStart, domainEnd, windowStart as Date | number, windowEnd as Date | number);

        let valid = true;
        if (start != null) {
            valid &&= start >= domainStart;
        }
        if (end != null) {
            valid &&= end <= domainEnd;
        }

        return valid;
    }

    public getZoom(): ZoomState | undefined {
        return this.toZoomState(this.state);
    }

    public getAxisZoom(axisId: AxisID): ZoomMinMax {
        return this.state[axisId] ?? { min: 0, max: 1 };
    }

    public getAxisZooms(): CoreZoomStateSafeRetrieval {
        return this.state;
    }

    public getCoreZoom(): CoreZoomStateSafeRetrieval {
        return this.state;
    }

    public getRestoredZoom(): CoreZoomStateSafeRetrieval {
        return this.lastRestoredState;
    }

    public getPrimaryAxisId(direction: CartesianAxisDirection) {
        return this.getPrimaryAxis(direction)?.id;
    }

    private getBoundSeries() {
        const xAxis = this.getPrimaryAxis(ChartAxisDirection.X);
        const yAxis = this.getPrimaryAxis(ChartAxisDirection.Y);

        let boundSeries: Set<ISeries<any, any, any>>;

        if (this.independentAxes) {
            const xBoundSeries = new Set(xAxis?.boundSeries ?? []);
            const yBoundSeries = new Set(yAxis?.boundSeries ?? []);

            boundSeries = new Set();
            for (const series of xBoundSeries) {
                if (yBoundSeries.has(series)) {
                    boundSeries.add(series);
                }
            }
        } else {
            boundSeries = new Set([...(xAxis?.boundSeries ?? []), ...(yAxis?.boundSeries ?? [])]);
        }

        return boundSeries;
    }

    public constrainZoomToItemCount(
        zoom: DefinedZoomState,
        minVisibleItems: number,
        shouldAutoscale: boolean
    ): DefinedZoomState {
        let xVisibleRange: [number, number] = [zoom.x.min, zoom.x.max];
        let yVisibleRange: [number, number] | undefined = shouldAutoscale ? undefined : [zoom.y.min, zoom.y.max];
        for (const series of this.getBoundSeries()) {
            const nextZoom = series.getZoomRangeFittingItems(xVisibleRange, yVisibleRange, minVisibleItems);
            if (nextZoom == null) continue;

            xVisibleRange = nextZoom.x;
            yVisibleRange = nextZoom.y;
        }

        const x = { min: xVisibleRange[0], max: xVisibleRange[1] };
        const y = yVisibleRange ? { min: yVisibleRange[0], max: yVisibleRange[1] } : undefined;
        return definedZoomState({ x, y });
    }

    public isVisibleItemsCountAtLeast(
        zoom: DefinedZoomState,
        minVisibleItems: number,
        opts: { autoScaleYAxis: boolean; includeYVisibleRange: boolean }
    ): boolean {
        const boundSeries = this.getBoundSeries();

        // Note: `series.getVisibleItems` has much better performance when `autoScaling.enabled: true`, because it only
        // needs to consider the X axis to count the number of visible items.
        const xVisibleRange: [number, number] = [zoom.x.min, zoom.x.max];
        const yVisibleRange: [number, number] | undefined =
            !opts.includeYVisibleRange && opts.autoScaleYAxis ? undefined : [zoom.y.min, zoom.y.max];

        let visibleItemsCount = 0;

        for (const series of boundSeries) {
            const remainingItems = minVisibleItems - (visibleItemsCount ?? 0);
            const seriesVisibleItems = series.getVisibleItems(xVisibleRange, yVisibleRange, remainingItems);
            visibleItemsCount += seriesVisibleItems;
            if (visibleItemsCount >= minVisibleItems) return true;
        }

        return boundSeries.size === 0;
    }

    private getMementoRanges() {
        const zoom = definedZoomState(this.getZoom());
        const memento: RequireOptional<ZoomMemento> & {
            ratioX: Required<AgZoomRatio>;
            ratioY: Required<AgZoomRatio>;
        } = {
            rangeX: this.getRangeDirection(ChartAxisDirection.X, zoom.x),
            rangeY: this.getRangeDirection(ChartAxisDirection.Y, zoom.y),
            ratioX: { start: zoom.x.min, end: zoom.x.max },
            ratioY: { start: zoom.y.min, end: zoom.y.max },
            autoScaledAxes: undefined,
        };

        this.eventsHub.emit('zoom:save-memento', { memento });
        return memento;
    }

    private restoreRequiredRange(requiredRangeRatio: number, requiredRangeDirection: ChartAxisDirection) {
        const { lastRestoredRequiredRange, lastRestoredRequiredRangeDirection } = this;

        // Prevent infinite loops where an x-axis label with a different height becomes visible, causing a change in
        // the chart height. This triggers the nice algorithm to change the y-axis label widths which changes the
        // width of the chart. This width change then triggers this function again with a different zoom ratio
        // as a proportion of that new chart width. This changes the chart's zoom, making the taller x-axis
        // label hidden again, creating an infinite loop.
        // @see AG-16803
        this.restoreRequiredRangeIterations += 1;

        const directionInvalid =
            requiredRangeDirection !== ChartAxisDirection.X && requiredRangeDirection !== ChartAxisDirection.Y;
        const requiredRangeUnchanged =
            lastRestoredRequiredRangeDirection === requiredRangeDirection &&
            lastRestoredRequiredRange === requiredRangeRatio;
        const requiredRangeUnset =
            requiredRangeRatio === 0 && (lastRestoredRequiredRange == null || lastRestoredRequiredRange === 0);

        if (
            directionInvalid ||
            requiredRangeUnchanged ||
            requiredRangeUnset ||
            this.restoreRequiredRangeIterations > 1
        ) {
            this.restoreRequiredRangeIterations = 0;
            return;
        }

        const crossAxisId = this.getPrimaryAxisId(requiredRangeDirection);
        if (!crossAxisId) return;

        const crossAxisZoom = this.getAxisZoom(crossAxisId);
        const requiredZoom = Math.min(1, 1 / requiredRangeRatio);

        let min = 0;
        let max = 1;

        // For vertical bars, pin to the left and extend right until the right reaches max, then extend left.
        // For horizontal bars, pin to the top and extend down until the bottom reaches max, then extend up.
        if (requiredRangeDirection === ChartAxisDirection.X) {
            min = clamp(0, 1 - requiredZoom, crossAxisZoom.min);
            max = clamp(0, min + requiredZoom, 1);
        } else {
            max = Math.min(1, crossAxisZoom.max);
            min = max - requiredZoom;
            if (min < 0) {
                max -= min;
                min = 0;
            }
            min = clamp(0, min, 1);
            max = clamp(0, max, 1);
        }

        this.lastRestoredRequiredRange = requiredRangeRatio;
        this.lastRestoredRequiredRangeDirection = requiredRangeDirection;

        const zoom = { [requiredRangeDirection]: { min, max } };
        const changes = this.toCoreZoomState(zoom);
        this.lastRestoredState = deepFreeze(deepClone(changes));

        this.updateChanges({
            source: 'state-change',
            sourceDetail: 'internal-requiredWidth',
            changes,
            isReset: false,
        });
    }

    private constrainZoomToRequiredWidth(event: ZoomChangeRequestEvent) {
        if (this.lastRestoredRequiredRange == null || this.lastRestoredRequiredRangeDirection == null) return;

        const axis = this.lastRestoredRequiredRangeDirection;

        const crossAxisId = this.getPrimaryAxisId(this.lastRestoredRequiredRangeDirection);
        if (!crossAxisId) return;

        const zoom = event.stateAsDefinedZoom();
        const oldState = event.oldState[crossAxisId]!;

        const delta = zoom[axis].max - zoom[axis].min;
        const minDelta = 1 / this.lastRestoredRequiredRange;
        if (Math.abs(delta - minDelta) < 1e-12 || delta <= minDelta) return;

        event.constrainZoom({
            ...zoom,
            [axis]: { min: oldState.min, max: oldState.min + minDelta },
        });
    }

    private dispatch(
        source: AgZoomEventSource,
        sourceDetail: ZoomEventSourceDetail,
        changedAxes: readonly AxisID[],
        isReset: boolean,
        oldState: CoreZoomStateSafeRetrieval
    ): boolean {
        const { x, y } = this.getZoom() ?? {};
        const state = this.state;
        let constrainedState: typeof state | undefined;

        const debug = this.debug;
        const zoomManager = this;
        const event = {
            source,
            sourceDetail,
            isReset,
            changedAxes,
            state,
            oldState,
            x,
            y,
            stateAsDefinedZoom(): DefinedZoomState {
                return definedZoomState(zoomManager.toZoomState(event.state));
            },
            constrainZoom(restrictions: ZoomState): void {
                this.constrainChanges(zoomManager.toCoreZoomState(restrictions));
            },
            constrainChanges(restrictions: ZoomChangeState): void {
                if (debug.check()) {
                    debug('ZoomManager.constrainChanges()', state, '->', restrictions, new Error().stack);
                }
                constrainedState ??= deepClone(state);
                for (const id of strictObjectKeys(restrictions)) {
                    const src = restrictions[id];
                    const dst = constrainedState[id];
                    if (src && dst) {
                        dst.min = src.min;
                        dst.max = src.max;
                    }
                }
                event.state = constrainedState;
            },
        } satisfies ZoomChangeRequestEvent;

        this.eventsHub.emit('zoom:change-request', event);

        if (constrainedState && !areEqualCoreZooms(state, constrainedState)) {
            this.state = constrainedState;
        }

        const changeAccepted: boolean = !areEqualCoreZooms(oldState, this.state);
        if (changeAccepted) {
            const acceptedZoom = this.getZoom() ?? {};
            this.eventsHub.emit('zoom:change-complete', { source, sourceDetail, x: acceptedZoom.x });
            this.pendingZoomEventSource = source; // emit API AgZoomEvent when the redraw completes
        }
        return changeAccepted;
    }

    private getRange(axisId: AxisID, ratio: ZoomMinMax): AgZoomRange | undefined {
        return this.getRangeAxis(this.findAxis(axisId), ratio);
    }

    private getRangeDirection(direction: CartesianAxisDirection, ratio: ZoomMinMax): AgZoomRange | undefined {
        return this.getRangeAxis(this.getPrimaryAxis(direction), ratio);
    }

    private getRangeAxis(axis: CartesianAxisLike | undefined, ratio: ZoomMinMax): AgZoomRange | undefined {
        if (!axis) return;

        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        const [d0, d1] = extents;

        let start;
        let end;

        if (d0 <= d1) {
            start = axis.scale.invert(0, true); // 0 is the start of the visible axis
            end = axis.scale.invert(d0 + (d1 - d0) * ratio.max, true);
        } else {
            start = axis.scale.invert(d0 - (d0 - d1) * ratio.min, true);
            end = axis.scale.invert(0, true);
        }

        return { start, end };
    }

    public rangeToRatio(axisId: AxisID, range: AgZoomRange): ZoomMinMax | undefined {
        return this.rangeToRatioAxis(this.findAxis(axisId), range);
    }

    public rangeToRatioDirection(direction: CartesianAxisDirection, range: AgZoomRange): ZoomMinMax | undefined {
        return this.rangeToRatioAxis(this.getPrimaryAxis(direction), range);
    }

    private rangeToRatioAxis(axis: CartesianAxisLike | undefined, range: AgZoomRange): ZoomMinMax | undefined {
        if (!axis) return;

        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        const [d0, d1] = extents;

        const { scale } = axis;

        const { start, end } = range;

        const [startAlignment = ScaleAlignment.Leading, endAlignment = ScaleAlignment.Trailing] = rangeAlignment(
            start,
            end
        );
        let r0 = start == null ? d0 : scale.convert(start, { alignment: startAlignment, alignmentExclusive: true });
        let r1 =
            end == null
                ? d1
                : scale.convert(end, { alignment: endAlignment, alignmentExclusive: true }) + (scale.bandwidth ?? 0);

        if (!isFiniteNumber(r0) || !isFiniteNumber(r1)) return;

        const [dMin, dMax] = [Math.min(d0, d1), Math.max(d0, d1)];

        r0 = clamp(dMin, r0, dMax);
        r1 = clamp(dMin, r1, dMax);

        const diff = d1 - d0;
        if (diff === 0) return;

        const min = Math.abs((r0 - d0) / diff);
        const max = Math.abs((r1 - d0) / diff);
        if (min >= max) return;

        return { min, max };
    }

    public getPrimaryAxis(direction: CartesianAxisDirection) {
        return this.axes?.find((a) => a.direction === direction);
    }

    private getDomainPixelExtents(axis: CartesianAxisLike) {
        const [d0, d1] = axis.scale.range;

        if (!isFiniteNumber(d0) || !isFiniteNumber(d1)) return;

        return [d0, d1];
    }
}
