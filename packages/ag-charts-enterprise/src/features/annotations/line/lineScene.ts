import { _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { convertLine, invertCoords, validateDatumPoint } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { ArrowCapScene, type CapScene } from '../scenes/capScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import { DivariantHandle } from '../scenes/handle';
import { LinearScene } from '../scenes/linearScene';
import type { LineTypeProperties } from './lineProperties';

const { Vec2 } = _Util;

export class LineScene extends LinearScene<LineTypeProperties> {
    static override is(value: unknown): value is LineScene {
        return AnnotationScene.isCheck(value, 'line');
    }

    type = 'line';

    override activeHandle?: 'start' | 'end';

    private readonly line = new CollidableLine();
    private readonly lineClipGroup = new _Scene.Group({ name: 'LineSceneClipGroup' });
    private readonly start = new DivariantHandle();
    private readonly end = new DivariantHandle();
    private text?: _Scene.TransformableText;
    private startCap?: CapScene;
    private endCap?: CapScene;

    constructor() {
        super();
        this.lineClipGroup.append(this.line);
        this.append([this.lineClipGroup, this.start, this.end]);
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

        this.updateLine(datum, coords);
        this.updateHandles(datum, coords, locked);
        this.updateText(datum, coords);
        this.updateCaps(datum, coords);
    }

    updateLine(datum: LineTypeProperties, coords: LineCoords) {
        const { line } = this;
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity, lineCap } = datum;
        const { x1, y1, x2, y2 } = coords;

        line.setProperties({
            x1,
            y1,
            x2,
            y2,
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
            lineCap,
        });
        line.updateCollisionBBox();
    }

    updateHandles(datum: LineTypeProperties, coords: LineCoords, locked: boolean) {
        const { start, end } = this;
        const { stroke, strokeWidth, strokeOpacity } = datum;
        const { x1, y1, x2, y2 } = coords;

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? strokeWidth,
        };

        start.update({ ...handleStyles, x: x1, y: y1 });
        end.update({ ...handleStyles, x: x2, y: y2 });

        start.toggleLocked(locked);
        end.toggleLocked(locked);
    }

    updateText(datum: LineTypeProperties, coords: LineCoords) {
        if (!datum.text && this.text) {
            this.removeChild(this.text);
        }

        if (!datum.text) return;

        if (this.text == null) {
            this.text = new _Scene.TransformableText();
            this.appendChild(this.text);
        }

        let [left, right] = Vec2.from(coords);
        if (left.x > right.x) [left, right] = [right, left];
        const normal = Vec2.normalized(Vec2.sub(right, left));
        const angle = Vec2.angle(normal);

        const { alignment, position } = datum.text;

        const inset = Vec2.multiply(normal, (datum.strokeWidth ?? 2) + 13);
        const offset = Vec2.multiply(normal, (datum.strokeWidth ?? 2) + 3);

        let point = left;
        if (alignment === 'left' && position === 'center') {
            point = Vec2.add(left, inset);
        } else if (alignment === 'right' && position === 'center') {
            point = Vec2.sub(right, inset);
        } else if (alignment === 'right') {
            point = right;
        } else if (alignment === 'center') {
            point = Vec2.add(left, Vec2.multiply(normal, Vec2.distance(left, right) / 2));
        }

        let textBaseline: CanvasTextBaseline = 'middle';
        if (position === 'top') {
            point = Vec2.rotate(offset, angle - Math.PI / 2, point);
            textBaseline = 'bottom';
        } else if (position === 'bottom') {
            point = Vec2.rotate(offset, angle + Math.PI / 2, point);
            textBaseline = 'top';
        }

        this.text.setProperties({
            text: datum.text.label,

            x: point.x,
            y: point.y,
            rotation: angle,
            rotationCenterX: point.x,
            rotationCenterY: point.y,

            fill: datum.text.color,
            fontFamily: datum.text.fontFamily,
            fontSize: datum.text.fontSize,
            fontStyle: datum.text.fontStyle,
            fontWeight: datum.text.fontWeight,
            textAlign: datum.text.alignment,
            textBaseline: textBaseline,
        });

        if (position === 'center') {
            const { x, y, width, height } = this.text.getBBox();
            const diameter = Vec2.length(Vec2.from(width, height));
            this.lineClipGroup.setClipMask(
                {
                    x: x + width / 2,
                    y: y + height / 2,
                    radius: diameter / 2 + Vec2.length(offset),
                },
                'outside'
            );
        }
    }

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
        const { start, end, line } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        if (end.containsPoint(x, y)) {
            this.activeHandle = 'end';
            return true;
        }

        return line.isPointInPath(x, y);
    }
}
