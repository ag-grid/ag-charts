import { _ModuleSupport, _Widget } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ActionOnSet,
    type AxisID,
    Property,
    ProxyProperty,
    debounce,
    entries,
    roundTo,
} from 'ag-charts-core';
import type { AgZoomAnchorPoint, AgZoomAxisDraggingMode } from 'ag-charts-types';

import { ZoomRect } from './scenes/zoomRect';
import { ZoomAutoScaler, ZoomAutoScalingProperties } from './zoomAutoScale';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomContextMenu } from './zoomContextMenu';
import { ZoomDOMProxy } from './zoomDOMProxy';
import { ZoomOnDataChange, ZoomOnDataChangeProperties } from './zoomOnDataChange';
import { type ZoomPanUpdate, ZoomPanner } from './zoomPanner';
import { ZoomScrollPanner } from './zoomScrollPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import { ZoomToolbar } from './zoomToolbar';
import { ZoomTwoFingers } from './zoomTwoFingers';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT_MAX,
    UNIT_MIN,
    UNIT_SIZE,
    ZOOM_VALID_CHECK_DEBOUNCE,
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    isMaxZoom,
    scaleZoom,
    scaleZoomAxisWithAnchor,
} from './zoomUtils';

const { ChartAxisDirection, ChartUpdateType, InteractionState } = _ModuleSupport;
type SeriesAreaHoverEvent = _ModuleSupport.SeriesAreaHoverEvent;
type SeriesAreaClickEvent = _ModuleSupport.SeriesAreaClickEvent;

type AxisHit = { axisId: AxisID; direction: _ModuleSupport.ChartAxisDirection };

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

    @ActionOnSet<Zoom>({
        changeValue(newValue) {
            this.updateAxisCursor({ enableAxisDragging: newValue });
        },
    })
    @Property
    public enableAxisDragging = true;

    @ActionOnSet<Zoom>({
        changeValue(newValue) {
            this.updateAxisCursor({ enableAxisScrolling: newValue });
        },
    })
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
    public readonly autoScaling: ZoomAutoScalingProperties = new ZoomAutoScalingProperties((opts) => {
        this.autoScaler?.onChange(opts);
    });

    @ActionOnSet<Zoom>({
        changeValue(newValue) {
            this.updateAxisCursor({ axisDraggingMode: newValue });
        },
    })
    @Property
    public axisDraggingMode: AgZoomAxisDraggingMode = 'zoom';

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
    private readonly dataChangeHandler = new ZoomOnDataChange(this.onDataChange);
    private readonly panner = new ZoomPanner();
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();
    private readonly scrollPanner = new ZoomScrollPanner();
    private readonly twoFingers = new ZoomTwoFingers();
    private readonly domProxy: ZoomDOMProxy;

    private activeAxis?: AxisHit;

    @ProxyProperty('panner.deceleration')
    @Property
    public deceleration: number | 'off' | 'short' | 'long' = 'short';

    // State
    private dragState = DragState.None;
    private shouldFlipXY?: boolean;
    private readonly isState = (state: _ModuleSupport.InteractionState) => this.ctx.interactionManager.isState(state);

    private destroyContextMenuActions: (() => void) | undefined = undefined;

    private isSyncing = false;
    private isFirstWheelEvent = true;
    private wasFirstWheelEventZoomCapped?: boolean;
    private firstWheelEventDirection?: boolean;
    private readonly debouncedWheelReset = debounce(() => {
        this.isFirstWheelEvent = true;
        this.wasFirstWheelEventZoomCapped = undefined;
    }, 100);

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.autoScaler = new ZoomAutoScaler(this.autoScaling, ctx.zoomManager, this, ctx.eventsHub, this.cleanup);
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

        this.domProxy = new ZoomDOMProxy({
            onAxisDragStart: (direction) => this.onAxisDragStart(direction),
            onAxisDragMove: (id, direction, event) => this.onAxisDragMove(id, direction, event),
            onAxisDragEnd: () => this.onAxisDragEnd(),
            onAxisDoubleClick: (id) => this.onAxisDoubleClick(id),
            onAxisWheel: (direction, event) => this.onAxisWheel(direction, event),
        });

        if (ctx.widgets.seriesDragInterpreter) {
            this.cleanup.register(
                ctx.widgets.seriesDragInterpreter.events.on('dblclick', (event) => this.onSeriesAreaDoubleClick(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-move', (event) => this.onSeriesAreaDragMove(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-start', (event) => this.onSeriesAreaDragStart(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-end', () => this.onSeriesAreaDragEnd())
            );
        }
        this.cleanup.register(
            ctx.scene.attachNode(selectionRect),
            ctx.eventsHub.on('series-area:hover', (event) => this.onSeriesAreaHoverEvent(event)),
            ctx.eventsHub.on('series-area:click', (event) => this.onSeriesAreaClickEvent(event)),
            ctx.eventsHub.on('series:keynav-zoom', (event) => this.onNavZoom(event)),
            ctx.widgets.seriesWidget.addListener('wheel', (event) => this.onWheel(event)),
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
    }

    private teardown() {
        this.ctx.zoomManager.setZoomModuleEnabled(false);
        this.buttons.destroy();
        this.destroyContextMenuActions?.();
        this.domProxy.destroy();
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

        this.resetZoom();
    }

    private onSeriesAreaHoverEvent(event: SeriesAreaHoverEvent) {
        if (!this.shouldHandleAxisHover(event)) {
            this.clearHoveredAxis();
            return;
        }

        const axis = this.domProxy.pickAxisAtPoint(event.x, event.y);
        if (axis) {
            this.domProxy.setHoveredAxis(axis.axisId);
            this.ctx.domManager.updateCursor(CURSOR_ID, this.domProxy.getCursor(axis.direction));
        } else {
            this.clearHoveredAxis();
        }
    }

    private onSeriesAreaClickEvent(event: SeriesAreaClickEvent) {
        if (!this.shouldHandleAxisClick(event)) return;

        const axis = this.domProxy.pickAxisAtPoint(event.x, event.y);
        if (axis && event.sourceEvent?.type === 'dblclick') {
            this.onAxisDoubleClick(axis.axisId);
        }
    }

    private shouldHandleAxisHover(event: SeriesAreaHoverEvent): boolean {
        const { enabled, enableAxisDragging, enableAxisScrolling, dragState } = this;

        return (
            enabled &&
            (enableAxisDragging || enableAxisScrolling) &&
            !event.consumed &&
            !this.activeAxis &&
            dragState === DragState.None &&
            this.domProxy.hasOverlappingAxes()
        );
    }

    private shouldHandleAxisClick(event: SeriesAreaClickEvent): boolean {
        const { enabled, enableAxisDragging, enableAxisScrolling, enableDoubleClickToReset } = this;

        return (
            enabled &&
            !this.activeAxis &&
            !event.consumed &&
            (enableAxisDragging || enableAxisScrolling || enableDoubleClickToReset)
        );
    }

    private clearHoveredAxis() {
        if (this.activeAxis) return;
        this.domProxy.clearHoveredAxis();
        if (this.dragState === DragState.None) {
            this.ctx.domManager.updateCursor(CURSOR_ID);
        }
    }

    private tryBeginAxisDelegation(event: _Widget.DragWidgetEvent<'drag-start'>): boolean {
        const hoveredAxis = this.domProxy.getHoveredAxis();

        if (!this.enabled || !this.enableAxisDragging || !hoveredAxis) {
            return false;
        }

        if (!this.domProxy.beginDelegatedAxisDrag(hoveredAxis.axisId)) {
            return false;
        }

        this.activeAxis = hoveredAxis;
        this.onAxisDragStart(hoveredAxis.direction);

        const cursor = this.dragState === DragState.Pan ? 'grabbing' : this.domProxy.getCursor(hoveredAxis.direction);
        this.ctx.domManager.updateCursor(CURSOR_ID, cursor);

        if (event.device === 'touch') {
            event.sourceEvent.preventDefault();
        }

        return true;
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

        if (this.tryBeginAxisDelegation(event)) {
            return;
        }

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
            ctx: { interactionManager, tooltipManager, updateService },
        } = this;

        if (this.activeAxis) {
            this.onAxisDragMove(this.activeAxis.axisId, this.activeAxis.direction, event);
            return;
        }

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
        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onSeriesAreaDragEnd() {
        const {
            ctx: { interactionManager },
        } = this;

        if (this.activeAxis) {
            this.handleAxisDragEnd();
            return;
        }

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        if (!this.enabled || this.dragState === DragState.None) return;

        this.handleRegularDragEnd();
        this.resetDragState();
    }

    private handleAxisDragEnd(): void {
        this.onAxisDragEnd();
        this.domProxy.endDelegatedAxisDrag(this.activeAxis!.axisId);
        this.activeAxis = undefined;
        this.clearHoveredAxis();
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
                    this.updateZoom(newZoom);
                }
                break;
        }
    }

    private resetDragState(): void {
        this.dragState = DragState.None;
        this.ctx.domManager.updateCursor(CURSOR_ID);
        this.ctx.tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onAxisDoubleClick(id: AxisID) {
        const {
            enabled,
            enableDoubleClickToReset,
            ctx: { zoomManager },
        } = this;
        if (!enabled || !enableDoubleClickToReset || !this.isState(InteractionState.ZoomClickable)) return;

        this.previousAxisZoomValid = { [ChartAxisDirection.X]: true, [ChartAxisDirection.Y]: true };
        zoomManager.resetAxisZoom('zoom', id);
    }

    private onAxisDragStart(direction: _ModuleSupport.ChartAxisDirection) {
        const {
            axisDraggingMode,
            domProxy,
            enabled,
            enableAxisDragging,
            panner,
            ctx: { zoomManager },
        } = this;
        if (!enabled || !enableAxisDragging) return;

        panner.stopInteractions();

        if (axisDraggingMode === 'pan') {
            domProxy.setAxisCursor('grabbing');

            this.dragState = DragState.Pan;
            this.panner.start(direction);

            zoomManager.fireZoomPanStartEvent('zoom');
        } else {
            this.dragState = DragState.Axis;
        }
    }

    private onAxisDragMove(
        axisId: AxisID,
        direction: _ModuleSupport.ChartAxisDirection,
        event: _Widget.DragWidgetEvent<'drag-move'>
    ) {
        const {
            anchorPointX,
            anchorPointY,
            axisDragger,
            dragState,
            enabled,
            enableAxisDragging,
            seriesRect,
            shouldFlipXY,
            ctx: { interactionManager, tooltipManager, updateService, zoomManager },
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
            this.updateAxisZoom(axisId, direction as _ModuleSupport.CartesianAxisDirection, newZoom, {
                directional: true,
            });
        }

        tooltipManager.updateTooltip(TOOLTIP_ID);
        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onAxisDragEnd() {
        const {
            axisDraggingMode,
            axisDragger,
            dragState,
            domProxy,
            enabled,
            enableAxisDragging,
            ctx: { domManager, interactionManager, tooltipManager },
        } = this;

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!enabled || !enableAxisDragging || dragState === DragState.None) return;

        this.dragState = DragState.None;

        if (axisDraggingMode === 'pan') {
            domProxy.setAxisCursor('grab');
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

        this.updateZoom(scroller.updateDelta(event.delta, this.getModuleProperties(), this.getZoom()));
    }

    private onWheel(event: _Widget.WheelWidgetEvent) {
        const { enabled, enablePanning, enableScrolling, paddedRect } = this;

        if (!enabled || !enableScrolling || !paddedRect || !this.isState(InteractionState.ZoomWheelable)) return;

        const { deltaX, deltaY } = event.sourceEvent;
        const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);

        if (enablePanning && isHorizontalScrolling) {
            this.onWheelPanning(event);
        } else {
            this.onWheelScrolling(event);
        }
    }

    private onWheelPanning(event: _Widget.WheelWidgetEvent) {
        const {
            scrollingStep,
            scrollPanner,
            seriesRect,
            ctx: { zoomManager },
        } = this;

        if (!seriesRect) return;

        event.sourceEvent.preventDefault();

        const newZooms = scrollPanner.update(event, scrollingStep, seriesRect, zoomManager.getAxisZooms());
        this.updateChanges(newZooms);
    }

    private onWheelScrolling(event: _Widget.WheelWidgetEvent) {
        const zoom = this.getZoom();
        const isZoomCapped = event.deltaY > 0 && isMaxZoom(zoom);

        this.handleWheelScrolling(event, isZoomCapped);
    }

    private onAxisWheel(axisDirection: _ModuleSupport.ChartAxisDirection, event: _ModuleSupport.WheelWidgetEvent) {
        if (!this.enableAxisScrolling) return;
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
        this.handleWheelScrolling(event, isZoomCapped, props);
    }

    private handleWheelScrolling(
        event: _ModuleSupport.WheelWidgetEvent,
        isZoomCapped: boolean,
        props: ZoomProperties = this.getModuleProperties()
    ) {
        const {
            enableIndependentAxes,
            scroller,
            seriesRect,
            ctx: { zoomManager },
        } = this;

        if (!seriesRect) return;

        let updated = true;

        if (enableIndependentAxes === true) {
            const newZooms = scroller.updateAxes(event, props, seriesRect, zoomManager.getAxisZooms());
            for (const [axisId, { direction, min, max }] of entries(newZooms)) {
                const constrainedZoom =
                    direction === ChartAxisDirection.X
                        ? this.constrainZoom({ x: { min, max }, y: { min: UNIT_MAX, max: UNIT_MAX } }).x
                        : { min, max };
                updated &&= this.updateAxisZoom(axisId, direction, constrainedZoom);
            }
        } else {
            const newZoom = scroller.update(event, props, seriesRect, this.getZoom());
            if (newZoom == null) return;
            updated = this.updateUnifiedZoom(newZoom, { directional: true });
        }

        isZoomCapped ||= event.deltaY < 0 && !updated;

        // Prevent browser scrolling when the user scrolls over the chart and zooming is possible. If the scroll
        // direction changes, treat it as a new scroll event.
        if (this.firstWheelEventDirection != null && this.firstWheelEventDirection !== event.deltaY < 0) {
            this.isFirstWheelEvent = true;
        }

        if (this.isFirstWheelEvent) {
            this.wasFirstWheelEventZoomCapped = isZoomCapped;
            this.firstWheelEventDirection = event.deltaY < 0;
            if (!isZoomCapped) {
                event.sourceEvent.preventDefault();
            }
        } else if (this.wasFirstWheelEventZoomCapped === false) {
            event.sourceEvent.preventDefault();
        }

        // Prevent browser scrolling when smooth wheel events continue being fired after the chart
        // reaches a min or max extent
        this.isFirstWheelEvent = false;
        this.debouncedWheelReset();
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
        this.updateZoom(constrainZoom(newZoom));
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
        this.domProxy.update(
            this.enabled,
            this.enableAxisDragging,
            this.enableAxisScrolling,
            this.ctx,
            event.series.rect
        );

        if (!this.enabled) return;

        this.seriesRect = event.series.rect;
        this.paddedRect = event.series.paddedRect;

        if (this.enableAxisDragging) {
            this.toggleAxisDraggingCursorsDebounced();
        }
    }

    private onZoomChangeRequested(event: _ModuleSupport.ZoomChangeRequestEvent) {
        if (event.callerId !== 'zoom') {
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
        this.updateChanges(newZooms);
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
        [_ModuleSupport.ChartAxisDirection.X]: true,
        [_ModuleSupport.ChartAxisDirection.Y]: true,
    };
    private isAxisZoomValid(
        direction: _ModuleSupport.CartesianAxisDirection,
        axisZoom: _ModuleSupport.ZoomState,
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

    private resetZoom() {
        this.previousZoomValid = true;
        this.previousAxisZoomValid = { [ChartAxisDirection.X]: true, [ChartAxisDirection.Y]: true };
        this.ctx.zoomManager.resetZoom('zoom');
    }

    public updateSyncZoom(zoom: DefinedZoomState) {
        this.isSyncing = true;
        this.updateZoom(zoom);
        this.isSyncing = false;
    }

    private updateChanges(changes: _ModuleSupport.CoreZoomState) {
        // TODO: constrainZoom should operate on a partial CoreZoomState instead of DefinedZoomState.
        // For compatibility, we calculate the final DefinedZoomState for constrainZoom to continue to work without
        // breaking thebehaviour.
        const partialZoom = this.ctx.zoomManager.toAxisZoomState(changes) ?? {};
        const currentZoom = definedZoomState(this.ctx.zoomManager.getZoom());
        this.updateZoom({
            x: partialZoom.x ?? currentZoom.x,
            y: partialZoom.y ?? currentZoom.y,
        });
    }

    private updateZoom(zoom: DefinedZoomState) {
        if (this.enableIndependentAxes) {
            this.updatePrimaryAxisZooms(zoom);
        } else {
            this.updateUnifiedZoom(zoom);
        }
    }

    private updateUnifiedZoom(zoom: DefinedZoomState, validOptions?: { directional?: boolean }) {
        zoom = this.constrainZoom(zoom);

        if (!this.isZoomValid(zoom, validOptions)) {
            // Ensure any lingering zoom interation elements (e.g. selection rect) are cleared
            this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER, { skipAnimations: true });
            return false;
        }

        if (this.isSyncing) {
            this.ctx.zoomManager.syncZoom('zoom', zoom);
        } else {
            this.ctx.zoomManager.updateZoom('zoom', zoom);
        }
        return true;
    }

    private updatePrimaryAxisZooms(zoom: DefinedZoomState) {
        this.updatePrimaryAxisZoom(zoom, ChartAxisDirection.X);
        this.updatePrimaryAxisZoom(zoom, ChartAxisDirection.Y);
    }

    private updatePrimaryAxisZoom(zoom: DefinedZoomState, direction: _ModuleSupport.CartesianAxisDirection) {
        const axisId = this.ctx.zoomManager.getPrimaryAxisId(direction);
        if (axisId == null) return;
        this.updateAxisZoom(axisId, direction, zoom[direction]);
    }

    private updateAxisZoom(
        axisId: AxisID,
        direction: _ModuleSupport.CartesianAxisDirection,
        axisZoom: _ModuleSupport.ZoomState | undefined,
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
            return this.updateUnifiedZoom(zoom, validOptions);
        }

        if (!this.isAxisZoomValid(direction, axisZoom, validOptions)) return false;

        if (this.isSyncing) {
            zoomManager.syncAxisZoom('zoom', axisId, axisZoom);
        } else {
            zoomManager.updateAxisZoom('zoom', axisId, axisZoom);
        }
        return true;
    }

    private updateAxisCursor(
        opts: Partial<Pick<Zoom, 'enableAxisDragging' | 'enableAxisScrolling' | 'axisDraggingMode'>>
    ) {
        if (!this.domProxy) return;
        const {
            enableAxisDragging = this.enableAxisDragging,
            enableAxisScrolling = this.enableAxisScrolling,
            axisDraggingMode = this.axisDraggingMode,
        } = opts;
        if (enableAxisDragging) {
            this.domProxy.setAxisCursor(axisDraggingMode === 'pan' ? 'grab' : undefined);
        } else if (enableAxisScrolling) {
            this.domProxy.setAxisCursor('default');
        } else {
            this.domProxy.setAxisCursor(undefined);
        }
    }

    private readonly toggleAxisDraggingCursorsDebounced = debounce(
        this.toggleAxisDraggingCursors.bind(this),
        ZOOM_VALID_CHECK_DEBOUNCE,
        {
            leading: true,
            trailing: true,
        }
    );
    private toggleAxisDraggingCursors() {
        const { anchorPointX, anchorPointY, domProxy } = this;

        const zoom = this.getZoom();

        let showCursorX = dx(zoom) !== UNIT_SIZE;
        let showCursorY = dy(zoom) !== UNIT_SIZE;

        if (!showCursorX) {
            const checkZoomX = scaleZoom(zoom, 0.999, 1);
            checkZoomX.x = scaleZoomAxisWithAnchor(checkZoomX.x, zoom.x, anchorPointX);
            showCursorX = this.isZoomValid(checkZoomX, { includeYVisibleRange: true });
        }

        if (!showCursorY) {
            const checkZoomY = scaleZoom(zoom, 1, 0.999);
            checkZoomY.y = scaleZoomAxisWithAnchor(checkZoomY.y, zoom.y, anchorPointY);
            showCursorY = this.isZoomValid(checkZoomY, { includeYVisibleRange: true });
        }

        domProxy.toggleAxisDraggingCursor(ChartAxisDirection.X, showCursorX);
        domProxy.toggleAxisDraggingCursor(ChartAxisDirection.Y, showCursorY);
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
