import type { AgZoomAnchorPoint, _Scene } from 'ag-charts-community';
import { _ModuleSupport, _Util } from 'ag-charts-community';

import { ZoomRect } from './scenes/zoomRect';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomPanUpdate, ZoomPanner } from './zoomPanner';
import { ZoomRange } from './zoomRange';
import { ZoomRatio } from './zoomRatio';
import { ZoomScrollPanner } from './zoomScrollPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import type { DefinedZoomState } from './zoomTypes';
import {
    UNIT,
    constrainAxisWithOld,
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    isZoomEqual,
    pointToRatio,
    scaleZoom,
    scaleZoomAxisWithAnchor,
    scaleZoomAxisWithPoint,
    scaleZoomCenter,
    translateZoom,
    unitZoomState,
} from './zoomUtils';

type PinchEvent = _ModuleSupport.PinchEvent;
type ContextMenuActionParams = _ModuleSupport.ContextMenuActionParams;

const {
    BOOLEAN,
    NUMBER,
    RATIO,
    UNION,
    ActionOnSet,
    ChartAxisDirection,
    ChartUpdateType,
    ToolbarManager,
    Validate,
    ProxyProperty,
    round: sharedRound,
} = _ModuleSupport;

const round = (value: number) => sharedRound(value, 10);

const ANCHOR_POINT = UNION(['pointer', 'start', 'middle', 'end'], 'an anchor cord');

const CONTEXT_ZOOM_ACTION_ID = 'zoom-action';
const CONTEXT_PAN_ACTION_ID = 'pan-action';
const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';

const DEFAULT_ANCHOR_POINT_X: AgZoomAnchorPoint = 'end';
const DEFAULT_ANCHOR_POINT_Y: AgZoomAnchorPoint = 'middle';

enum DragState {
    None,
    Axis,
    Pan,
    Select,
}

export class Zoom extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<Zoom>({
        newValue(enabled) {
            const {
                ctx: { toolbarManager, zoomManager },
            } = this;

            toolbarManager?.toggleGroup('ranges', Boolean(enabled));
            toolbarManager?.toggleGroup('zoom', Boolean(enabled));
            if (enabled) {
                this.registerContextMenuActions();
                this.toggleToolbarButtons(definedZoomState(zoomManager?.getZoom()));
            }
        },
    })
    @Validate(BOOLEAN)
    public enabled = false;

    @Validate(BOOLEAN)
    public enableAxisDragging = true;

    @Validate(BOOLEAN)
    public enableDoubleClickToReset = true;

    @Validate(BOOLEAN)
    public enablePanning = true;

    @Validate(BOOLEAN)
    public enableScrolling = true;

    @Validate(BOOLEAN)
    public enableSelecting = false;

    @Validate(UNION(['alt', 'ctrl', 'meta', 'shift'], 'a pan key'))
    public panKey: 'alt' | 'ctrl' | 'meta' | 'shift' = 'alt';

    @Validate(UNION(['x', 'y', 'xy'], 'an axis'))
    public axes: 'x' | 'y' | 'xy' = 'x';

    @Validate(RATIO)
    public scrollingStep = (UNIT.max - UNIT.min) / 10;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsX = 2;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsY = 2;

    @Validate(ANCHOR_POINT)
    public anchorPointX: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_X;

    @Validate(ANCHOR_POINT)
    public anchorPointY: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_Y;

    public rangeX = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection.X));
    public rangeY = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection.Y));

    public ratioX = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection.X));
    public ratioY = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection.Y));

    // Scenes
    private seriesRect?: _Scene.BBox;
    private paddedRect?: _Scene.BBox;

    // Zoom methods
    private readonly axisDragger = new ZoomAxisDragger();
    private readonly panner = new ZoomPanner();
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();
    private readonly scrollPanner = new ZoomScrollPanner();

    // State
    private dragState = DragState.None;
    private hoveredAxis?: { id: string; direction: _ModuleSupport.ChartAxisDirection };
    private shouldFlipXY?: boolean;
    private minRatioX = 0;
    private minRatioY = 0;

    // TODO: This will become an option soon, and I don't want to delete my code in the meantime
    private enableSecondaryAxis = false;

    @ProxyProperty('panner.deceleration')
    @Validate(NUMBER.restrict({ min: 0.0001, max: 1 }))
    deceleration: number = 1;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        // Add selection zoom method and attach selection rect to root scene
        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect);

        const { Default, ZoomDrag, Animation } = _ModuleSupport.InteractionState;
        const draggableState = Default | Animation | ZoomDrag;
        const clickableState = Default | Animation;
        const region = ctx.regionManager.getRegion('series');
        this.destroyFns.push(
            ctx.scene.attachNode(selectionRect),
            region.addListener('dblclick', (event) => this.onDoubleClick(event), clickableState),
            region.addListener('drag', (event) => this.onDrag(event), draggableState),
            region.addListener('drag-start', (event) => this.onDragStart(event), draggableState),
            region.addListener('drag-end', () => this.onDragEnd(), draggableState),
            region.addListener('wheel', (event) => this.onWheel(event), clickableState),
            region.addListener('hover', () => this.onAxisLeave(), clickableState),
            region.addListener('leave', () => this.onAxisLeave(), clickableState),
            ctx.chartEventManager.addListener('axis-hover', (event) => this.onAxisHover(event)),
            ctx.gestureDetector.addListener('pinch-move', (event) => this.onPinchMove(event as PinchEvent)),
            ctx.toolbarManager.addListener('button-pressed', (event) => this.onToolbarButtonPress(event)),
            ctx.layoutService.addListener('layout-complete', (event) => this.onLayoutComplete(event)),
            ctx.updateService.addListener('update-complete', (event) => this.onUpdateComplete(event)),
            ctx.zoomManager.addListener('zoom-change', (e) => this.onZoomChange(e)),
            ctx.zoomManager.addListener('zoom-pan-start', (e) => this.onZoomPanStart(e)),
            this.panner.addListener('update', (event) => this.onPanUpdate(event))
        );
    }

    private registerContextMenuActions() {
        const {
            ctx: { contextMenuRegistry },
        } = this;

        // Add context menu zoom actions
        contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_ZOOM_ACTION_ID,
            label: 'Zoom to here',
            action: (params) => this.onContextMenuZoomToHere(params),
        });
        contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_PAN_ACTION_ID,
            label: 'Pan to here',
            action: (params) => this.onContextMenuPanToHere(params),
        });

        const zoom = this.getZoom();
        this.toggleContextMenuActions(zoom);
    }

    private toggleContextMenuActions(zoom: DefinedZoomState) {
        const {
            ctx: { contextMenuRegistry },
        } = this;

        if (this.isMinZoom(zoom)) {
            contextMenuRegistry.disableAction(CONTEXT_ZOOM_ACTION_ID);
        } else {
            contextMenuRegistry.enableAction(CONTEXT_ZOOM_ACTION_ID);
        }

        if (this.isMaxZoom(zoom)) {
            contextMenuRegistry.disableAction(CONTEXT_PAN_ACTION_ID);
        } else {
            contextMenuRegistry.enableAction(CONTEXT_PAN_ACTION_ID);
        }
    }

    private toggleToolbarButtons(zoom: DefinedZoomState) {
        const {
            ctx: { toolbarManager },
        } = this;

        const isMaxZoom = this.isMaxZoom(zoom);
        const isMinZoom = this.isMinZoom(zoom);
        const isResetZoom = isZoomEqual(zoom, this.getResetZoom());

        toolbarManager.toggleButton('zoom', 'pan-start', zoom.x.min > UNIT.min);
        toolbarManager.toggleButton('zoom', 'pan-end', zoom.x.max < UNIT.max);
        toolbarManager.toggleButton('zoom', 'pan-left', zoom.x.min > UNIT.min);
        toolbarManager.toggleButton('zoom', 'pan-right', zoom.x.max < UNIT.max);
        toolbarManager.toggleButton('zoom', 'zoom-out', !isMaxZoom);
        toolbarManager.toggleButton('zoom', 'zoom-in', !isMinZoom);
        toolbarManager.toggleButton('zoom', 'reset-zoom', !isResetZoom);
    }

    private onRangeChange(direction: _ModuleSupport.ChartAxisDirection, rangeZoom?: DefinedZoomState['x' | 'y']) {
        if (!rangeZoom) return;

        const zoom = this.getZoom();
        zoom[direction] = rangeZoom;
        this.updateZoom(constrainZoom(zoom));
    }

    private onRatioChange(direction: _ModuleSupport.ChartAxisDirection, ratioZoom?: DefinedZoomState['x' | 'y']) {
        if (!ratioZoom) return;

        let x = this.ratioX.getRatio();
        let y = this.ratioY.getRatio();

        if (direction === ChartAxisDirection.X) {
            x = ratioZoom;
        } else {
            y = ratioZoom;
        }

        const newZoom = constrainZoom(definedZoomState({ x, y }));
        this.updateZoom(newZoom);
    }

    private onDoubleClick(event: _ModuleSupport.PointerInteractionEvent<'dblclick'>) {
        const {
            enabled,
            enableDoubleClickToReset,
            hoveredAxis,
            paddedRect,
            ctx: { highlightManager },
        } = this;

        if (!enabled || !enableDoubleClickToReset) return;

        const { x, y } = this.getResetZoom();

        if (hoveredAxis) {
            const { id, direction } = hoveredAxis;
            const axisZoom = direction === ChartAxisDirection.X ? x : y;
            this.updateAxisZoom(id, direction, axisZoom);
        } else if (
            paddedRect?.containsPoint(event.offsetX, event.offsetY) &&
            highlightManager.getActivePicked() == null
        ) {
            this.updateZoom({ x, y });
        }
    }

    private onDragStart(event: _ModuleSupport.PointerInteractionEvent<'drag-start'>) {
        const {
            enabled,
            enableAxisDragging,
            enablePanning,
            enableSelecting,
            hoveredAxis,
            paddedRect,
            ctx: { cursorManager, zoomManager },
        } = this;

        if (!enabled || !paddedRect) return;

        this.panner.stopInteractions();

        // Determine which ZoomDrag behaviour to use.
        let newDragState = DragState.None;

        if (enableAxisDragging && hoveredAxis) {
            newDragState = DragState.Axis;
        } else if (paddedRect.containsPoint(event.offsetX, event.offsetY)) {
            const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent as DragEvent);
            // Allow panning if either selection is disabled or the panning key is pressed.
            if (enablePanning && (!enableSelecting || panKeyPressed)) {
                cursorManager.updateCursor(CURSOR_ID, 'grabbing');
                newDragState = DragState.Pan;
                this.panner.start();
            } else if (enableSelecting) {
                const fullyZoomedIn = this.isMinZoom(this.getZoom());
                // Do not allow selection if fully zoomed in or when the pankey is pressed
                if (!fullyZoomedIn && !panKeyPressed) {
                    newDragState = DragState.Select;
                }
            }
        }

        if ((this.dragState = newDragState) !== DragState.None) {
            zoomManager.fireZoomPanStartEvent('zoom');
        }
    }

    private onDrag(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        const {
            anchorPointX,
            anchorPointY,
            axisDragger,
            dragState,
            enabled,
            minRatioX,
            minRatioY,
            paddedRect,
            panner,
            selector,
            seriesRect,
            hoveredAxis,
            ctx: { interactionManager, tooltipManager, updateService, zoomManager },
        } = this;

        if (!enabled || !paddedRect || !seriesRect) return;

        interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);

        const zoom = this.getZoom();

        switch (dragState) {
            case DragState.Axis:
                if (!hoveredAxis) break;

                const { id: axisId, direction } = hoveredAxis;
                const anchor = direction === _ModuleSupport.ChartAxisDirection.X ? anchorPointX : anchorPointY;
                const axisZoom = zoomManager.getAxisZoom(axisId);
                const newZoom = axisDragger.update(event, direction, anchor, seriesRect, zoom, axisZoom);
                this.updateAxisZoom(axisId, direction, newZoom);
                break;

            case DragState.Pan:
                panner.update(event);
                break;

            case DragState.Select:
                selector.update(event, minRatioX, minRatioY, this.isScalingX(), this.isScalingY(), paddedRect, zoom);
                break;

            case DragState.None:
                return;
        }

        tooltipManager.updateTooltip(TOOLTIP_ID);
        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDragEnd() {
        const {
            axisDragger,
            dragState,
            enabled,
            panner,
            selector,
            ctx: { cursorManager, interactionManager, tooltipManager },
        } = this;

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!enabled || dragState === DragState.None) return;

        switch (dragState) {
            case DragState.Axis:
                axisDragger.stop();
                break;

            case DragState.Pan:
                panner.stop();
                break;

            case DragState.Select:
                if (!selector.didUpdate()) break;
                const zoom = this.getZoom();
                if (!this.isMinZoom(zoom)) {
                    const newZoom = selector.stop(this.seriesRect, this.paddedRect, zoom);
                    this.updateZoom(newZoom);
                }
                break;
        }

        this.dragState = DragState.None;
        cursorManager.updateCursor(CURSOR_ID);
        tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onWheel(event: _ModuleSupport.PointerInteractionEvent<'wheel'>) {
        const {
            enabled,
            enableAxisDragging,
            enablePanning,
            enableScrolling,
            hoveredAxis,
            paddedRect,
            scroller,
            scrollingStep,
            scrollPanner,
            seriesRect,
            ctx: { zoomManager },
        } = this;

        if (!enabled || !enableScrolling || !paddedRect || !seriesRect) return;

        const currentZoom = zoomManager.getZoom();

        const isSeriesScrolling = paddedRect.containsPoint(event.offsetX, event.offsetY);
        const isAxisScrolling = enableAxisDragging && hoveredAxis != null;

        let isScalingX = this.isScalingX();
        let isScalingY = this.isScalingY();

        if (isAxisScrolling) {
            isScalingX = hoveredAxis!.direction === _ModuleSupport.ChartAxisDirection.X;
            isScalingY = !isScalingX;
        }

        const sourceEvent = event.sourceEvent as WheelEvent;
        const { deltaX, deltaY } = sourceEvent;
        const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);

        if (enablePanning && isHorizontalScrolling) {
            event.consume();
            event.sourceEvent.preventDefault();

            const newZooms = scrollPanner.update(event, scrollingStep, seriesRect, zoomManager.getAxisZooms());
            for (const [axisId, { direction, zoom: newZoom }] of Object.entries(newZooms)) {
                this.updateAxisZoom(axisId, direction, newZoom);
            }
            return;
        }

        if (!isSeriesScrolling && !isAxisScrolling) return;

        event.consume();
        event.sourceEvent.preventDefault();

        const newZoom = scroller.update(
            event,
            scrollingStep,
            this.getAnchorPointX(),
            this.getAnchorPointY(),
            isScalingX,
            isScalingY,
            seriesRect,
            currentZoom
        );

        this.updateZoom(newZoom);
    }

    private onAxisLeave() {
        const {
            enabled,
            ctx: { cursorManager },
        } = this;

        if (!enabled) return;

        this.hoveredAxis = undefined;
        cursorManager.updateCursor(CURSOR_ID);
    }

    private onAxisHover(event: _ModuleSupport.AxisHoverChartEvent) {
        const {
            enabled,
            enableAxisDragging,
            ctx: { cursorManager },
        } = this;

        if (!enabled) return;

        this.hoveredAxis = {
            id: event.axisId,
            direction: event.direction,
        };

        if (enableAxisDragging) {
            cursorManager.updateCursor(CURSOR_ID, event.direction === ChartAxisDirection.X ? 'ew-resize' : 'ns-resize');
        }
    }

    private onPinchMove(event: PinchEvent) {
        const { enabled, enableScrolling, paddedRect, seriesRect } = this;
        if (!enabled || !enableScrolling || !paddedRect || !seriesRect) return;

        const oldZoom = this.getZoom();
        const newZoom = this.getZoom();

        const delta = event.deltaDistance * -0.01;
        const origin = pointToRatio(seriesRect, event.origin.x, event.origin.y);

        if (this.isScalingX()) {
            newZoom.x.max += delta * dx(oldZoom);
            newZoom.x = scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x);
        }
        if (this.isScalingY()) {
            newZoom.y.max += delta * (oldZoom.y.max - oldZoom.y.min);
            newZoom.y = scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y);
        }

        this.updateZoom(constrainZoom(newZoom));
    }

    private onToolbarButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        this.onToolbarButtonPressRanges(event);
        this.onToolbarButtonPressZoom(event);
    }

    private onToolbarButtonPressRanges(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('ranges', event)) return;

        const { rangeX } = this;

        const time = event.value;
        if (typeof time === 'number') {
            rangeX.extendToEnd(time);
        } else if (Array.isArray(time)) {
            rangeX.updateWith(() => time);
        } else if (typeof time === 'function') {
            rangeX.updateWith(time);
        }
    }

    private onToolbarButtonPressZoom(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('zoom', event)) return;

        const { anchorPointX, anchorPointY, scrollingStep } = this;

        const oldZoom = this.getZoom();
        let zoom = definedZoomState(oldZoom);

        switch (event.value) {
            case 'reset-zoom':
                zoom = this.getResetZoom();
                break;

            case 'pan-start':
                zoom.x.max = dx(zoom);
                zoom.x.min = 0;
                break;

            case 'pan-end':
                zoom.x.min = UNIT.max - dx(zoom);
                zoom.x.max = UNIT.max;
                break;

            case 'pan-left':
            case 'pan-right':
                zoom = translateZoom(zoom, event.value === 'pan-left' ? -dx(zoom) : dx(zoom), 0);
                break;

            case 'zoom-in':
            case 'zoom-out':
                const scale = event.value === 'zoom-in' ? 1 - scrollingStep : 1 + scrollingStep;

                const useAnchorPointX = anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
                const useAnchorPointY = anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;

                zoom = scaleZoom(zoom, this.isScalingX() ? scale : 1, this.isScalingY() ? scale : 1);
                zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, useAnchorPointX);
                zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, useAnchorPointY);
                break;
        }

        this.updateZoom(constrainZoom(zoom));
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const { enabled, rangeX, rangeY } = this;

        if (!enabled) return;

        const {
            series: { rect, paddedRect, shouldFlipXY },
            axes,
        } = event;

        this.seriesRect = rect;
        this.paddedRect = paddedRect;
        this.shouldFlipXY = shouldFlipXY;

        if (!axes) return;

        const [axesX, axesY] = _Util.bifurcate((axis) => axis.direction === ChartAxisDirection.X, axes);
        const rangeXAxisChanged = rangeX.updateAxis(axesX);
        const rangeYAxisChanged = rangeY.updateAxis(axesY);

        if (!rangeXAxisChanged && !rangeYAxisChanged) return;

        const newZoom: _ModuleSupport.AxisZoomState = {};
        newZoom.x = rangeX.getRange();
        newZoom.y = rangeY.getRange();

        if (newZoom.x != null || newZoom.y != null) {
            this.updateZoom(constrainZoom(definedZoomState(newZoom)));
        }
    }

    private onUpdateComplete({ minRect, minVisibleRect }: _ModuleSupport.UpdateCompleteEvent) {
        const { enabled, minVisibleItemsX, minVisibleItemsY, paddedRect, shouldFlipXY } = this;

        if (!enabled || !paddedRect || !minRect || !minVisibleRect) return;

        const zoom = this.getZoom();

        const minVisibleItemsWidth = shouldFlipXY ? minVisibleItemsY : minVisibleItemsX;
        const minVisibleItemsHeight = shouldFlipXY ? minVisibleItemsX : minVisibleItemsY;

        const widthRatio = (minVisibleRect.width * minVisibleItemsWidth) / paddedRect.width;
        const heightRatio = (minVisibleRect.height * minVisibleItemsHeight) / paddedRect.height;

        // Round the ratios to reduce jiggle from floating point precision limitations
        const ratioX = round(widthRatio * dx(zoom));
        const ratioY = round(heightRatio * dy(zoom));

        if (this.isScalingX()) {
            this.minRatioX = Math.min(1, ratioX);
        }

        if (this.isScalingY()) {
            this.minRatioY = Math.min(1, ratioY);
        }

        this.minRatioX ||= this.minRatioY || 0;
        this.minRatioY ||= this.minRatioX || 0;
    }

    private onContextMenuZoomToHere({ event }: ContextMenuActionParams) {
        const { enabled, minRatioX, minRatioY, paddedRect } = this;

        if (!enabled || !paddedRect || !event || !event.target) return;

        const zoom = this.getZoom();
        const origin = pointToRatio(paddedRect, event.clientX, event.clientY);

        const scaledOriginX = origin.x * dx(zoom);
        const scaledOriginY = origin.y * dy(zoom);

        const size = UNIT.max - UNIT.min;
        const halfSize = size / 2;

        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };

        newZoom = scaleZoomCenter(newZoom, this.isScalingX() ? minRatioX : size, this.isScalingY() ? minRatioY : size);
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        this.updateZoom(constrainZoom(newZoom));
    }

    private onContextMenuPanToHere({ event }: ContextMenuActionParams) {
        const { enabled, paddedRect } = this;

        if (!enabled || !paddedRect || !event || !event.target) return;

        const zoom = this.getZoom();
        const origin = pointToRatio(paddedRect, event.clientX, event.clientY);

        const scaleX = dx(zoom);
        const scaleY = dy(zoom);

        const scaledOriginX = origin.x * scaleX;
        const scaledOriginY = origin.y * scaleY;

        const halfSize = (UNIT.max - UNIT.min) / 2;

        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };

        newZoom = scaleZoomCenter(newZoom, scaleX, scaleY);
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        this.updateZoom(constrainZoom(newZoom));
    }

    private onZoomChange(event: _ModuleSupport.ZoomChangeEvent) {
        if (event.callerId !== 'zoom') {
            this.panner.stopInteractions();
        }
        const zoom = this.getZoom();
        this.toggleContextMenuActions(zoom);
        this.toggleToolbarButtons(zoom);
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
            ctx: { tooltipManager, updateService, zoomManager },
        } = this;

        if (!seriesRect) return;

        const newZooms = panner.translateZooms(seriesRect, zoomManager.getAxisZooms(), event.deltaX, event.deltaY);

        for (const [panAxisId, { direction: panDirection, zoom: panZoom }] of Object.entries(newZooms)) {
            this.updateAxisZoom(panAxisId, panDirection, panZoom);
        }

        tooltipManager.updateTooltip(TOOLTIP_ID);
        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
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

    private isMinZoom(zoom: DefinedZoomState): boolean {
        const isMinXZoom = round(dx(zoom)) <= this.minRatioX;
        const isMinYZoom = round(dy(zoom)) <= this.minRatioY;

        return isMinXZoom || isMinYZoom;
    }

    private isMaxZoom(zoom: DefinedZoomState): boolean {
        return isZoomEqual(zoom, unitZoomState());
    }

    private updateZoom(zoom: DefinedZoomState) {
        const {
            minRatioX,
            minRatioY,
            ctx: { zoomManager },
        } = this;
        const dx_ = dx(zoom);
        const dy_ = dy(zoom);

        const oldZoom = this.getZoom();

        const zoomedInTooFarX = dx_ <= dx(oldZoom) && dx_ < minRatioX;
        const zoomedInTooFarY = dy_ <= dy(oldZoom) && dy_ < minRatioY;

        if (zoomedInTooFarX) {
            zoom.x = constrainAxisWithOld(zoom.x, oldZoom.x, minRatioX);
        }

        if (zoomedInTooFarY) {
            zoom.y = constrainAxisWithOld(zoom.y, oldZoom.y, minRatioY);
        }

        zoomManager.updateZoom('zoom', zoom);
    }

    private updateAxisZoom(
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        partialZoom: _ModuleSupport.ZoomState | undefined
    ) {
        const {
            enableSecondaryAxis,
            ctx: { zoomManager },
        } = this;

        if (!partialZoom) return;

        if (!enableSecondaryAxis) {
            const fullZoom = this.getZoom();
            fullZoom[direction] = partialZoom;
            this.updateZoom(fullZoom);
            return;
        }

        const d = partialZoom.max - partialZoom.min;
        const minRatio = direction === ChartAxisDirection.X ? this.minRatioX : this.minRatioY;

        // Discard the zoom update if it would take us below the min ratio
        if (d < minRatio) return;

        zoomManager.updateAxisZoom('zoom', axisId, partialZoom);
    }

    private getZoom() {
        return definedZoomState(this.ctx.zoomManager.getZoom());
    }

    private getResetZoom() {
        const x = this.rangeX.getInitialRange() ?? this.ratioX.getInitialRatio() ?? UNIT;
        const y = this.rangeY.getInitialRange() ?? this.ratioY.getInitialRatio() ?? UNIT;

        return { x, y };
    }
}
