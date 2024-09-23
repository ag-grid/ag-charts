import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { ChannelTextProperties, PointProperties } from '../annotationProperties';
import type { AnnotationContext, LineCoords } from '../annotationTypes';
import { convertLine } from '../utils/values';
import { CollidableLine } from './collidableLineScene';
import type { CollidableText } from './collidableTextScene';
import type { Handle } from './handle';
import { LinearScene } from './linearScene';

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
    public text?: CollidableText;
    private readonly anchor: _ModuleSupport.ToolbarAnchor = { x: 0, y: 0 };

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

        const topLine = this.extendLine(top, datum, context);
        const bottomLine = this.extendLine(bottom, datum, context);

        this.updateLines(datum, topLine, bottomLine, context, top, bottom);
        this.updateHandles(datum, top, bottom);
        this.updateText(datum, top, bottom);
        this.updateBackground(datum, topLine, bottomLine, context);
        this.updateAnchor(top, bottom);

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
        return this.anchor;
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return this.handles[this.activeHandle].getCursor();
    }

    override containsPoint(x: number, y: number) {
        const { handles, topLine, bottomLine, text } = this;

        this.activeHandle = undefined;

        for (const [handle, child] of Object.entries(handles)) {
            if (child.containsPoint(x, y)) {
                this.activeHandle = handle;
                return true;
            }
        }

        return topLine.containsPoint(x, y) || bottomLine.containsPoint(x, y) || Boolean(text?.containsPoint(x, y));
    }

    protected abstract updateLines(
        datum: Datum,
        top: LineCoords,
        bottom: LineCoords,
        context: AnnotationContext,
        naturalTop: LineCoords,
        naturalBottom: LineCoords
    ): void;

    protected abstract updateHandles(datum: Datum, top: LineCoords, bottom: LineCoords): void;

    protected abstract updateText(datum: Datum, top: LineCoords, bottom: LineCoords): void;

    protected updateBackground(datum: Datum, top: LineCoords, bottom: LineCoords, context: AnnotationContext) {
        const { background } = this;
        const { seriesRect } = context;

        background.path.clear(true);

        const bounds = {
            x1: 0,
            y1: 0,
            x2: seriesRect.width,
            y2: seriesRect.height,
        };

        const points = this.getBackgroundPoints(datum, top, bottom, bounds);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (i === 0) {
                background.path.moveTo(point.x, point.y);
            } else {
                background.path.lineTo(point.x, point.y);
            }
        }

        background.path.closePath();
        background.checkPathDirty();
        background.setProperties({
            fill: datum.background.fill,
            fillOpacity: datum.background.fillOpacity,
        });
    }

    protected updateAnchor(top: LineCoords, bottom: LineCoords) {
        const { x, y } = _Scene.Transformable.toCanvasPoint(
            this.topLine,
            (top.x1 + top.x2) / 2,
            Math.min(top.y1, top.y2, bottom.y1, bottom.y2)
        );

        this.anchor.x = x;
        this.anchor.y = y;
    }

    protected abstract getBackgroundPoints(
        datum: Datum,
        top: LineCoords,
        bottom: LineCoords,
        bounds: LineCoords
    ): Array<_Util.Vec2>;
}
