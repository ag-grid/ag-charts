import { type AgZoomAnchorPoint, type AgZoomAxisDraggingMode, _ModuleSupport, _Widget } from 'ag-charts-community';
import { debounce, entries, roundTo } from 'ag-charts-core';

import { ZoomRect } from './scenes/zoomRect';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomContextMenu } from './zoomContextMenu';
import { ZoomDOMProxy } from './zoomDOMProxy';
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
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    isMaxZoom,
    isZoomEqual,
    scaleZoom,
    scaleZoomAxisWithAnchor,
} from './zoomUtils';

const { ActionOnSet, ChartAxisDirection, ChartUpdateType, Property, InteractionState, ProxyProperty } = _ModuleSupport;

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

interface ZoomAutoScale {
    enabled: boolean;
    padding: number;
}

class ZoomAutoScaling extends _ModuleSupport.BaseProperties implements ZoomAutoScale {
    constructor(protected onChange: (opts: ZoomAutoScale) => void) {
        super();
    }

    @Property
    @ActionOnSet<ZoomAutoScaling>({
        changeValue(enabled) {
            this.onChange({ enabled, padding: this.padding });
        },
    })
    enabled = false;

    @Property
    @ActionOnSet<ZoomAutoScaling>({
        changeValue(padding) {
            this.onChange({ enabled: this.enabled, padding });
        },
    })
    padding = 0;
}

export class Zoom extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
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
    public enableAxisScrolling = false;

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
    public readonly autoScaling = new ZoomAutoScaling((newValue) => {
        this.ctx.zoomManager.setAutoScaleYAxis(newValue.enabled, newValue.padding);
    });

    @ActionOnSet<Zoom>({
        changeValue(newValue) {
            if (!this.domProxy) return;
            this.domProxy.setAxisCursor(newValue === 'pan' ? 'grab' : undefined);
        },
    })
    @Property
    public axisDraggingMode: AgZoomAxisDraggingMode = 'zoom';

    private readonly canResetZoom = (zoom?: Readonly<DefinedZoomState>): boolean => {
        zoom ??= this.getZoom();
        return !isZoomEqual(zoom, this.getResetZoom());
    };

    @Property
    public buttons = new ZoomToolbar(
        this.ctx,
        this.getModuleProperties.bind(this),
        this.canResetZoom,
        this.updateZoom.bind(this),
        this.updateAxisZoom.bind(this),
        this.resetZoom.bind(this),
        this.isZoomValid.bind(this)
    );

    // Scenes
    private seriesRect?: _ModuleSupport.BBox;
    private paddedRect?: _ModuleSupport.BBox;

    // Zoom methods
    private readonly axisDragger = new ZoomAxisDragger();
    private readonly contextMenu: ZoomContextMenu;
    private readonly panner = new ZoomPanner();
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();
    private readonly scrollPanner = new ZoomScrollPanner();
    private readonly twoFingers = new ZoomTwoFingers();
    private readonly domProxy: ZoomDOMProxy;

    @ProxyProperty('panner.deceleration')
    @Property
    public deceleration: number | 'off' | 'short' | 'long' = 'short';

    // State
    private dragState = DragState.None;
    private shouldFlipXY?: boolean;
    private readonly isState = (state: _ModuleSupport.InteractionState) => this.ctx.interactionManager.isState(state);

    private destroyContextMenuActions: (() => void) | undefined = undefined;

    private isFirstWheelEvent = true;
    private readonly debouncedWheelReset = debounce(() => {
        this.isFirstWheelEvent = true;
    }, 100);

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect, this.getZoom.bind(this), this.isZoomValid.bind(this));
        this.contextMenu = new ZoomContextMenu(
            ctx.eventsHub,
            ctx.contextMenuRegistry,
            ctx.zoomManager,
            this.getModuleProperties.bind(this),
            this.canResetZoom,
            () => this.paddedRect,
            this.updateZoom.bind(this),
            this.isZoomValid.bind(this)
        );

        this.domProxy = new ZoomDOMProxy({
            onAxisDragStart: (direction) => this.onAxisDragStart(direction),
            onAxisDragMove: (id, direction, event) => this.onAxisDragMove(id, direction, event),
            onAxisDragEnd: () => this.onAxisDragEnd(),
            onAxisDoubleClick: (id) => this.onAxisDoubleClick(id),
            onAxisWheel: (id, direction, event) => this.onAxisWheel(id, direction, event),
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
            ctx.eventsHub.on('series:keynav-zoom', (event) => this.onNavZoom(event)),
            ctx.widgets.seriesWidget.addListener('wheel', (event) => this.onWheel(event)),
            ctx.widgets.seriesWidget.addListener('touchstart', (event, current) => this.onTouchStart(event, current)),
            ctx.widgets.seriesWidget.addListener('touchmove', (event, current) => this.onTouchMove(event, current)),
            ctx.widgets.seriesWidget.addListener('touchend', (event) => this.onTouchEnd(event)),
            ctx.widgets.seriesWidget.addListener('touchcancel', (event) => this.onTouchEnd(event)),
            ctx.updateService.addListener('process-data', (event) => this.onProcessData(event)),
            ctx.eventsHub.on('layout:complete', (event) => this.onLayoutComplete(event)),
            ctx.eventsHub.on('zoom:change', (event) => this.onZoomChange(event)),
            ctx.eventsHub.on('zoom:pan-start', (event) => this.onZoomPanStart(event)),
            this.panner.addListener('update', (event) => this.onPanUpdate(event)),
            () => this.teardown()
        );
    }

    private teardown() {
        this.ctx.zoomManager.setZoomModuleEnabled(false);
        this.buttons.destroy();
        this.destroyContextMenuActions?.();
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
            dragState,
            enabled,
            panner,
            selector,
            ctx: { domManager, interactionManager, tooltipManager },
        } = this;

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!enabled || dragState === DragState.None) return;

        switch (dragState) {
            case DragState.Pan:
                panner.stop();
                break;

            case DragState.Select: {
                if (!selector.didUpdate()) break;
                const zoom = this.getZoom();
                const newZoom = selector.stop(this.seriesRect, this.paddedRect, zoom);
                this.updateZoom(newZoom);
                break;
            }
        }

        this.dragState = DragState.None;
        domManager.updateCursor(CURSOR_ID);
        tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onAxisDoubleClick(id: string) {
        const {
            enabled,
            enableDoubleClickToReset,
            ctx: { zoomManager },
        } = this;
        if (!enabled || !enableDoubleClickToReset || !this.isState(InteractionState.ZoomClickable)) return;

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
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        event: _Widget.DragWidgetEvent<'drag-move'>
    ) {
        const {
            anchorPointX,
            anchorPointY,
            axisDragger,
            dragState,
            enabled,
            seriesRect,
            shouldFlipXY,
            ctx: { interactionManager, tooltipManager, updateService, zoomManager },
        } = this;

        if (!enabled || !seriesRect) return;

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
            zoomManager.setAxisManuallyAdjusted('zoom', axisId);
            this.updateAxisZoom(axisId, direction as _ModuleSupport.CartesianAxisDirection, newZoom);
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
            ctx: { domManager, interactionManager, tooltipManager },
        } = this;

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!enabled || dragState === DragState.None) return;

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
        for (const [axisId, { direction, zoom }] of entries(newZooms)) {
            this.updateAxisZoom(axisId, direction as _ModuleSupport.CartesianAxisDirection, zoom);
        }
    }

    private onWheelScrolling(event: _Widget.WheelWidgetEvent) {
        const zoom = this.getZoom();
        const isZoomCapped = event.deltaY > 0 && isMaxZoom(zoom);

        this.handleWheelScrolling(event, isZoomCapped);
    }

    private onAxisWheel(
        axisId: string,
        axisDirection: _ModuleSupport.ChartAxisDirection,
        event: _ModuleSupport.WheelWidgetEvent
    ) {
        const {
            enableAxisScrolling,
            ctx: { zoomManager },
        } = this;
        if (!enableAxisScrolling) return;
        if (axisDirection !== ChartAxisDirection.X && axisDirection !== ChartAxisDirection.Y) {
            return;
        }

        const isScalingX = axisDirection === ChartAxisDirection.X;
        const isScalingY = !isScalingX;

        const props = this.getModuleProperties({ isScalingX, isScalingY });

        const zoom = this.getZoom();
        const isZoomCapped =
            event.deltaY > 0 && zoom[axisDirection].min === UNIT_MIN && zoom[axisDirection].max === UNIT_MAX;

        zoomManager.setAxisManuallyAdjusted('zoom', axisId);

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
            for (const [axisId, { direction, zoom: axisZoom }] of entries(newZooms)) {
                updated &&= this.updateAxisZoom(axisId, direction as _ModuleSupport.CartesianAxisDirection, axisZoom);
            }
        } else {
            const newZoom = scroller.update(event, props, seriesRect, this.getZoom());
            if (newZoom == null) return;
            updated = this.updateUnifiedZoom(newZoom);
        }

        isZoomCapped ||= event.deltaY < 0 && !updated;

        if (!this.isFirstWheelEvent || !isZoomCapped) {
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
        this.domProxy.update(this.enableAxisDragging, this.enableAxisScrolling, this.ctx);

        if (!this.enabled) return;

        this.seriesRect = event.series.rect;
        this.paddedRect = event.series.paddedRect;

        if (this.enableAxisDragging) {
            this.toggleAxisDraggingCursors();
        }
    }

    private onZoomChange(event: _ModuleSupport.ZoomChangeEvent) {
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

        for (const [axisId, { direction, zoom }] of entries(newZooms)) {
            this.updateAxisZoom(axisId, direction as _ModuleSupport.CartesianAxisDirection, zoom);
        }

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

    private isZoomValid(newZoom: DefinedZoomState) {
        const {
            minVisibleItems,
            ctx: { zoomManager },
        } = this;

        if (minVisibleItems === 0) return true;

        const zoom = this.getZoom();

        const zoomedInX = round(dx(newZoom)) < round(dx(zoom));
        const zoomedInY = round(dy(newZoom)) < round(dy(zoom));
        if (!zoomedInX && !zoomedInY) return true;

        return zoomManager.isVisibleItemsCountAtLeast(newZoom, minVisibleItems);
    }

    private isAxisZoomValid(direction: _ModuleSupport.CartesianAxisDirection, axisZoom: _ModuleSupport.ZoomState) {
        const {
            minVisibleItems,
            ctx: { zoomManager },
        } = this;

        const zoom = this.getZoom();

        const deltaAxis = axisZoom.max - axisZoom.min;
        const deltaOld = zoom[direction].max - zoom[direction].min;
        const newZoom = { ...zoom, [direction]: axisZoom };

        return deltaAxis >= deltaOld || zoomManager.isVisibleItemsCountAtLeast(newZoom, minVisibleItems);
    }

    private resetZoom() {
        this.ctx.zoomManager.resetZoom('zoom');
    }

    public updateSyncZoom(zoom: DefinedZoomState) {
        this.updateZoom(zoom);
    }

    private updateZoom(zoom: DefinedZoomState) {
        if (this.enableIndependentAxes) {
            this.updatePrimaryAxisZooms(zoom);
        } else {
            this.updateUnifiedZoom(zoom);
        }
    }

    private updateUnifiedZoom(zoom: DefinedZoomState) {
        if (!this.isZoomValid(zoom)) {
            // Ensure any lingering zoom interation elements (e.g. selection rect) are cleared
            this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER, { skipAnimations: true });
            return false;
        }

        this.ctx.zoomManager.updateZoom('zoom', zoom);
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
        axisId: string,
        direction: _ModuleSupport.CartesianAxisDirection,
        axisZoom: _ModuleSupport.ZoomState | undefined
    ) {
        const {
            enableIndependentAxes,
            ctx: { zoomManager },
        } = this;

        if (!axisZoom) return false;

        const zoom = this.getZoom();

        if (enableIndependentAxes !== true) {
            zoom[direction] = axisZoom;
            return this.updateUnifiedZoom(zoom);
        }

        if (!this.isAxisZoomValid(direction, axisZoom)) return false;

        zoomManager.updateAxisZoom('zoom', axisId, axisZoom);
        return true;
    }

    private toggleAxisDraggingCursors() {
        const { anchorPointX, anchorPointY, domProxy } = this;

        const zoom = this.getZoom();

        let showCursorX = dx(zoom) !== UNIT_SIZE;
        let showCursorY = dy(zoom) !== UNIT_SIZE;

        if (!showCursorX) {
            const checkZoomX = scaleZoom(zoom, 0.999, 1);
            checkZoomX.x = scaleZoomAxisWithAnchor(checkZoomX.x, zoom.x, anchorPointX);
            showCursorX = this.isZoomValid(checkZoomX);
        }

        if (!showCursorY) {
            const checkZoomY = scaleZoom(zoom, 1, 0.999);
            checkZoomY.y = scaleZoomAxisWithAnchor(checkZoomY.y, zoom.y, anchorPointY);
            showCursorY = this.isZoomValid(checkZoomY);
        }

        domProxy.toggleAxisDraggingCursor(ChartAxisDirection.X, showCursorX);
        domProxy.toggleAxisDraggingCursor(ChartAxisDirection.Y, showCursorY);
    }

    private getZoom() {
        return definedZoomState(this.ctx.zoomManager.getZoom());
    }

    private getResetZoom() {
        return definedZoomState(this.ctx.zoomManager.getRestoredZoom());
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
