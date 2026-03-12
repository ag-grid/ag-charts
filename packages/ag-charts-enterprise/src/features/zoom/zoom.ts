import { _ModuleSupport, _Widget } from 'ag-charts-community';
import type { AxisID, BaseStyleTypeMap, CartesianAxisDirection, DefinedZoomState, ZoomMinMax } from 'ag-charts-core';
import {
    AbstractModuleInstance,
    ActionOnSet,
    ChartAxisDirection,
    ChartUpdateType,
    Property,
    ProxyProperty,
    UNIT_MAX,
    UNIT_MIN,
    definedZoomState,
    entries,
    isNumberEqual,
    roundTo,
} from 'ag-charts-core';
import type { AgZoomAnchorPoint } from 'ag-charts-types';

import { ZoomScrollPanner } from '../zoom-interaction/zoomScrollPanner';
import { ZoomRect } from './scenes/zoomRect';
import { ZoomAutoScaler, ZoomAutoScalingProperties } from './zoomAutoScale';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomContextMenu } from './zoomContextMenu';
import { ZoomOnDataChange, ZoomOnDataChangeProperties } from './zoomOnDataChange';
import { type ZoomPanUpdate, ZoomPanner } from './zoomPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import { ZoomToolbar } from './zoomToolbar';
import { ZoomTwoFingers } from './zoomTwoFingers';
import type { ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT_SIZE,
    constrainAxis,
    constrainZoom,
    dx,
    dy,
    isMaxZoom,
    scaleZoom,
    scaleZoomAxisWithAnchor,
} from './zoomUtils';

const { userInteraction, InteractionState } = _ModuleSupport;

const round = (value: number) => roundTo(value, 10);

const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';

enum DragState {
    None,
    Axis,
    Pan,
    Select,
    TwoFingers,
}

export class Zoom extends AbstractModuleInstance {
    @ActionOnSet<Zoom>({
        newValue(enabled) {
            this.onEnabledChange(enabled);
        },
    })
    @Property
    public enabled = false;

    @Property
    public enableAxisDragging = true;

    @Property
    public enableAxisScrolling = true;

    @Property
    public enableDoubleClickToReset = true;

    @ActionOnSet<Zoom>({
        changeValue(newValue) {
            this.ctx.zoomManager.setIndependentAxes(Boolean(newValue));
        },
    })
    @Property
    public enableIndependentAxes?: boolean;

    @Property
    public enablePanning = true;

    @Property
    public enableScrolling = true;

    @Property
    public enableSelecting = false;

    @Property
    public enableTwoFingerZoom = true;

    @Property
    public panKey: 'alt' | 'ctrl' | 'meta' | 'shift' = 'alt';

    @Property
    public axes: 'x' | 'y' | 'xy' = 'x';

    @Property
    public scrollingMode: 'pan' | 'zoom' = 'zoom';

    @Property
    public scrollingStep = UNIT_SIZE / 10;

    @Property
    public keepAspectRatio = false;

    @Property
    public minVisibleItems = 2;

    @Property
    public anchorPointX: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_X;

    @Property
    public anchorPointY: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_Y;

    @Property
    public readonly autoScaling: ZoomAutoScalingProperties = new ZoomAutoScalingProperties();

    @Property
    public axisDraggingMode: 'pan' | 'zoom' = 'zoom';

    @Property
    public buttons = new ZoomToolbar(
        this.ctx,
        this.getModuleProperties.bind(this),
        this.updateZoom.bind(this),
        this.updateAxisZoom.bind(this),
        this.resetZoom.bind(this),
        this.isZoomValid.bind(this)
    );

    @Property
    public readonly onDataChange: ZoomOnDataChangeProperties = new ZoomOnDataChangeProperties();

    // Scenes
    private seriesRect?: _ModuleSupport.BBox;
    private paddedRect?: _ModuleSupport.BBox;

    // Zoom methods
    private readonly axisDragger = new ZoomAxisDragger();
    private readonly autoScaler: ZoomAutoScaler;
    private readonly contextMenu: ZoomContextMenu;
    private readonly dataChangeHandler: ZoomOnDataChange;
    private readonly panner = new ZoomPanner(this.ctx);
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();
    private readonly scrollPanner = new ZoomScrollPanner();
    private readonly twoFingers = new ZoomTwoFingers();

    private hoveredAxisId?: AxisID;

    @ProxyProperty('panner.deceleration')
    @Property
    public deceleration: number | 'off' | 'short' | 'long' = 'short';

    // State
    private dragState = DragState.None;
    private shouldFlipXY?: boolean;
    private readonly isState = (state: _ModuleSupport.InteractionState) => this.ctx.interactionManager.isState(state);

    private destroyContextMenuActions: (() => void) | undefined = undefined;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect, this.getZoom.bind(this), this.isZoomValid.bind(this));
        this.contextMenu = new ZoomContextMenu(
            ctx.eventsHub,
            ctx.contextMenuRegistry,
            ctx.zoomManager,
            this.getModuleProperties.bind(this),
            () => this.paddedRect,
            this.updateZoom.bind(this),
            this.isZoomValid.bind(this)
        );

        // FIXME(AG-8627 TC10; AG-16414) `minVisibleItems` should have its own zoom:change-request handling
        const minVisibleItemsCallback = (event: _ModuleSupport.ZoomChangeRequestEvent): void => {
            if (this.minVisibleItems > 0) {
                const restrictions = event.stateAsDefinedZoom();
                event.constrainZoom(this.constrainZoom(restrictions));
            }
        };
        this.dataChangeHandler = new ZoomOnDataChange(
            minVisibleItemsCallback,
            this.onDataChange,
            this.ctx,
            this.cleanup
        );

        if (ctx.widgets.seriesDragInterpreter) {
            this.cleanup.register(
                ctx.widgets.seriesDragInterpreter.events.on('dblclick', (event) => this.onSeriesAreaDoubleClick(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-start', (event) => this.onSeriesAreaDragStart(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-move', (event) => this.onSeriesAreaDragMove(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-end', () => this.onSeriesAreaDragEnd())
            );
        }
        this.cleanup.register(
            ctx.scene.attachNode(selectionRect),
            ctx.eventsHub.on('series:keynav-zoom', (event) => this.onNavZoom(event)),
            ctx.eventsHub.on('series:keynav-panx', (event) => this.onNavPanX(event)),
            ctx.eventsHub.on('zoom-interaction:zoom:wheel', (event) => this.onWheel(event)),
            ctx.eventsHub.on('zoom-interaction:zoom:axis-mouseenter', (event) => this.onAxisMouseEnter(event)),
            ctx.eventsHub.on('zoom-interaction:zoom:axis-mouseleave', (event) => this.onAxisMouseLeave(event)),
            ctx.eventsHub.on('zoom-interaction:zoom:axis-drag-start', (event) => this.onAxisDragStart(event.direction)),
            ctx.eventsHub.on('zoom-interaction:zoom:axis-drag-move', (event) =>
                this.onAxisDragMove(event.axisId, event.direction, event.event)
            ),
            ctx.eventsHub.on('zoom-interaction:zoom:axis-drag-end', () => this.onAxisDragEnd()),
            ctx.eventsHub.on('zoom-interaction:zoom:axis-dblclick', (event) => this.onAxisDoubleClick(event.axisId)),
            ctx.eventsHub.on('zoom-interaction:zoom:axis-wheel', (event) => this.onAxisWheel(event)),
            ctx.widgets.seriesWidget.addListener('touchstart', (event, current) => this.onTouchStart(event, current)),
            ctx.widgets.seriesWidget.addListener('touchmove', (event, current) => this.onTouchMove(event, current)),
            ctx.widgets.seriesWidget.addListener('touchend', (event) => this.onTouchEnd(event)),
            ctx.widgets.seriesWidget.addListener('touchcancel', (event) => this.onTouchEnd(event)),
            ctx.updateService.addListener('process-data', (event) => this.onProcessData(event)),
            ctx.eventsHub.on('layout:complete', (event) => this.onLayoutComplete(event)),
            ctx.eventsHub.on('zoom:change-request', (event) => this.onZoomChangeRequested(event)),
            ctx.eventsHub.on('zoom:pan-start', (event) => this.onZoomPanStart(event)),
            this.panner.addListener('update', (event) => this.onPanUpdate(event)),
            () => this.teardown()
        );

        // Init last, because we want `autoScaling` to be the last listener for `zoom:change-event` events:
        this.autoScaler = new ZoomAutoScaler(this.autoScaling, ctx.zoomManager, this, ctx.eventsHub, this.cleanup);
    }

    private teardown() {
        this.ctx.zoomManager.setZoomModuleEnabled(false);
        this.buttons.destroy();
        this.destroyContextMenuActions?.();
        this.dataChangeHandler.destroy();
    }

    private onEnabledChange(enabled: boolean) {
        this.ctx.zoomManager.setZoomModuleEnabled(enabled);

        // The constructor may not yet have been called, so `contextMenu` may be undefined.
        if (this.contextMenu) {
            this.destroyContextMenuActions?.();
            this.destroyContextMenuActions = this.contextMenu.registerActions(enabled);
        }
    }

    private isIgnoredTouch(event: Pick<_Widget.DragWidgetEvent, 'device'> | undefined): boolean {
        if (event?.device !== 'touch') {
            return false;
        }
        if (this.ctx.chartService.touch.dragAction !== 'drag') {
            return true;
        }
        if (this.enableSelecting) {
            return false;
        }
        if (!this.enablePanning) {
            return true;
        }
        return isMaxZoom(this.getZoom());
    }

    private onSeriesAreaDoubleClick(
        event?: _ModuleSupport.DragInterpreterDblClickEvent & { preventZoomDblClick?: boolean }
    ) {
        const { enabled, enableDoubleClickToReset } = this;

        if (!enabled || !enableDoubleClickToReset) return;
        if (event?.preventZoomDblClick || !this.isState(InteractionState.ZoomClickable)) return;

        this.resetZoom('zoom-seriesarea-dblclick');
    }

    private onSeriesAreaDragStart(event: _Widget.DragWidgetEvent<'drag-start'>) {
        const {
            enabled,
            enablePanning,
            enableSelecting,
            ctx: { domManager, zoomManager },
        } = this;

        if (
            !enabled ||
            !this.isState(InteractionState.ZoomDraggable) ||
            this.dragState !== DragState.None ||
            this.isIgnoredTouch(event)
        ) {
            return;
        }

        this.panner.stopInteractions();

        if (this.hoveredAxisId) return;

        // Determine which ZoomDrag behaviour to use.
        let newDragState = DragState.None;

        const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent as MouseEvent);
        // Allow panning if either selection is disabled or the panning key is pressed.
        if (enablePanning && (!enableSelecting || panKeyPressed)) {
            domManager.updateCursor(CURSOR_ID, 'grabbing');
            newDragState = DragState.Pan;
            this.panner.start();
        } else if (enableSelecting && !panKeyPressed) {
            newDragState = DragState.Select;
        }

        if ((this.dragState = newDragState) !== DragState.None) {
            zoomManager.fireZoomPanStartEvent('zoom');
        }
    }

    private onSeriesAreaDragMove(event: _Widget.DragWidgetEvent<'drag-move'>) {
        const {
            dragState,
            enabled,
            paddedRect,
            panner,
            selector,
            ctx: { interactionManager, tooltipManager, eventsHub },
        } = this;

        if (this.hoveredAxisId) return;

        if (!enabled || !paddedRect || !this.isState(InteractionState.ZoomDraggable) || this.isIgnoredTouch(event)) {
            return;
        }

        interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);
        if (event.device === 'touch') {
            event.sourceEvent.preventDefault();
        }

        switch (dragState) {
            case DragState.Pan:
                panner.update(event);
                break;

            case DragState.Select:
                selector.update(event, this.getModuleProperties(), paddedRect);
                break;

            case DragState.None:
                return;
        }

        tooltipManager.updateTooltip(TOOLTIP_ID);
        eventsHub.emit('chart:request-update', {
            type: ChartUpdateType.PERFORM_LAYOUT,
            opts: { skipAnimations: true },
        });
    }

    private onSeriesAreaDragEnd() {
        const {
            ctx: { interactionManager },
        } = this;

        if (this.hoveredAxisId) return;

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        if (!this.enabled || this.dragState === DragState.None) return;

        this.handleRegularDragEnd();
        this.resetDragState();
    }

    private handleRegularDragEnd(): void {
        const { panner, selector } = this;

        switch (this.dragState) {
            case DragState.Pan:
                panner.stop();
                break;
            case DragState.Select:
                if (selector.didUpdate()) {
                    const newZoom = selector.stop(this.seriesRect, this.paddedRect, this.getZoom());
                    if (newZoom) {
                        this.updateZoom(userInteraction('zoom-seriesarea-selector'), newZoom);
                    } else {
                        // Change rejected (invalid zoom) - redraw canvas to remove the zoom-selection.
                        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
                    }
                }
                break;
        }
    }

    private resetDragState(): void {
        this.dragState = DragState.None;
        this.ctx.domManager.updateCursor(CURSOR_ID);
        this.ctx.tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onAxisMouseEnter(event: _ModuleSupport.ZoomInteractionAxisMouseEvent<'mouseenter'>) {
        const { anchorPointX, anchorPointY, axisDraggingMode, enabled, enableAxisDragging } = this;

        this.hoveredAxisId = event.axisId;

        if (!enabled || !enableAxisDragging) {
            this.ctx.domManager.updateCursor(CURSOR_ID);
            return;
        }

        const zoom = this.getZoom();

        let cursor: BaseStyleTypeMap['cursor'];
        let showCursor = false;

        if (event.direction === ChartAxisDirection.X) {
            cursor = 'ew-resize';
            showCursor = !isNumberEqual(dx(zoom), UNIT_SIZE);

            if (!showCursor) {
                const checkZoomX = scaleZoom(zoom, 0.999, 1);
                checkZoomX.x = scaleZoomAxisWithAnchor(checkZoomX.x, zoom.x, anchorPointX);
                showCursor = this.isZoomValid(checkZoomX, { includeYVisibleRange: true });
            }
        } else {
            cursor = 'ns-resize';
            showCursor = !isNumberEqual(dy(zoom), UNIT_SIZE);

            if (!showCursor) {
                const checkZoomY = scaleZoom(zoom, 1, 0.999);
                checkZoomY.y = scaleZoomAxisWithAnchor(checkZoomY.y, zoom.y, anchorPointY);
                showCursor = this.isZoomValid(checkZoomY, { includeYVisibleRange: true });
            }
        }

        if (axisDraggingMode === 'pan') {
            cursor = 'grab';
        }

        if (showCursor) {
            event.stopProcessing();
            this.ctx.domManager.updateCursor(CURSOR_ID, cursor);
        } else {
            this.ctx.domManager.updateCursor(CURSOR_ID);
        }
    }

    private onAxisMouseLeave(event: _ModuleSupport.ZoomInteractionAxisMouseEvent<'mouseleave'>) {
        this.hoveredAxisId = event.axisId;
        this.ctx.domManager.updateCursor(CURSOR_ID);

        if (!this.enabled || !this.enableAxisDragging) return;
    }

    private onAxisDoubleClick(id: AxisID) {
        const {
            enabled,
            enableDoubleClickToReset,
            ctx: { zoomManager },
        } = this;

        if (!enabled || !enableDoubleClickToReset || !this.isState(InteractionState.ZoomClickable)) return;

        this.previousAxisZoomValid = { [ChartAxisDirection.X]: true, [ChartAxisDirection.Y]: true };
        zoomManager.resetAxisZoom({ source: 'user-interaction', sourceDetail: 'zoom-axis-dblclick' }, id);
    }

    private onAxisDragStart(direction: ChartAxisDirection) {
        const {
            axisDraggingMode,
            enabled,
            enableAxisDragging,
            panner,
            ctx: { zoomManager },
        } = this;
        if (!enabled || !enableAxisDragging) return;

        panner.stopInteractions();

        if (axisDraggingMode === 'pan') {
            this.ctx.domManager.updateCursor(CURSOR_ID, 'grabbing');

            this.dragState = DragState.Pan;
            this.panner.start(direction);

            zoomManager.fireZoomPanStartEvent('zoom');
        } else {
            this.dragState = DragState.Axis;
        }
    }

    private onAxisDragMove(axisId: AxisID, direction: ChartAxisDirection, event: _Widget.DragWidgetEvent<'drag-move'>) {
        const {
            anchorPointX,
            anchorPointY,
            axisDragger,
            dragState,
            enabled,
            enableAxisDragging,
            seriesRect,
            shouldFlipXY,
            ctx: { interactionManager, tooltipManager, eventsHub, zoomManager },
        } = this;

        if (!enabled || !enableAxisDragging || !seriesRect) return;

        interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);
        if (event.device === 'touch') {
            event.sourceEvent.preventDefault();
        }

        const zoom = this.getZoom();

        if (dragState === DragState.Pan) {
            this.panner.update({ currentX: event.offsetX, currentY: event.offsetY });
        } else {
            let anchor = direction === ChartAxisDirection.X ? anchorPointX : anchorPointY;
            if (shouldFlipXY) anchor = direction === ChartAxisDirection.X ? anchorPointY : anchorPointX;
            const axisZoom = zoomManager.getAxisZoom(axisId);
            const newZoom = axisDragger.update(event, direction, anchor, seriesRect, zoom, axisZoom);
            this.autoScaler.onManualAdjustment(direction);
            this.updateAxisZoom(
                userInteraction('zoom-axis-drag'),
                axisId,
                direction as CartesianAxisDirection,
                newZoom,
                { directional: true }
            );
        }

        tooltipManager.updateTooltip(TOOLTIP_ID);
        eventsHub.emit('chart:request-update', {
            type: ChartUpdateType.PERFORM_LAYOUT,
            opts: { skipAnimations: true },
        });
    }

    private onAxisDragEnd() {
        const {
            axisDraggingMode,
            axisDragger,
            dragState,
            enabled,
            enableAxisDragging,
            ctx: { domManager, interactionManager, tooltipManager },
        } = this;

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!enabled || !enableAxisDragging || dragState === DragState.None) return;

        this.dragState = DragState.None;

        if (axisDraggingMode === 'pan') {
            this.panner.stop();
        }

        axisDragger.stop();
        domManager.updateCursor(CURSOR_ID);
        tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onNavZoom(event: _ModuleSupport.SeriesKeyNavZoomEvent) {
        const { enabled, enableScrolling, scroller } = this;
        const isDefaultState = this.ctx.interactionManager.isState(_ModuleSupport.InteractionState.Default);

        if (!isDefaultState || !enabled || !enableScrolling) return;
        event.widgetEvent.sourceEvent.preventDefault();

        this.updateZoom(
            userInteraction(`keyboard(${event.delta})`),
            scroller.updateDelta(event.delta, this.getModuleProperties(), this.getZoom())
        );
    }

    private onNavPanX(event: _ModuleSupport.SeriesKeyNavPanXEvent) {
        const { enabled } = this;
        const isDefaultState = this.ctx.interactionManager.isState(_ModuleSupport.InteractionState.Default);

        if (!isDefaultState || !enabled) return;
        event.widgetEvent.sourceEvent.preventDefault();

        const zoom = this.getZoom();
        const scrollDelta: number = event.delta * (event.reverse ? -1 : 1) * dx(zoom);
        zoom.x.min += scrollDelta;
        zoom.x.max += scrollDelta;
        zoom.x = constrainAxis(zoom.x);
        this.updateZoom(userInteraction(`keyboard-page(${event.delta})`), zoom);
    }

    private onWheel(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        const { enabled, enablePanning, enableScrolling, paddedRect, scrollingMode } = this;

        if (!enabled || !enableScrolling || !paddedRect || !this.isState(InteractionState.ZoomWheelable)) return;

        baseEvent.stopProcessing();

        const { deltaX, deltaY } = baseEvent.event;
        const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);

        if (enablePanning && (scrollingMode === 'pan' || isHorizontalScrolling)) {
            this.onWheelPanning(baseEvent);
        } else {
            this.onWheelScrolling(baseEvent);
        }
    }

    private onWheelPanning(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        const {
            scrollingStep,
            scrollPanner,
            seriesRect,
            scrollingMode,
            ctx: { zoomManager },
        } = this;

        if (!seriesRect) {
            baseEvent.abort();
            return;
        }

        const { event } = baseEvent;
        const zoom = this.getZoom();
        const isZoomCapped =
            (event.deltaY > 0 && zoom.y.min === UNIT_MIN) || (event.deltaY < 0 && zoom.y.max === UNIT_MAX);

        const newZooms = scrollPanner.update(
            event,
            scrollingStep,
            scrollingMode,
            seriesRect,
            zoomManager.getAxisZooms()
        );
        this.updateChanges(userInteraction('zoom-seriesarea-wheel'), newZooms);

        if (isZoomCapped) {
            baseEvent.capped();
        } else {
            baseEvent.uncapped();
        }
    }

    private onWheelScrolling(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        const zoom = this.getZoom();
        const isZoomCapped = baseEvent.event.deltaY > 0 && isMaxZoom(zoom);

        this.handleWheelScrolling(baseEvent, isZoomCapped);
    }

    private onAxisWheel(baseEvent: _ModuleSupport.ZoomInteractionAxisWheelEvent) {
        if (!this.enabled || !this.enableAxisScrolling) return;

        baseEvent.stopProcessing();

        const { event, direction: axisDirection } = baseEvent;

        if (axisDirection !== ChartAxisDirection.X && axisDirection !== ChartAxisDirection.Y) {
            return;
        }

        const isScalingX = axisDirection === ChartAxisDirection.X;
        const isScalingY = !isScalingX;

        const props = this.getModuleProperties({ isScalingX, isScalingY });

        const zoom = this.getZoom();
        const isZoomCapped =
            event.deltaY > 0 && zoom[axisDirection].min === UNIT_MIN && zoom[axisDirection].max === UNIT_MAX;

        this.autoScaler.onManualAdjustment(axisDirection);
        this.handleWheelScrolling(baseEvent, isZoomCapped, props);
    }

    private handleWheelScrolling(
        baseEvent: _ModuleSupport.ZoomInteractionWheelEvent | _ModuleSupport.ZoomInteractionAxisWheelEvent,
        isZoomCapped: boolean,
        props: ZoomProperties = this.getModuleProperties()
    ) {
        const {
            enableIndependentAxes,
            scroller,
            seriesRect,
            ctx: { zoomManager },
        } = this;

        if (!seriesRect) {
            baseEvent.abort();
            return;
        }

        const { event } = baseEvent;

        let updated = true;

        const sourcing = userInteraction('zoom-axis-wheel');
        if (enableIndependentAxes === true) {
            const newZooms = scroller.updateAxes(event, props, seriesRect, zoomManager.getAxisZooms());
            for (const [axisId, { direction, min, max }] of entries(newZooms)) {
                const constrainedZoom =
                    direction === ChartAxisDirection.X
                        ? this.constrainZoom({ x: { min, max }, y: { min: UNIT_MAX, max: UNIT_MAX } }).x
                        : { min, max };
                updated &&= this.updateAxisZoom(sourcing, axisId, direction, constrainedZoom);
            }
        } else {
            const newZoom = scroller.update(event, props, seriesRect, this.getZoom());
            if (newZoom == null) return 'abort';
            updated = this.updateUnifiedZoom(sourcing, newZoom, { directional: true });
        }

        if (isZoomCapped || (event.deltaY < 0 && !updated)) {
            baseEvent.capped();
        } else {
            baseEvent.uncapped();
        }
    }

    private onTouchStart(event: _Widget.TouchWidgetEvent<'touchstart'>, current: _Widget.Widget) {
        if (!this.enableTwoFingerZoom || this.dragState !== DragState.None) return;
        if (this.twoFingers.start(event, current, this.getZoom())) {
            this.dragState = DragState.TwoFingers;
        }
    }

    private onTouchMove(event: _Widget.TouchWidgetEvent<'touchmove'>, current: _Widget.Widget) {
        if (!this.enableTwoFingerZoom || this.dragState !== DragState.TwoFingers) return;
        const newZoom = this.twoFingers.update(event, current);
        this.updateZoom(userInteraction('zoom-seriesarea-twofingers'), constrainZoom(newZoom));
    }

    private onTouchEnd(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>) {
        if (!this.enableTwoFingerZoom || this.dragState !== DragState.TwoFingers) return;
        event.sourceEvent.preventDefault();
        if (this.twoFingers.end(event)) {
            this.dragState = DragState.None;
        }
    }

    private onProcessData(event: _ModuleSupport.ProcessDataEvent) {
        this.shouldFlipXY = event.series.shouldFlipXY;
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        this.ctx.eventsHub.emit('axis-dom-proxy:update', {
            source: 'zoom',
            enabled: this.enabled,
            enableDoubleClick: this.enableDoubleClickToReset,
            enableDragging: this.enableAxisDragging,
            enableScrolling: this.enableAxisScrolling,
        });

        if (!this.enabled) return;

        this.seriesRect = event.series.rect;
        this.paddedRect = event.series.paddedRect;
    }

    private onZoomChangeRequested(event: _ModuleSupport.ZoomChangeRequestEvent) {
        if (event.sourceDetail !== 'zoom-seriesarea-panner') {
            this.panner.stopInteractions();
        }

        const zoom = this.getZoom();
        this.buttons.toggleVisibleZoomed(isMaxZoom(zoom));
    }

    private onZoomPanStart(event: _ModuleSupport.ZoomPanStartEvent): void {
        if (event.callerId === 'zoom') {
            this.panner.stopInteractions();
        }
    }

    private onPanUpdate(event: ZoomPanUpdate) {
        const {
            panner,
            seriesRect,
            ctx: { tooltipManager, zoomManager },
        } = this;

        if (!seriesRect) return;

        const newZooms = panner.translateZooms(seriesRect, zoomManager.getAxisZooms(), event.deltaX, event.deltaY);
        this.updateChanges(userInteraction('zoom-seriesarea-panner'), newZooms);
        tooltipManager.updateTooltip(TOOLTIP_ID);
    }

    private isPanningKeyPressed(event: MouseEvent | WheelEvent) {
        switch (this.panKey) {
            case 'alt':
                return event.altKey;
            case 'ctrl':
                return event.ctrlKey;
            case 'shift':
                return event.shiftKey;
            case 'meta':
                return event.metaKey;
        }
    }

    private isScalingX() {
        if (this.axes === 'xy') return true;
        return this.shouldFlipXY ? this.axes === 'y' : this.axes === 'x';
    }

    private isScalingY() {
        if (this.axes === 'xy') return true;
        return this.shouldFlipXY ? this.axes === 'x' : this.axes === 'y';
    }

    private getAnchorPointX() {
        return this.shouldFlipXY ? this.anchorPointY : this.anchorPointX;
    }

    private getAnchorPointY() {
        return this.shouldFlipXY ? this.anchorPointX : this.anchorPointY;
    }

    private constrainZoom(newZoom: DefinedZoomState) {
        return this.ctx.zoomManager.constrainZoomToItemCount(newZoom, this.minVisibleItems, this.autoScaler.enabled);
    }

    private previousZoomValid = true;
    private isZoomValid(
        newZoom: DefinedZoomState,
        options?: { directional?: boolean; includeYVisibleRange?: boolean }
    ) {
        const {
            minVisibleItems,
            ctx: { zoomManager },
        } = this;

        if (minVisibleItems === 0) {
            this.previousZoomValid = true;
            return true;
        }

        const zoom = this.getZoom();

        const zoomedInX = round(dx(newZoom)) < round(dx(zoom));
        const zoomedInY = round(dy(newZoom)) < round(dy(zoom));

        // If zooming out, then the new zoom is always considered to be valid.
        if (!zoomedInX && !zoomedInY) {
            this.previousZoomValid = true;
            return true;
        }

        // If zooming in and the previous zoom was invalid, then this zoom must also be invalid, so we can shortcut.
        if (!this.previousZoomValid && options?.directional) {
            return false;
        }

        const includeYVisibleRange = options?.includeYVisibleRange ?? false;
        const autoScaleYAxis = this.autoScaler.enabled;
        const valid = zoomManager.isVisibleItemsCountAtLeast(newZoom, minVisibleItems, {
            includeYVisibleRange,
            autoScaleYAxis,
        });
        this.previousZoomValid = options?.directional ? valid : true;

        return valid;
    }

    private previousAxisZoomValid = {
        [ChartAxisDirection.X]: true,
        [ChartAxisDirection.Y]: true,
    };
    private isAxisZoomValid(
        direction: CartesianAxisDirection,
        axisZoom: ZoomMinMax,
        options?: { directional?: boolean }
    ) {
        const {
            minVisibleItems,
            ctx: { zoomManager },
        } = this;

        const zoom = this.getZoom();

        const deltaAxis = axisZoom.max - axisZoom.min;
        const deltaOld = zoom[direction].max - zoom[direction].min;
        const newZoom = { ...zoom, [direction]: axisZoom };

        // If zooming out, then the new zoom is always considered to be valid.
        if (deltaAxis >= deltaOld) {
            this.previousAxisZoomValid[direction] = true;
            return true;
        }

        // If zooming in and the previous zoom was invalid, then this zoom must also be invalid, so we can shortcut.
        if (!this.previousAxisZoomValid[direction] && options?.directional) {
            return false;
        }

        const opts = { includeYVisibleRange: false, autoScaleYAxis: this.autoScaler.enabled };
        const valid = zoomManager.isVisibleItemsCountAtLeast(newZoom, minVisibleItems, opts);
        this.previousAxisZoomValid[direction] = options?.directional ? valid : true;

        return valid;
    }

    private resetZoom(sourceDetail: _ModuleSupport.ZoomEventSourceDetail) {
        this.previousZoomValid = true;
        this.previousAxisZoomValid = { [ChartAxisDirection.X]: true, [ChartAxisDirection.Y]: true };
        this.ctx.zoomManager.resetZoom({ source: 'user-interaction', sourceDetail });
    }

    public updateSyncZoom(zoom: DefinedZoomState) {
        this.updateZoom({ source: 'sync', sourceDetail: 'internal-updateSyncZoom' }, zoom);
    }

    private updateChanges(sourcing: _ModuleSupport.UpdateZoomSourcing, changes: _ModuleSupport.CoreZoomState) {
        // TODO: constrainZoom should operate on a partial CoreZoomState instead of DefinedZoomState.
        // For compatibility, we calculate the final DefinedZoomState for constrainZoom to continue to work without
        // breaking the behaviour.
        const partialZoom = this.ctx.zoomManager.toZoomState(changes) ?? {};
        const currentZoom = definedZoomState(this.ctx.zoomManager.getZoom());
        this.updateZoom(sourcing, {
            x: partialZoom.x ?? currentZoom.x,
            y: partialZoom.y ?? currentZoom.y,
        });
    }

    private updateZoom(sourcing: _ModuleSupport.UpdateZoomSourcing, zoom: DefinedZoomState) {
        if (this.enableIndependentAxes) {
            this.updatePrimaryAxisZooms(sourcing, zoom);
        } else {
            this.updateUnifiedZoom(sourcing, zoom);
        }
    }

    private updateUnifiedZoom(
        sourcing: _ModuleSupport.UpdateZoomSourcing,
        zoom: DefinedZoomState,
        validOptions?: { directional?: boolean }
    ) {
        zoom = this.constrainZoom(zoom);

        if (!this.isZoomValid(zoom, validOptions)) {
            // Ensure any lingering zoom interaction elements (e.g. selection rect) are cleared
            this.ctx.eventsHub.emit('chart:request-update', {
                type: ChartUpdateType.SCENE_RENDER,
                opts: { skipAnimations: true },
            });
            return false;
        }

        this.ctx.zoomManager.updateZoom(sourcing, zoom);
        return true;
    }

    private updatePrimaryAxisZooms(sourcing: _ModuleSupport.UpdateZoomSourcing, zoom: DefinedZoomState) {
        this.updatePrimaryAxisZoom(sourcing, zoom, ChartAxisDirection.X);
        this.updatePrimaryAxisZoom(sourcing, zoom, ChartAxisDirection.Y);
    }

    private updatePrimaryAxisZoom(
        sourcing: _ModuleSupport.UpdateZoomSourcing,
        zoom: DefinedZoomState,
        direction: CartesianAxisDirection
    ) {
        const axisId = this.ctx.zoomManager.getPrimaryAxisId(direction);
        if (axisId == null) return;
        this.updateAxisZoom(sourcing, axisId, direction, zoom[direction]);
    }

    private updateAxisZoom(
        sourcing: _ModuleSupport.UpdateZoomSourcing,
        axisId: AxisID,
        direction: CartesianAxisDirection,
        axisZoom: ZoomMinMax | undefined,
        validOptions?: { directional?: boolean }
    ) {
        const {
            enableIndependentAxes,
            ctx: { zoomManager },
        } = this;

        if (!axisZoom) return false;

        const zoom = this.getZoom();

        if (enableIndependentAxes !== true) {
            zoom[direction] = axisZoom;
            return this.updateUnifiedZoom(sourcing, zoom, validOptions);
        }

        if (!this.isAxisZoomValid(direction, axisZoom, validOptions)) return false;

        const { source, sourceDetail } = sourcing;
        zoomManager.updateChanges({ source, sourceDetail, changes: { [axisId]: axisZoom }, isReset: false });
        return true;
    }

    private getZoom() {
        return definedZoomState(this.ctx.zoomManager.getZoom());
    }

    private getModuleProperties(overrides?: Partial<ZoomProperties>): ZoomProperties {
        return {
            anchorPointX: overrides?.anchorPointX ?? this.getAnchorPointX(),
            anchorPointY: overrides?.anchorPointY ?? this.getAnchorPointY(),
            enabled: overrides?.enabled ?? this.enabled,
            independentAxes: overrides?.independentAxes ?? this.enableIndependentAxes === true,
            isScalingX: overrides?.isScalingX ?? this.isScalingX(),
            isScalingY: overrides?.isScalingY ?? this.isScalingY(),
            keepAspectRatio: overrides?.keepAspectRatio ?? this.keepAspectRatio,
            scrollingStep: overrides?.scrollingStep ?? this.scrollingStep,
        };
    }
}
