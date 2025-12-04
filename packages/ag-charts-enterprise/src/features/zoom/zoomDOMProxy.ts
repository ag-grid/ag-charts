import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { type AxisID, type BaseStyleTypeMap, ChartAxisDirection, boxEmpty } from 'ag-charts-core';

type AxisHit = { axisId: AxisID; direction: ChartAxisDirection };

type AxesHandlers = {
    onAxisDragStart: (direction: ChartAxisDirection) => void;
    onAxisDragMove: (id: AxisID, direction: ChartAxisDirection, event: _Widget.DragWidgetEvent<'drag-move'>) => void;
    onAxisDragEnd: () => void;
    onAxisDoubleClick: (id: AxisID, direction: ChartAxisDirection) => void;
    onAxisWheel: (direction: ChartAxisDirection, event: _ModuleSupport.WheelWidgetEvent) => void;
};

type ProxyAxis = {
    axisId: AxisID;
    direction: ChartAxisDirection;
    div: _Widget.NativeWidget<HTMLDivElement>;
    bounds?: _ModuleSupport.BBox;
};

export class ZoomDOMProxy {
    private axes: ProxyAxis[] = [];
    private cursor: BaseStyleTypeMap['cursor'] | undefined;
    private readonly overlappingAxisIds = new Set<string>();
    private hoveredAxisId: string | undefined;
    private activeAxisId: string | undefined;
    private seriesRect: _ModuleSupport.BBox | undefined;

    constructor(private readonly axesHandlers: AxesHandlers) {}

    destroy() {
        for (const a of this.axes) {
            a.div.destroy();
        }
    }

    update(
        enabled: boolean,
        enableAxisDragging: boolean,
        enableAxisScrolling: boolean,
        ctx: _ModuleSupport.ModuleContext,
        seriesRect?: _ModuleSupport.BBox
    ) {
        this.seriesRect = seriesRect;

        const disabled = !enabled || (!enableAxisDragging && !enableAxisScrolling);
        for (const ax of this.axes) {
            ax.div.setHidden(disabled);
        }
        if (disabled) return;

        const { X, Y } = ChartAxisDirection;
        const axesCtx = [...ctx.axisManager.getAxisContext(X), ...ctx.axisManager.getAxisContext(Y)];
        const { removed, added } = this.diffAxisIds(axesCtx);

        if (removed.length > 0) {
            this.axes = this.axes.filter((entry) => {
                if (removed.includes(entry.axisId)) {
                    entry.div.destroy();
                    this.overlappingAxisIds.delete(entry.axisId);
                    if (this.hoveredAxisId === entry.axisId) this.hoveredAxisId = undefined;
                    if (this.activeAxisId === entry.axisId) this.activeAxisId = undefined;
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
            if (bbox == undefined) {
                axis.bounds = undefined;
            } else {
                axis.div.setBounds(bbox);
                axis.bounds = new _ModuleSupport.BBox(bbox.x, bbox.y, bbox.width, bbox.height);
            }
        }

        this.updateOverlappingAxisPointerEvents(enableAxisDragging, enableAxisScrolling);
    }

    setAxisCursor(cursor: BaseStyleTypeMap['cursor'] | undefined) {
        this.cursor = cursor;
        for (const axis of this.axes) {
            axis.div.setCursor(this.getCursor(axis.direction));
        }
    }

    toggleAxisDraggingCursor(direction: ChartAxisDirection, enabled: boolean) {
        for (const axis of this.axes) {
            if (axis.direction !== direction) continue;
            axis.div.setCursor(enabled ? this.getCursor(direction) : undefined);
        }
    }

    private updateOverlappingAxisPointerEvents(enableAxisDragging: boolean, enableAxisScrolling: boolean) {
        this.overlappingAxisIds.clear();
        const shouldEnableInteraction = (enableAxisDragging || enableAxisScrolling) && this.seriesRect;

        for (const axis of this.axes) {
            if (!shouldEnableInteraction) {
                axis.div.setPointerEvents(undefined);
                continue;
            }

            const isOverlapping = Boolean(axis.bounds?.collidesBBox(this.seriesRect!));

            if (isOverlapping) {
                this.overlappingAxisIds.add(axis.axisId);
                axis.div.setPointerEvents('none');
            } else {
                axis.div.setPointerEvents(undefined);
            }
        }

        this.cleanupAxisState();
    }

    private cleanupAxisState(): void {
        if (this.hoveredAxisId && !this.overlappingAxisIds.has(this.hoveredAxisId)) {
            this.hoveredAxisId = undefined;
        }
        if (this.activeAxisId && !this.overlappingAxisIds.has(this.activeAxisId)) {
            this.activeAxisId = undefined;
        }
    }

    public pickAxisAtPoint(x: number, y: number): AxisHit | undefined {
        for (const axis of this.axes) {
            if (!this.overlappingAxisIds.has(axis.axisId)) continue;
            if (axis.bounds?.containsPoint(x, y)) {
                return { axisId: axis.axisId, direction: axis.direction };
            }
        }
        return undefined;
    }

    public setHoveredAxis(axisId: string): void {
        if (this.overlappingAxisIds.has(axisId)) {
            this.hoveredAxisId = axisId;
        }
    }

    public clearHoveredAxis(): void {
        if (!this.activeAxisId) {
            this.hoveredAxisId = undefined;
        }
    }

    public beginDelegatedAxisDrag(axisId: string): boolean {
        if (!this.overlappingAxisIds.has(axisId)) return false;

        this.activeAxisId = axisId;
        this.hoveredAxisId = undefined;
        return true;
    }

    public endDelegatedAxisDrag(axisId: string): void {
        if (this.activeAxisId === axisId) {
            this.activeAxisId = undefined;
        }
        this.hoveredAxisId = undefined;
    }

    public hasOverlappingAxes(): boolean {
        return this.overlappingAxisIds.size > 0;
    }

    public getHoveredAxis(): AxisHit | undefined {
        if (!this.hoveredAxisId) return undefined;
        const axis = this.axes.find((a) => a.axisId === this.hoveredAxisId);
        return axis ? { axisId: axis.axisId, direction: axis.direction } : undefined;
    }

    public getCursor(direction: ChartAxisDirection) {
        if (this.cursor) return this.cursor;
        return direction === ChartAxisDirection.X ? 'ew-resize' : 'ns-resize';
    }

    private initAxis(
        ctx: Pick<_ModuleSupport.ModuleContext, 'proxyInteractionService' | 'localeManager'>,
        axisId: AxisID,
        handlers: AxesHandlers,
        direction: ChartAxisDirection
    ): ProxyAxis {
        const where = 'afterend';
        const div = ctx.proxyInteractionService.createProxyElement({ type: 'region', domManagerId: axisId, where });
        div.setCursor(this.getCursor(direction));
        div.addListener('drag-start', (e) => {
            if (e.device === 'touch') {
                e.sourceEvent.preventDefault();
            }
            this.activeAxisId = axisId;
            handlers.onAxisDragStart(direction);
        });
        div.addListener('drag-move', (event) => handlers.onAxisDragMove(axisId, direction, event));
        div.addListener('drag-end', () => {
            this.activeAxisId = undefined;
            this.hoveredAxisId = undefined;
            handlers.onAxisDragEnd();
        });
        div.addListener('dblclick', () => handlers.onAxisDoubleClick(axisId, direction));
        div.addListener('wheel', (event) => handlers.onAxisWheel(direction, event));
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
