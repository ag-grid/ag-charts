import { _Scene, _Util } from 'ag-charts-community';

import type { ChannelTextProperties, PointProperties } from '../annotationProperties';
import type { AnnotationContext, LineCoords } from '../annotationTypes';
import { convertLine } from '../annotationUtils';
import { CollidableLine } from './collidableLineScene';
import type { Handle } from './handle';
import { LinearScene } from './linearScene';

const { Vec2 } = _Util;

export abstract class ChannelScene<
    Datum extends {
        background: { fill?: string; fillOpacity?: number };
        locked?: boolean;
        visible?: boolean;
        start: Pick<PointProperties, 'x' | 'y'>;
        end: Pick<PointProperties, 'x' | 'y'>;
        bottom: { start: Pick<PointProperties, 'x' | 'y'>; end: Pick<PointProperties, 'x' | 'y'> };
        strokeWidth?: number;
        text?: ChannelTextProperties;
    },
> extends LinearScene<Datum> {
    protected handles: { [key: string]: Handle } = {};

    protected topLine = new CollidableLine();
    protected bottomLine = new CollidableLine();
    protected background = new _Scene.Path({ zIndex: -1 });
    protected text?: _Scene.TransformableText;

    protected abstract offsetInsideTextLabel: boolean;

    public update(datum: Datum, context: AnnotationContext) {
        const { locked, visible } = datum;

        const top = convertLine(datum, context);
        const bottom = convertLine(datum.bottom, context);

        if (top == null || bottom == null) {
            this.visible = false;
            return;
        } else {
            this.visible = visible ?? true;
        }

        this.updateLines(datum, top, bottom);
        this.updateHandles(datum, top, bottom);
        this.updateText(datum, top, bottom);
        this.updateBackground(datum, top, bottom);

        for (const handle of Object.values(this.handles)) {
            handle.toggleLocked(locked ?? false);
        }
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        for (const node of Object.values(this.handles)) {
            node.toggleActive(active);
        }
    }

    override stopDragging() {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        handles[activeHandle].toggleDragging(false);
    }

    override getAnchor() {
        const bbox = this.computeBBoxWithoutHandles();
        return { x: bbox.x + bbox.width / 2, y: bbox.y };
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return this.handles[this.activeHandle].getCursor();
    }

    override containsPoint(x: number, y: number) {
        const { handles, topLine, bottomLine } = this;

        this.activeHandle = undefined;

        for (const [handle, child] of Object.entries(handles)) {
            if (child.containsPoint(x, y)) {
                this.activeHandle = handle;
                return true;
            }
        }

        return topLine.containsPoint(x, y) || bottomLine.containsPoint(x, y);
    }

    protected abstract updateLines(datum: Datum, top: LineCoords, bottom: LineCoords): void;

    protected abstract updateHandles(datum: Datum, top: LineCoords, bottom: LineCoords): void;

    protected updateText(datum: Datum, top: LineCoords, bottom: LineCoords) {
        if (!datum.text && this.text) {
            this.removeChild(this.text);
        }

        if (!datum.text) return;

        if (this.text == null) {
            this.text = new _Scene.TransformableText();
            this.appendChild(this.text);
        }

        const { alignment, position } = datum.text;

        let relativeLine = top;
        if (position === 'bottom') {
            relativeLine = bottom;
        } else if (position === 'inside') {
            relativeLine = {
                x1: (top.x1 + bottom.x1) / 2,
                y1: (top.y1 + bottom.y1) / 2,
                x2: (top.x2 + bottom.x2) / 2,
                y2: (top.y2 + bottom.y2) / 2,
            };
        }

        let [left, right] = Vec2.from(relativeLine);
        if (left.x > right.x) [left, right] = [right, left];
        const normal = Vec2.normalized(Vec2.sub(right, left));
        const angle = Vec2.angle(normal);

        const inset = Vec2.multiply(normal, (datum.strokeWidth ?? 2) + 13);
        const offset = Vec2.multiply(normal, (datum.strokeWidth ?? 2) + 3);

        let point = left;
        if (alignment === 'left' && position === 'inside') {
            point = Vec2.add(left, inset);
        } else if (alignment === 'right' && position === 'inside') {
            point = Vec2.sub(right, inset);
        } else if (alignment === 'right') {
            point = right;
        } else if (alignment === 'center') {
            point = Vec2.add(left, Vec2.multiply(normal, Vec2.distance(left, right) / 2));
        }

        let textBaseline: CanvasTextBaseline = 'middle';
        if (position === 'top' || this.offsetInsideTextLabel) {
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
            rotation: Vec2.angle(normal),
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
    }

    protected updateBackground(datum: Datum, top: LineCoords, bottom: LineCoords) {
        const { background } = this;

        background.path.clear(true);
        background.path.moveTo(top.x1, top.y1);
        background.path.lineTo(top.x2, top.y2);
        background.path.lineTo(bottom.x2, bottom.y2);
        background.path.lineTo(bottom.x1, bottom.y1);
        background.path.closePath();
        background.checkPathDirty();
        background.setProperties({
            fill: datum.background.fill,
            fillOpacity: datum.background.fillOpacity,
        });
    }
}
