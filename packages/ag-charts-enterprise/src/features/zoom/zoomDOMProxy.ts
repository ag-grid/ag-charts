import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { type BaseStyleTypeMap, boxEmpty } from 'ag-charts-core';

const { ChartAxisDirection } = _ModuleSupport;

type AxesHandlers = {
    onAxisDragStart: (direction: _ModuleSupport.ChartAxisDirection) => void;
    onAxisDragMove: (
        id: string,
        direction: _ModuleSupport.ChartAxisDirection,
        event: _Widget.DragWidgetEvent<'drag-move'>
    ) => void;
    onAxisDragEnd: () => void;
    onAxisDoubleClick: (id: string, direction: _ModuleSupport.ChartAxisDirection) => void;
    onAxisWheel: (
        id: string,
        direction: _ModuleSupport.ChartAxisDirection,
        event: _ModuleSupport.WheelWidgetEvent
    ) => void;
};

type ProxyAxis = {
    axisId: string;
    direction: _ModuleSupport.ChartAxisDirection;
    div: _Widget.NativeWidget<HTMLDivElement>;
};

export class ZoomDOMProxy {
    private axes: ProxyAxis[] = [];
    private cursor: BaseStyleTypeMap['cursor'] | undefined;

    constructor(private readonly axesHandlers: AxesHandlers) {}

    destroy() {
        for (const a of this.axes) {
            a.div.destroy();
        }
    }

    update(enableAxisDragging: boolean, enableAxisScrolling: boolean, ctx: _ModuleSupport.ModuleContext) {
        for (const ax of this.axes) {
            ax.div.setHidden(!enableAxisDragging && !enableAxisScrolling);
        }
        if (!enableAxisDragging && !enableAxisScrolling) return;

        const { X, Y } = ChartAxisDirection;
        const axesCtx = [...ctx.axisManager.getAxisContext(X), ...ctx.axisManager.getAxisContext(Y)];
        const { removed, added } = this.diffAxisIds(axesCtx);

        if (removed.length > 0) {
            this.axes = this.axes.filter((entry) => {
                if (removed.includes(entry.axisId)) {
                    entry.div.destroy();
                    return false;
                }
                return true;
            });
        }

        for (const newAxisCtx of added) {
            const { axisId, direction } = newAxisCtx;
            this.axes.push(this.initAxis(ctx, axisId, this.axesHandlers, direction));
        }

        for (const axis of this.axes) {
            const axisCtx = axesCtx.find((ac) => ac.axisId === axis.axisId)!;
            const bbox = axisCtx.getCanvasBounds();
            axis.div.setHidden(boxEmpty(bbox));
            if (bbox !== undefined) {
                axis.div.setBounds(bbox);
            }
        }
    }

    setAxisCursor(cursor: BaseStyleTypeMap['cursor'] | undefined) {
        this.cursor = cursor;
        for (const axis of this.axes) {
            axis.div.setCursor(this.getCursor(axis.direction));
        }
    }

    toggleAxisDraggingCursor(direction: _ModuleSupport.ChartAxisDirection, enabled: boolean) {
        for (const axis of this.axes) {
            if (axis.direction !== direction) continue;
            axis.div.setCursor(enabled ? this.getCursor(direction) : undefined);
        }
    }

    private getCursor(direction: _ModuleSupport.ChartAxisDirection) {
        if (this.cursor) return this.cursor;
        return direction === ChartAxisDirection.X ? 'ew-resize' : 'ns-resize';
    }

    private initAxis(
        ctx: Pick<_ModuleSupport.ModuleContext, 'proxyInteractionService' | 'localeManager'>,
        axisId: string,
        handlers: AxesHandlers,
        direction: _ModuleSupport.ChartAxisDirection
    ): ProxyAxis {
        const where = 'afterend';
        const div = ctx.proxyInteractionService.createProxyElement({ type: 'region', domManagerId: axisId, where });
        div.setCursor(this.getCursor(direction));
        div.addListener('drag-start', (e) => {
            if (e.device === 'touch') {
                e.sourceEvent.preventDefault();
            }
            handlers.onAxisDragStart(direction);
        });
        div.addListener('drag-move', (event) => handlers.onAxisDragMove(axisId, direction, event));
        div.addListener('drag-end', handlers.onAxisDragEnd);
        div.addListener('dblclick', () => handlers.onAxisDoubleClick(axisId, direction));
        div.addListener('wheel', (event) => handlers.onAxisWheel(axisId, direction, event));
        return { axisId, div, direction };
    }

    private diffAxisIds(axesCtx: _ModuleSupport.AxisContext[]) {
        const myIds = this.axes.map((entry) => entry.axisId);
        const ctxIds = axesCtx.map((ctx) => ctx.axisId);

        const removed: string[] = myIds.filter((id) => !ctxIds.includes(id));
        const added: _ModuleSupport.AxisContext[] = axesCtx.filter((ac) => !myIds.includes(ac.axisId));
        return { removed, added };
    }
}
