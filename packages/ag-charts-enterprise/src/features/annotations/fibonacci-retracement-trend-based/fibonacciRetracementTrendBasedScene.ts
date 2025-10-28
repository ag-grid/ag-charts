import type { Bounds4, BoxBounds, Point } from 'ag-charts-core';
import { Vec2, Vec4, entries } from 'ag-charts-core';

import type { PointProperties } from '../annotationProperties';
import type { AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import { FibonacciScene } from '../scenes/fibonacciScene';
import { DivariantHandle } from '../scenes/handle';
import type { StartEndHandle } from '../scenes/startEndScene';
import { getDragStartState, snapToAngle, translate } from '../utils/coords';
import { createFibonacciRangesData, getFibonacciCoords } from '../utils/fibonacci';
import { validateDatumPoint } from '../utils/validation';
import { convertLine, convertPoint, invertCoords } from '../utils/values';
import type { FibonacciRetracementTrendBasedProperties } from './fibonacciRetracementTrendBasedProperties';

type ActiveHandle = StartEndHandle | 'endRetracement';

export class FibonacciRetracementTrendBasedScene extends FibonacciScene<FibonacciRetracementTrendBasedProperties> {
    static override is(value: unknown): value is FibonacciRetracementTrendBasedScene {
        return AnnotationScene.isCheck(value, 'fibonacci-retracement-trend-based');
    }

    type = 'fibonacci-retracement-trend-based';

    override activeHandle?: ActiveHandle;

    private readonly endRetracementLine = new CollidableLine();
    protected readonly start = new DivariantHandle();
    protected readonly end = new DivariantHandle();
    protected readonly endRetracement = new DivariantHandle();

    protected readonly ignoreYBounds?: boolean;

    protected dragState?: {
        offset: Point;
        start: Point;
        end: Point;
        endRetracement: Point;
    };

    constructor() {
        super();
        this.append([this.endRetracementLine, this.start, this.end, this.endRetracement]);
    }

    public override update(datum: FibonacciRetracementTrendBasedProperties, context: AnnotationContext) {
        let { coords1, coords2 } = this.getCoords(datum, context);

        if (coords1 == null || coords2 == null) {
            this.visible = false;
            return;
        }

        coords1 = Vec4.round(coords1);
        coords2 = Vec4.round(coords2);

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        if (datum.endRetracement.x == undefined || datum.endRetracement.y == undefined) {
            coords2 = undefined;
        }

        this.updateLine(datum, coords1, this.trendLine);
        this.updateLine(datum, coords2, this.endRetracementLine);

        this.updateHandles(datum, coords1, coords2);
        this.updateAnchor(datum, coords2 ?? coords1, context);

        const { reverse, bands } = datum;

        const coords = getFibonacciCoords(coords1, coords2);
        const extendedCoords = this.extendLine(coords, datum, context);

        const yZero = extendedCoords.y2;
        const yOne = extendedCoords.y1;

        const data = coords2 ? createFibonacciRangesData(extendedCoords, context, reverse, yZero, bands) : [];
        this.updateRanges(datum, data, context);

        const oneLinePoints = { ...extendedCoords, y1: yOne, y2: yOne };
        this.updateText(datum, oneLinePoints);
    }

    override containsPoint(x: number, y: number) {
        const { start, end, endRetracement, endRetracementLine } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        if (end.containsPoint(x, y)) {
            this.activeHandle = 'end';
            return true;
        }

        if (endRetracement.containsPoint(x, y)) {
            this.activeHandle = 'endRetracement';
            return true;
        }

        return endRetracementLine.isPointInPath(x, y) || super.containsPoint(x, y);
    }

    public override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.start.containsPoint(x, y) || this.end.containsPoint(x, y) || this.endRetracement.containsPoint(x, y))
            return 'handle';

        if (this.endRetracementLine.isPointInPath(x, y)) return 'line';

        return super.getNodeAtCoords(x, y);
    }

    public dragStart(datum: FibonacciRetracementTrendBasedProperties, target: Point, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            ...getDragStartState({ start: datum.start, end: datum.end, endRetracement: datum.endRetracement }, context),
        };
    }

    override stopDragging() {
        this.start.toggleDragging(false);
        this.end.toggleDragging(false);
        this.endRetracement.toggleDragging(false);
    }

    protected dragAll(datum: FibonacciRetracementTrendBasedProperties, target: Point, context: AnnotationContext) {
        const { dragState } = this;

        if (!dragState) return;

        this.translatePoints({
            datum,
            start: dragState.start,
            end: dragState.end,
            endRetracement: dragState.endRetracement,
            translation: Vec2.sub(target, dragState.offset),
            context,
        });
    }

    dragHandle(
        datum: FibonacciRetracementTrendBasedProperties,
        target: Point,
        context: AnnotationContext,
        snapping: boolean
    ) {
        const { activeHandle, dragState } = this;

        if (!activeHandle || !dragState) return;

        this[activeHandle].toggleDragging(true);
        const point = snapping
            ? this.snapToAngle(datum, target, context)
            : invertCoords(this[activeHandle].drag(target).point, context);

        if (!point || !validateDatumPoint(context, point)) return;

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
    }

    snapToAngle(
        datum: FibonacciRetracementTrendBasedProperties,
        coords: Point,
        context: AnnotationContext
    ): Pick<PointProperties, 'x' | 'y'> | undefined {
        const { activeHandle } = this;

        const handles: ActiveHandle[] = ['start', 'end', 'endRetracement'];
        if (!activeHandle) return;

        const index = (handles.indexOf(activeHandle) + 1) % handles.length;
        const fixedHandle = handles[index];

        this[activeHandle].toggleDragging(true);

        const fixed = convertPoint(datum[fixedHandle], context);

        return invertCoords(snapToAngle(coords, fixed, datum.snapToAngle), context);
    }

    public translatePoints({
        datum,
        start,
        end,
        endRetracement,
        translation,
        context,
    }: {
        datum: FibonacciRetracementTrendBasedProperties;
        start: Point;
        end: Point;
        endRetracement: Point;
        translation: Point;
        context: AnnotationContext;
    }) {
        const points = translate({ start, end, endRetracement }, translation, context, { overflowContinuous: 2 });

        datum.start.x = points.start.x;
        datum.end.x = points.end.x;
        datum.endRetracement.x = points.endRetracement.x;

        datum.start.y = points.start.y;
        datum.end.y = points.end.y;
        datum.endRetracement.y = points.endRetracement.y;
    }

    public translate(datum: FibonacciRetracementTrendBasedProperties, translation: Point, context: AnnotationContext) {
        this.translatePoints({
            datum,
            start: convertPoint(datum.start, context),
            end: convertPoint(datum.end, context),
            endRetracement: convertPoint(datum.endRetracement, context),
            translation,
            context,
        });
    }

    public copy(
        datum: FibonacciRetracementTrendBasedProperties,
        copiedDatum: FibonacciRetracementTrendBasedProperties,
        context: AnnotationContext
    ) {
        const { coords1, coords2 } = this.getCoords(datum, context);
        if (!coords1 || !coords2) {
            return;
        }

        const bbox = this.computeBBoxWithoutHandles();

        this.translatePoints({
            datum: copiedDatum,
            start: Vec4.start(coords1),
            end: Vec4.end(coords1),
            endRetracement: Vec4.end(coords2),
            translation: { x: -bbox.width / 2, y: -bbox.height / 2 },
            context,
        });

        return copiedDatum;
    }

    private getCoords(datum: FibonacciRetracementTrendBasedProperties, context: AnnotationContext) {
        return {
            coords1: convertLine(datum, context),
            coords2: convertLine({ start: datum.end, end: datum.endRetracement }, context),
        };
    }

    override toggleHandles(show: boolean | Partial<Record<ActiveHandle, boolean>>) {
        if (typeof show === 'boolean') {
            this.start.visible = show;
            this.end.visible = show;
            this.endRetracement.visible = show;
        } else {
            for (const [handle, visible] of entries(show)) {
                this[handle].visible = visible!;
            }
        }

        this.start.toggleHovered(this.activeHandle === 'start');
        this.end.toggleHovered(this.activeHandle === 'end');
        this.endRetracement.toggleHovered(this.activeHandle === 'endRetracement');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.start.toggleActive(active);
        this.end.toggleActive(active);
        this.endRetracement.toggleActive(active);
    }

    protected updateHandles(
        datum: FibonacciRetracementTrendBasedProperties,
        coords1: Bounds4,
        coords2?: Bounds4,
        bbox?: BoxBounds
    ) {
        this.start.update({
            ...this.getHandleStyles(datum),
            ...this.getHandleCoords(datum, coords1, 'start'),
        });
        this.end.update({
            ...this.getHandleStyles(datum),
            ...this.getHandleCoords(datum, coords1, 'end', bbox),
        });

        if (coords2) {
            this.endRetracement.update({
                ...this.getHandleStyles(datum),
                ...this.getHandleCoords(datum, coords2, 'endRetracement', bbox),
            });
        }

        this.start.toggleLocked(datum.locked ?? false);
        this.end.toggleLocked(datum.locked ?? false);
        this.endRetracement.toggleLocked(datum.locked ?? false);
    }

    protected getHandleCoords(
        _datum: FibonacciRetracementTrendBasedProperties,
        coords: Bounds4,
        handle: ActiveHandle,
        _bbox?: BoxBounds
    ): Point {
        return handle === 'start' ? Vec4.start(coords) : Vec4.end(coords);
    }
}
