import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { type BaseStyleTypeMap, boxEmpty } from 'ag-charts-core';

const { ChartAxisDirection } = _ModuleSupport;

type AxesHandlers = {
    onAxisDragStart: (id: string, direction: _ModuleSupport.ChartAxisDirection) => void;
    onAxisDragMove: (event: _Widget.DragWidgetEvent<'drag-move'>) => void;
    onAxisDragEnd: () => void;
    onAxisDoubleClick: (id: string, direction: _ModuleSupport.ChartAxisDirection) => void;
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
        this.axes.forEach((a) => a.div.destroy());
    }

    update(enableAxisDragging: boolean, ctx: _ModuleSupport.ModuleContext) {
        this.axes.forEach((ax) => ax.div.setHidden(!enableAxisDragging));
        if (!enableAxisDragging) return;

        const { X, Y } = _ModuleSupport.ChartAxisDirection;
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
            handlers.onAxisDragStart(axisId, direction);
        });
        div.addListener('drag-move', (ev) => handlers.onAxisDragMove(ev));
        div.addListener('drag-end', handlers.onAxisDragEnd);
        div.addListener('dblclick', () => handlers.onAxisDoubleClick(axisId, direction));
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
