import { type _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { ArrowCapScene, type CapScene } from '../scenes/capScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import { DivariantHandle } from '../scenes/handle';
import { LineWithTextScene } from '../scenes/lineWithTextScene';
import { LinearScene } from '../scenes/linearScene';
import { validateDatumPoint } from '../utils/validation';
import { convertLine, invertCoords } from '../utils/values';
import type { LineTypeProperties } from './lineProperties';

const { Vec2 } = _Util;

export class LineScene extends LinearScene<LineTypeProperties> {
    static override is(value: unknown): value is LineScene {
        return AnnotationScene.isCheck(value, 'line');
    }

    type = 'line';

    override activeHandle?: 'start' | 'end';

    public readonly line = new CollidableLine();
    private readonly start = new DivariantHandle();
    private readonly end = new DivariantHandle();
    public text?: _Scene.TransformableText;
    private startCap?: CapScene;
    private endCap?: CapScene;

    constructor() {
        super();
        this.append([this.line, this.start, this.end]);
    }

    public update(datum: LineTypeProperties, context: AnnotationContext) {
        const locked = datum.locked ?? false;

        const coords = convertLine(datum, context);

        if (coords == null) {
            this.visible = false;
            return;
        }

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        this.updateLine(datum, coords, context);
        this.updateHandles(datum, coords, locked);
        this.updateText(datum, coords);
        this.updateCaps(datum, coords);
    }

    updateLine(datum: LineTypeProperties, coords: LineCoords, context: AnnotationContext) {
        const { line } = this;
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const linePoints = this.extendLine(coords, datum, context);

        line.setProperties({
            ...linePoints,
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
            lineCap: datum.getLineCap(),
        });
    }

    updateHandles(datum: LineTypeProperties, coords: LineCoords, locked: boolean) {
        const { start, end, startCap, endCap } = this;
        const { stroke, strokeWidth, strokeOpacity } = datum;
        let [startPoint, endPoint] = Vec2.from(coords);

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? strokeWidth,
        };

        // Offset the handles so they do not cover the caps
        const angle = Vec2.angle(Vec2.sub(endPoint, startPoint));
        if (startCap) {
            startPoint = Vec2.rotate(Vec2.from(0, -DivariantHandle.HANDLE_SIZE / 2), angle, startPoint);
        }
        if (endCap) {
            endPoint = Vec2.rotate(Vec2.from(0, DivariantHandle.HANDLE_SIZE / 2), angle, endPoint);
        }

        start.update({ ...handleStyles, ...startPoint });
        end.update({ ...handleStyles, ...endPoint });

        start.toggleLocked(locked);
        end.toggleLocked(locked);
    }

    private readonly updateText = LineWithTextScene.updateLineText.bind(this);

    updateCaps(datum: LineTypeProperties, coords: LineCoords) {
        if (!datum.startCap && this.startCap) {
            this.removeChild(this.startCap);
            this.startCap = undefined;
        }

        if (!datum.endCap && this.endCap) {
            this.removeChild(this.endCap);
            this.endCap = undefined;
        }

        if (!datum.startCap && !datum.endCap) return;

        const { stroke, strokeWidth, strokeOpacity } = datum;
        const [start, end] = Vec2.from(coords);
        const angle = Vec2.angle(Vec2.sub(end, start));

        if (datum.startCap) {
            if (this.startCap && this.startCap.type !== datum.startCap) {
                this.removeChild(this.startCap);
                this.startCap = undefined;
            }

            if (this.startCap == null) {
                this.startCap = new ArrowCapScene();
                this.append([this.startCap]);
            }

            this.startCap!.update({
                x: start.x,
                y: start.y,
                angle: angle - Math.PI,
                stroke,
                strokeWidth,
                strokeOpacity,
            });
        }

        if (datum.endCap) {
            if (this.endCap && this.endCap.type !== datum.endCap) {
                this.removeChild(this.endCap);
                this.endCap = undefined;
            }

            if (this.endCap == null && datum.endCap) {
                this.endCap = new ArrowCapScene();
                this.append([this.endCap]);
            }

            this.endCap!.update({
                x: end.x,
                y: end.y,
                angle,
                stroke,
                strokeWidth,
                strokeOpacity,
            });
        }
    }

    override toggleHandles(show: boolean | Partial<Record<'start' | 'end', boolean>>) {
        if (typeof show === 'boolean') {
            show = { start: show, end: show };
        }

        this.start.visible = show.start ?? true;
        this.end.visible = show.end ?? true;

        this.start.toggleHovered(this.activeHandle === 'start');
        this.end.toggleHovered(this.activeHandle === 'end');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.start.toggleActive(active);
        this.end.toggleActive(active);
    }

    override dragHandle(datum: LineTypeProperties, target: Coords, context: AnnotationContext) {
        const { activeHandle } = this;

        if (!activeHandle) return;

        this[activeHandle].toggleDragging(true);
        const point = invertCoords(this[activeHandle].drag(target).point, context);

        if (!validateDatumPoint(context, point)) return;

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
    }

    override stopDragging() {
        this.start.toggleDragging(false);
        this.end.toggleDragging(false);
    }

    override getAnchor() {
        const bbox = this.computeBBoxWithoutHandles();
        return { x: bbox.x + bbox.width / 2, y: bbox.y };
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
    }

    override containsPoint(x: number, y: number) {
        const { start, end, line, text } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        if (end.containsPoint(x, y)) {
            this.activeHandle = 'end';
            return true;
        }

        return line.isPointInPath(x, y) || Boolean(text?.containsPoint(x, y));
    }
}
