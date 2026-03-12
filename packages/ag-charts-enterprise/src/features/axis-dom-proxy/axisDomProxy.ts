import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { AbstractModuleInstance, type AxisID, ChartAxisDirection, boxEmpty } from 'ag-charts-core';

type AxisHit = { axisId: AxisID; direction: ChartAxisDirection };

type ProxyAxis = {
    axisId: AxisID;
    direction: ChartAxisDirection;
    div: _Widget.NativeWidget<HTMLDivElement>;
    bounds?: _ModuleSupport.BBox;
};

/**
 * The AxisDOMProxy module handles interactions with the axes. In most cases it does this via the dom events on proxy
 * axis elements. However, in circumstances where the axes overlap the series area, such as when using the `crossAt`
 * option, we disable pointer events so we do not block other interactions, such as highlight. So it also listen to
 * events on the series area dom proxy and delegates them to the axes where appropriate. It does not handle any
 * effects of these interactions, those are expected to be handled by other modules.
 */
export class AxisDOMProxy extends AbstractModuleInstance {
    private readonly enabled = new Map<string, boolean>();
    private readonly enableDoubleClick = new Map<string, boolean>();
    private readonly enableDragging = new Map<string, boolean>();
    private readonly enableScrolling = new Map<string, boolean>();

    private axes: ProxyAxis[] = [];

    // Tracks the axes that overlap with the series area.
    private readonly overlappingAxisIds = new Set<string>();

    private hoveredAxisId: string | undefined;
    private draggingAxisId: string | undefined;

    private seriesRect: _ModuleSupport.BBox | undefined;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        if (ctx.widgets.seriesDragInterpreter) {
            this.cleanup.register(
                ctx.widgets.seriesDragInterpreter.events.on('dblclick', (event) => this.onSeriesAreaDoubleClick(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-start', (event) => this.onSeriesAreaDragStart(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-move', (event) => this.onSeriesAreaDragMove(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-end', (event) => this.onSeriesAreaDragEnd(event))
            );
        }

        this.cleanup.register(
            ctx.eventsHub.on('layout:complete', (event) => this.onLayoutComplete(event)),
            ctx.eventsHub.on('axis-dom-proxy:update', (event) => this.onUpdate(event)),
            ctx.eventsHub.on('series-area:hover', (event) => this.onSeriesAreaHover(event)),
            ctx.eventsHub.on('series-area:click', (event) => this.onSeriesAreaClick(event)),
            () => this.teardown()
        );
    }

    private teardown() {
        for (const a of this.axes) {
            a.div.destroy();
        }
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        this.seriesRect = event.series.rect;
    }

    private onUpdate(event: _ModuleSupport.AxisDOMProxyUpdateEvent) {
        const { enabled, enableDoubleClick, enableDragging, enableScrolling, source } = event;

        this.enabled.set(source, enabled);
        this.enableDoubleClick.set(source, enableDoubleClick);
        this.enableDragging.set(source, enableDragging);
        this.enableScrolling.set(source, enableScrolling);

        const isEnabled =
            this.isEnabled() && (this.isEnabledDoubleClick() || this.isEnabledDragging() || this.isEnabledScrolling());

        for (const axis of this.axes) {
            axis.div.setHidden(!isEnabled);
        }
        if (!isEnabled) return;

        this.processAxisDiff();
        this.updateOverlappingAxisPointerEvents();
    }

    private processAxisDiff() {
        const {
            ctx: { axisManager },
        } = this;

        const axesCtx = [
            ...axisManager.getAxisContext(ChartAxisDirection.X),
            ...axisManager.getAxisContext(ChartAxisDirection.Y),
        ];

        const { removed, added } = this.diffAxisIds(axesCtx);

        if (removed.length > 0) {
            this.axes = this.axes.filter((entry) => {
                if (!removed.includes(entry.axisId)) return true;

                entry.div.destroy();
                this.overlappingAxisIds.delete(entry.axisId);

                if (this.hoveredAxisId === entry.axisId) this.hoveredAxisId = undefined;
                if (this.draggingAxisId === entry.axisId) this.draggingAxisId = undefined;

                return false;
            });
        }

        for (const newAxisCtx of added) {
            const { axisId, direction } = newAxisCtx;
            const proxyAxis = this.createAxisDOMProxy(axisId, direction);

            this.axes.push(proxyAxis);
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
    }

    private onSeriesAreaHover(event: _ModuleSupport.SeriesAreaHoverEvent) {
        // Ignore events that have already been consumed elsewhere.
        if (event.consumed) {
            if (this.hoveredAxisId) {
                this.hoveredAxisId = undefined;
                this.ctx.eventsHub.emit('axis-dom-proxy:mouseleave', { event });
            }

            return;
        }

        // Only continue if we know we have axes that overlap the series area.
        if (!this.hasOverlappingAxes()) return;

        const axis = this.pickAxisAtPoint(event);
        if (axis) {
            this.hoveredAxisId = axis.axisId;
            this.ctx.eventsHub.emit('axis-dom-proxy:mouseenter', {
                axisId: axis.axisId,
                direction: axis.direction,
                event,
            });
        } else {
            if (this.hoveredAxisId) {
                this.ctx.eventsHub.emit('axis-dom-proxy:mouseleave', { event });
            }
            this.hoveredAxisId = undefined;
        }
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent) {
        if (event.sourceEvent.type !== 'dblclick') return;

        // Ignore events that have already been consumed elsewhere.
        if (event.consumed) return;

        // Only continue if we know we have axes that overlap the series area.
        if (!this.hasOverlappingAxes()) return;

        // Since the axis has already been hovered, we do not need to pick it.
        const axis = this.getAxis(this.hoveredAxisId);
        if (!axis) return;

        this.ctx.eventsHub.emit('axis-dom-proxy:dblclick', {
            event,
            axisId: axis.axisId,
            direction: axis.direction,
        });
    }

    private onSeriesAreaDoubleClick(event: _ModuleSupport.DragInterpreterDblClickEvent) {
        if (!this.isEnabled() || !this.isEnabledDoubleClick()) return;

        // Only continue if we know we have axes that overlap the series area.
        if (!this.hasOverlappingAxes()) return;

        // Since the axis has already been hovered, we do not need to pick it.
        const axis = this.getAxis(this.hoveredAxisId);
        if (!axis) return;

        this.ctx.eventsHub.emit('axis-dom-proxy:dblclick', {
            event,
            axisId: axis.axisId,
            direction: axis.direction,
        });
    }

    private onSeriesAreaDragStart(event: _Widget.DragWidgetEvent<'drag-start'>) {
        if (!this.isEnabled() || !this.isEnabledDragging()) return;

        // Since the axis has already been hovered, we do not need to pick it.
        const hoveredAxis = this.getAxis(this.hoveredAxisId);
        if (!hoveredAxis) return;

        // Check if the hovered axis is overlapping the series area, since it may have been set by hovering on the
        // axis dom element.
        if (!this.overlappingAxisIds.has(hoveredAxis.axisId)) return;

        this.draggingAxisId = hoveredAxis.axisId;

        this.ctx.eventsHub.emit('axis-dom-proxy:drag-start', {
            axisId: hoveredAxis.axisId,
            direction: hoveredAxis.direction,
            event,
        });

        if (event.device === 'touch') {
            event.sourceEvent.preventDefault();
        }
    }

    private onSeriesAreaDragMove(event: _Widget.DragWidgetEvent<'drag-move'>) {
        if (!this.isEnabled() || !this.isEnabledDragging() || !this.draggingAxisId) return;

        // Check if the active axis is overlapping the series area, since it may have been set by dragging on the
        // axis dom element.
        if (!this.overlappingAxisIds.has(this.draggingAxisId)) return;

        // Since the axis has already been hovered, we do not need to pick it.
        const draggingAxis = this.getAxis(this.draggingAxisId);
        if (!draggingAxis) return;

        this.ctx.eventsHub.emit('axis-dom-proxy:drag-move', {
            axisId: draggingAxis.axisId,
            direction: draggingAxis.direction,
            event,
        });
    }

    private onSeriesAreaDragEnd(event: _Widget.DragWidgetEvent<'drag-end'>) {
        if (!this.draggingAxisId) return;

        // Check if the active axis is overlapping the series area, since it may have been set by dragging on the
        // axis dom element.
        if (!this.overlappingAxisIds.has(this.draggingAxisId)) return;

        const draggingAxis = this.getAxis(this.draggingAxisId);
        if (!draggingAxis) return;

        this.draggingAxisId = undefined;
        this.ctx.eventsHub.emit('axis-dom-proxy:drag-end', {
            axisId: draggingAxis.axisId,
            direction: draggingAxis.direction,
            event,
        });
    }

    private pickAxisAtPoint(point: { canvasX: number; canvasY: number }): AxisHit | undefined {
        for (const axis of this.axes) {
            if (!this.overlappingAxisIds.has(axis.axisId)) continue;
            if (axis.bounds?.containsPoint(point.canvasX, point.canvasY)) {
                return { axisId: axis.axisId, direction: axis.direction };
            }
        }
        return undefined;
    }

    private hasOverlappingAxes(): boolean {
        return this.overlappingAxisIds.size > 0;
    }

    private getAxis(axisId: string | undefined): AxisHit | undefined {
        if (!axisId) return undefined;
        const axis = this.axes.find((a) => a.axisId === axisId);
        return axis ? { axisId: axis.axisId, direction: axis.direction } : undefined;
    }

    private updateOverlappingAxisPointerEvents() {
        this.overlappingAxisIds.clear();

        const shouldEnableInteraction = (this.isEnabledDragging() || this.isEnabledScrolling()) && this.seriesRect;

        for (const axis of this.axes) {
            if (!shouldEnableInteraction) {
                axis.div.setPointerEvents(undefined);
                continue;
            }

            // Shrink by 1px to prevent axis from overlapping due to pixel rounding.
            const isOverlapping = Boolean(axis.bounds?.clone().shrink(1).collidesBBox(this.seriesRect!));

            if (isOverlapping) {
                this.overlappingAxisIds.add(axis.axisId);
                axis.div.setPointerEvents('none');
            } else {
                axis.div.setPointerEvents(undefined);
            }
        }

        this.cleanupAxisState();
    }

    private cleanupAxisState() {
        if (this.hoveredAxisId && !this.overlappingAxisIds.has(this.hoveredAxisId)) {
            this.hoveredAxisId = undefined;
        }
        if (this.draggingAxisId && !this.overlappingAxisIds.has(this.draggingAxisId)) {
            this.draggingAxisId = undefined;
        }
    }

    private createAxisDOMProxy(axisId: AxisID, direction: ChartAxisDirection): ProxyAxis {
        const {
            ctx: { proxyInteractionService },
        } = this;

        const where = 'afterend';
        const div = proxyInteractionService.createProxyElement({ type: 'region', domManagerId: axisId, where });

        div.addListener('drag-start', (event) => {
            if (!this.isEnabled() || !this.isEnabledDragging()) return;
            if (event.device === 'touch') {
                event.sourceEvent.preventDefault();
            }
            this.draggingAxisId = axisId;
            this.ctx.eventsHub.emit('axis-dom-proxy:drag-start', { axisId, direction, event });
        });
        div.addListener('drag-move', (event) => {
            if (!this.isEnabled() || !this.isEnabledDragging()) return;
            this.ctx.eventsHub.emit('axis-dom-proxy:drag-move', { axisId, direction, event });
        });
        div.addListener('drag-end', (event) => {
            if (!this.isEnabled() || !this.isEnabledDragging()) return;
            this.draggingAxisId = undefined;
            this.ctx.eventsHub.emit('axis-dom-proxy:drag-end', { axisId, direction, event });
        });
        div.addListener('dblclick', (event) => {
            if (!this.isEnabled() || !this.isEnabledDoubleClick()) return;
            this.ctx.eventsHub.emit('axis-dom-proxy:dblclick', { axisId, direction, event });
        });
        div.addListener('mouseenter', (event) => {
            if (!this.isEnabled()) return;
            this.hoveredAxisId = axisId;
            this.ctx.eventsHub.emit('axis-dom-proxy:mouseenter', { axisId, direction, event });
        });
        div.addListener('mouseleave', (event) => {
            if (!this.isEnabled()) return;
            this.hoveredAxisId = undefined;
            this.ctx.eventsHub.emit('axis-dom-proxy:mouseleave', { event });
        });
        div.addListener('wheel', (event) => {
            if (!this.isEnabled() || !this.isEnabledScrolling()) return;
            this.ctx.eventsHub.emit('axis-dom-proxy:wheel', { axisId, direction, event });
        });

        return { axisId, div, direction };
    }

    private diffAxisIds(axesCtx: _ModuleSupport.AxisContext[]) {
        const currentIds = this.axes.map((entry) => entry.axisId);
        const ctxIds = axesCtx.map((ctx) => ctx.axisId);

        const removed: string[] = currentIds.filter((id) => !ctxIds.includes(id));
        const added: _ModuleSupport.AxisContext[] = axesCtx.filter((ac) => !currentIds.includes(ac.axisId));

        return { removed, added };
    }

    private isEnabled() {
        return this.isBooleanMap(this.enabled);
    }

    private isEnabledDoubleClick() {
        return this.isBooleanMap(this.enableDoubleClick);
    }

    private isEnabledDragging() {
        return this.isBooleanMap(this.enableDragging);
    }

    private isEnabledScrolling() {
        return this.isBooleanMap(this.enableScrolling);
    }

    private isBooleanMap(map: Map<string, boolean>) {
        for (const value of map.values()) {
            if (value) return true;
        }
        return false;
    }
}
