import type { Bounds4, BoxBounds, Point } from 'ag-charts-core';
import { Vec2, Vec4, entries } from 'ag-charts-core';

import type { AnnotationContext, DataPoint } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { FibonacciScene } from '../scenes/fibonacciScene';
import { DivariantHandle } from '../scenes/handle';
import type { StartEndHandle } from '../scenes/startEndScene';
import { SNAP_TO_ANGLE, getDragStartState, snapToAngle, translate } from '../utils/coords';
import { validateDatumPoint } from '../utils/validation';
import { convertLine, convertPoint, invertCoords } from '../utils/values';
import type { FibonacciRetracementDatum } from './fibonacciRetracementDatum';

export class FibonacciRetracementScene extends FibonacciScene<FibonacciRetracementDatum> {
    static override is(value: unknown): value is FibonacciRetracementScene {
        return AnnotationScene.isCheck(value, 'fibonacci-retracement');
    }

    type = 'fibonacci-retracement';

    override activeHandle?: StartEndHandle;

    protected readonly start = new DivariantHandle();
    protected readonly end = new DivariantHandle();

    protected readonly ignoreYBounds?: boolean;

    protected dragState?: {
        offset: Point;
        start: Point;
        end: Point;
    };

    constructor() {
        super();
        this.append([this.start, this.end]);
    }

    override containsPoint(x: number, y: number) {
        const { start, end } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        if (end.containsPoint(x, y)) {
            this.activeHandle = 'end';
            return true;
        }

        return super.containsPoint(x, y);
    }

    public override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.start.containsPoint(x, y) || this.end.containsPoint(x, y)) return 'handle';
        return super.getNodeAtCoords(x, y);
    }

    public dragStart(datum: FibonacciRetracementDatum, target: Point, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            ...getDragStartState({ start: datum.start, end: datum.end }, context),
        };
    }

    override stopDragging() {
        this.start.toggleDragging(false);
        this.end.toggleDragging(false);
    }

    protected dragAll(datum: FibonacciRetracementDatum, target: Point, context: AnnotationContext) {
        const { dragState } = this;

        if (!dragState) return;

        this.translatePoints({
            datum,
            start: dragState.start,
            end: dragState.end,
            translation: Vec2.sub(target, dragState.offset),
            context,
        });
    }

    dragHandle(datum: FibonacciRetracementDatum, target: Point, context: AnnotationContext, snapping: boolean) {
        const { activeHandle, dragState } = this;

        if (activeHandle == null || !dragState) return;

        this[activeHandle].toggleDragging(true);
        const point = snapping
            ? this.snapToAngle(datum, target, context)
            : invertCoords(this[activeHandle].drag(target).point, context);

        if (!point || !validateDatumPoint(context, point)) return;

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
    }

    snapToAngle(datum: FibonacciRetracementDatum, coords: Point, context: AnnotationContext): DataPoint | undefined {
        const { activeHandle } = this;

        const handles: StartEndHandle[] = ['start', 'end'];
        const fixedHandle = handles.find((handle) => handle !== activeHandle);

        if (activeHandle == null || fixedHandle == null) return;

        this[activeHandle].toggleDragging(true);

        const fixed = convertPoint(datum[fixedHandle], context);

        return invertCoords(snapToAngle(coords, fixed, SNAP_TO_ANGLE), context);
    }

    public translatePoints({
        datum,
        start,
        end,
        translation,
        context,
    }: {
        datum: FibonacciRetracementDatum;
        start: Point;
        end: Point;
        translation: Point;
        context: AnnotationContext;
    }) {
        const points = translate({ start, end }, translation, context, { overflowContinuous: 1 });

        datum.start.x = points.start.x;
        datum.end.x = points.end.x;

        datum.start.y = points.start.y;
        datum.end.y = points.end.y;
    }

    public translate(datum: FibonacciRetracementDatum, translation: Point, context: AnnotationContext) {
        this.translatePoints({
            datum,
            start: convertPoint(datum.start, context),
            end: convertPoint(datum.end, context),
            translation,
            context,
        });
    }

    public copy<D extends FibonacciRetracementDatum>(
        datum: D,
        copiedDatum: D,
        context: AnnotationContext
    ): D | undefined {
        const coords = convertLine(datum, context);

        if (!coords) {
            return;
        }

        const bbox = this.computeBBoxWithoutHandles();

        this.translatePoints({
            datum: copiedDatum,
            start: { x: coords.x1, y: coords.y1 },
            end: { x: coords.x2, y: coords.y2 },
            translation: { x: -bbox.width / 2, y: -bbox.height / 2 },
            context,
        });

        return copiedDatum;
    }

    override toggleHandles(show: boolean | Partial<Record<StartEndHandle, boolean>>) {
        if (typeof show === 'boolean') {
            this.start.visible = show;
            this.end.visible = show;
        } else {
            for (const [handle, visible] of entries(show)) {
                this[handle].visible = visible!;
            }
        }

        this.start.toggleHovered(this.activeHandle === 'start');
        this.end.toggleHovered(this.activeHandle === 'end');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.start.toggleActive(active);
        this.end.toggleActive(active);
    }

    protected updateHandles(datum: FibonacciRetracementDatum, coords: Bounds4, _coords2: Bounds4, bbox?: BoxBounds) {
        this.start.update({
            ...this.getHandleStyles(datum),
            ...this.getHandleCoords(datum, coords, 'start'),
        });
        this.end.update({
            ...this.getHandleStyles(datum),
            ...this.getHandleCoords(datum, coords, 'end', bbox),
        });

        this.start.toggleLocked(datum.locked ?? false);
        this.end.toggleLocked(datum.locked ?? false);
    }

    protected getHandleCoords(
        _datum: FibonacciRetracementDatum,
        coords: Bounds4,
        handle: StartEndHandle,
        _bbox?: BoxBounds
    ): Point {
        return handle === 'start' ? Vec4.start(coords) : Vec4.end(coords);
    }
}
