import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { ChannelTextProperties } from '../annotationProperties';
import type { AnnotationContext, Coords, LineCoords, Point } from '../annotationTypes';
import { snapToAngle } from '../utils/coords';
import { convertLine, invertCoords } from '../utils/values';
import { CollidableLine } from './collidableLineScene';
import type { CollidableText } from './collidableTextScene';
import type { Handle } from './handle';
import { LinearScene } from './linearScene';
import { WithBackgroundScene } from './withBackgroundScene';

type ChannelHandle = Partial<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'topMiddle' | 'bottomMiddle'>;

export abstract class ChannelScene<
    Datum extends {
        background: { fill?: string; fillOpacity?: number };
        locked?: boolean;
        visible?: boolean;
        start: Point;
        end: Point;
        bottom: { start: Point; end: Point };
        strokeWidth?: number;
        text?: ChannelTextProperties;
    },
> extends LinearScene<Datum> {
    protected handles: { [key: string]: Handle } = {};

    protected topLine = new CollidableLine();
    protected bottomLine = new CollidableLine();
    public background = new _Scene.Path({ zIndex: -1 });
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

    snapToAngle(
        target: Coords,
        context: AnnotationContext,
        handle: ChannelHandle,
        originHandle: ChannelHandle,
        angle: number,
        direction?: number
    ): Point | undefined {
        const { handles } = this;

        const fixed = handles[originHandle].handle;
        const active = handles[handle].drag(target).point;

        return invertCoords(snapToAngle(active, fixed, angle, direction), context);
    }

    override toggleHandles(show: boolean | Partial<Record<ChannelHandle, boolean>>) {
        const { handles } = this;

        if (typeof show === 'boolean') {
            for (const [handle, node] of Object.entries(handles)) {
                node.visible = show;
                node.toggleHovered(this.activeHandle === handle);
            }

            return;
        }

        for (const [handle, visible] of Object.entries(show)) {
            const node = handles[handle];
            node.visible = visible ?? true;
            node.toggleHovered(this.activeHandle === handle);
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

    public getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.text?.containsPoint(x, y)) return 'text';

        if (this.topLine.containsPoint(x, y) || this.bottomLine.containsPoint(x, y)) return 'line';

        for (const [_, child] of Object.entries(this.handles)) {
            if (child.containsPoint(x, y)) return 'handle';
        }
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

    protected readonly updateBackground = WithBackgroundScene.updateBackground.bind(this);

    protected updateAnchor(top: LineCoords, bottom: LineCoords) {
        const { x, y } = _Scene.Transformable.toCanvasPoint(
            this.topLine,
            (top.x1 + top.x2) / 2,
            Math.min(top.y1, top.y2, bottom.y1, bottom.y2)
        );

        this.anchor.x = x;
        this.anchor.y = y;
    }

    public abstract getBackgroundPoints(
        datum: Datum,
        top: LineCoords,
        bottom: LineCoords,
        bounds: LineCoords
    ): Array<_ModuleSupport.Vec2>;
}
