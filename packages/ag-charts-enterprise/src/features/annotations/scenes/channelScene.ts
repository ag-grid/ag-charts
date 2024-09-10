import { _Scene, _Util } from 'ag-charts-community';

import type { ChannelTextProperties, PointProperties } from '../annotationProperties';
import type { AnnotationContext, LineCoords } from '../annotationTypes';
import { convertLine } from '../utils/values';
import { CollidableLine } from './collidableLineScene';
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
    public text?: _Scene.TransformableText;

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

        this.updateLines(datum, topLine, bottomLine);
        this.updateHandles(datum, top, bottom);
        this.updateText(datum, top, bottom);
        this.updateBackground(datum, topLine, bottomLine);

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

    protected abstract updateLines(datum: Datum, top: LineCoords, bottom: LineCoords): void;

    protected abstract updateHandles(datum: Datum, top: LineCoords, bottom: LineCoords): void;

    protected abstract updateText(datum: Datum, top: LineCoords, bottom: LineCoords): void;

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
