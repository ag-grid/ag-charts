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
    pointToRatio,
    scaleZoom,
    scaleZoomAxisWithAnchor,
    scaleZoomAxisWithPoint,
    scaleZoomCenter,
    translateZoom,
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

const ANCHOR_CORD = UNION(['pointer', 'start', 'middle', 'end'], 'an anchor cord');

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
            if (enabled) {
                this.registerContextMenuActions();
            }
            this.toolbarManager?.toggleGroup('ranges', Boolean(enabled));
            this.toolbarManager?.toggleGroup('zoom', Boolean(enabled));
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

    @Validate(ANCHOR_CORD)
    public anchorPointX: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_X;

    @Validate(ANCHOR_CORD)
    public anchorPointY: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_Y;

    public rangeX = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection.X));
    public rangeY = new ZoomRange(this.onRangeChange.bind(this, ChartAxisDirection.Y));

    public ratioX = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection.X));
    public ratioY = new ZoomRatio(this.onRatioChange.bind(this, ChartAxisDirection.Y));

    // Scenes
    private readonly scene: _Scene.Scene;
    private seriesRect?: _Scene.BBox;
    private paddedRect?: _Scene.BBox;

    // Module context
    private readonly cursorManager: _ModuleSupport.CursorManager;
    private readonly highlightManager: _ModuleSupport.HighlightManager;
    private readonly toolbarManager: _ModuleSupport.ToolbarManager;
    private readonly tooltipManager: _ModuleSupport.TooltipManager;
    private readonly updateService: _ModuleSupport.UpdateService;
    private readonly zoomManager: _ModuleSupport.ZoomManager;
    private readonly contextMenuRegistry: _ModuleSupport.ContextMenuRegistry;

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

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.scene = ctx.scene;
        this.cursorManager = ctx.cursorManager;
        this.highlightManager = ctx.highlightManager;
        this.toolbarManager = ctx.toolbarManager;
        this.tooltipManager = ctx.tooltipManager;
        this.zoomManager = ctx.zoomManager;
        this.updateService = ctx.updateService;
        this.contextMenuRegistry = ctx.contextMenuRegistry;

        // Add selection zoom method and attach selection rect to root scene
        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect);

        const { Default, ZoomDrag, Animation } = _ModuleSupport.InteractionState;
        const draggableState = Default | Animation | ZoomDrag;
        const clickableState = Default | Animation;
        const region = ctx.regionManager.getRegion('series');
        this.destroyFns.push(
            this.scene.attachNode(selectionRect),
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
        // Add context menu zoom actions
        this.contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_ZOOM_ACTION_ID,
            label: 'Zoom to here',
            action: (params) => this.onContextMenuZoomToHere(params),
        });
        this.contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_PAN_ACTION_ID,
            label: 'Pan to here',
            action: (params) => this.onContextMenuPanToHere(params),
        });

        const zoom = definedZoomState(this.zoomManager.getZoom());
        this.toggleContextMenuActions(zoom);
    }

    private toggleContextMenuActions(zoom: DefinedZoomState) {
        if (this.isMinZoom(zoom)) {
            this.contextMenuRegistry.disableAction(CONTEXT_ZOOM_ACTION_ID);
        } else {
            this.contextMenuRegistry.enableAction(CONTEXT_ZOOM_ACTION_ID);
        }

        if (this.isMaxZoom(zoom)) {
            this.contextMenuRegistry.disableAction(CONTEXT_PAN_ACTION_ID);
        } else {
            this.contextMenuRegistry.enableAction(CONTEXT_PAN_ACTION_ID);
        }
    }

    private onRangeChange(direction: _ModuleSupport.ChartAxisDirection, rangeZoom?: DefinedZoomState['x' | 'y']) {
        if (!rangeZoom) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
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
        if (!this.enabled || !this.enableDoubleClickToReset) return;

        const { x, y } = this.getResetZoom();

        if (this.hoveredAxis) {
            const { id, direction } = this.hoveredAxis;
            const axisZoom = direction === ChartAxisDirection.X ? x : y;
            this.updateAxisZoom(id, direction, axisZoom);
        } else if (
            this.paddedRect?.containsPoint(event.offsetX, event.offsetY) &&
            this.highlightManager.getActivePicked() == null
        ) {
            this.updateZoom({ x, y });
        }
    }

    private onDragStart(event: _ModuleSupport.PointerInteractionEvent<'drag-start'>) {
        if (!this.enabled || !this.paddedRect) return;

        this.panner.stopInteractions();

        // Determine which ZoomDrag behaviour to use.
        let newDragState = DragState.None;

        if (this.enableAxisDragging && this.hoveredAxis) {
            newDragState = DragState.Axis;
        }
        // Panning & Selection can only happen inside the series rect:
        else if (this.paddedRect.containsPoint(event.offsetX, event.offsetY)) {
            const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent as DragEvent);
            // Allow panning if either selection is disabled or the panning key is pressed.
            if (this.enablePanning && (!this.enableSelecting || panKeyPressed)) {
                this.cursorManager.updateCursor(CURSOR_ID, 'grabbing');
                newDragState = DragState.Pan;
                this.panner.start();
            } else if (this.enableSelecting) {
                const fullyZoomedIn = this.isMinZoom(definedZoomState(this.zoomManager.getZoom()));
                // Do not allow selection if fully zoomed in or when the pankey is pressed
                if (!fullyZoomedIn && !panKeyPressed) {
                    newDragState = DragState.Select;
                }
            }
        }

        if ((this.dragState = newDragState) !== DragState.None) {
            this.zoomManager.fireZoomPanStartEvent('zoom');
        }
    }

    private onDrag(event: _ModuleSupport.PointerInteractionEvent<'drag'>) {
        if (!this.enabled || !this.paddedRect || !this.seriesRect) return;

        this.ctx.interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);

        const zoom = definedZoomState(this.zoomManager.getZoom());

        switch (this.dragState) {
            case DragState.Axis:
                if (!this.hoveredAxis) break;

                const { id: axisId, direction } = this.hoveredAxis;
                const anchor =
                    direction === _ModuleSupport.ChartAxisDirection.X ? this.anchorPointX : this.anchorPointY;
                const axisZoom = this.zoomManager.getAxisZoom(axisId);
                const newZoom = this.axisDragger.update(event, direction, anchor, this.seriesRect, zoom, axisZoom);
                this.updateAxisZoom(axisId, direction, newZoom);
                break;

            case DragState.Pan:
                this.panner.update(event);
                break;

            case DragState.Select:
                this.selector.update(
                    event,
                    this.minRatioX,
                    this.minRatioY,
                    this.isScalingX(),
                    this.isScalingY(),
                    this.paddedRect,
                    zoom
                );
                break;

            case DragState.None:
                return;
        }

        this.tooltipManager.updateTooltip(TOOLTIP_ID);
        this.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDragEnd() {
        this.ctx.interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!this.enabled || this.dragState === DragState.None) return;

        switch (this.dragState) {
            case DragState.Axis:
                this.axisDragger.stop();
                break;

            case DragState.Pan:
                this.panner.stop();
                break;

            case DragState.Select:
                if (!this.selector.didUpdate()) break;
                const zoom = definedZoomState(this.zoomManager.getZoom());
                if (!this.isMinZoom(zoom)) {
                    const newZoom = this.selector.stop(this.seriesRect, this.paddedRect, zoom);
                    this.updateZoom(newZoom);
                }
                break;
        }

        this.dragState = DragState.None;
        this.cursorManager.updateCursor(CURSOR_ID);
        this.tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onWheel(event: _ModuleSupport.PointerInteractionEvent<'wheel'>) {
        if (!this.enabled || !this.enableScrolling || !this.paddedRect || !this.seriesRect) return;

        const currentZoom = this.zoomManager.getZoom();

        const isSeriesScrolling = this.paddedRect.containsPoint(event.offsetX, event.offsetY);
        const isAxisScrolling = this.enableAxisDragging && this.hoveredAxis != null;

        let isScalingX = this.isScalingX();
        let isScalingY = this.isScalingY();

        if (isAxisScrolling) {
            isScalingX = this.hoveredAxis!.direction === _ModuleSupport.ChartAxisDirection.X;
            isScalingY = !isScalingX;
        }

        const sourceEvent = event.sourceEvent as WheelEvent;
        const { deltaX, deltaY } = sourceEvent;
        const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);

        if (this.enablePanning && isHorizontalScrolling) {
            event.consume();
            event.sourceEvent.preventDefault();

            const newZooms = this.scrollPanner.update(
                event,
                this.scrollingStep,
                this.seriesRect,
                this.zoomManager.getAxisZooms()
            );
            for (const [axisId, { direction, zoom: newZoom }] of Object.entries(newZooms)) {
                this.updateAxisZoom(axisId, direction, newZoom);
            }
            return;
        }

        if (!isSeriesScrolling && !isAxisScrolling) return;

        event.consume();
        event.sourceEvent.preventDefault();

        const newZoom = this.scroller.update(
            event,
            this.scrollingStep,
            this.getAnchorPointX(),
            this.getAnchorPointY(),
            isScalingX,
            isScalingY,
            this.seriesRect,
            currentZoom
        );

        this.updateZoom(newZoom);
    }

    private onAxisLeave() {
        if (!this.enabled) return;

        this.hoveredAxis = undefined;
        this.cursorManager.updateCursor(CURSOR_ID);
    }

    private onAxisHover(event: _ModuleSupport.AxisHoverChartEvent) {
        if (!this.enabled) return;

        this.hoveredAxis = {
            id: event.axisId,
            direction: event.direction,
        };

        if (this.enableAxisDragging) {
            this.cursorManager.updateCursor(
                CURSOR_ID,
                event.direction === ChartAxisDirection.X ? 'ew-resize' : 'ns-resize'
            );
        }
    }

    private onPinchMove(event: PinchEvent) {
        if (!this.enabled || !this.enableScrolling || !this.paddedRect || !this.seriesRect) return;

        const currentZoom = this.zoomManager.getZoom();
        const oldZoom = definedZoomState(currentZoom);
        const newZoom = definedZoomState(currentZoom);

        const delta = event.deltaDistance * -0.01;
        const origin = pointToRatio(this.seriesRect, event.origin.x, event.origin.y);

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

        const time = event.value;
        if (typeof time === 'number') {
            this.rangeX.extendToEnd(time);
        } else if (Array.isArray(time)) {
            this.rangeX.updateWith(() => time);
        } else if (typeof time === 'function') {
            this.rangeX.updateWith(time);
        }
    }

    private onToolbarButtonPressZoom(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('zoom', event)) return;

        const oldZoom = definedZoomState(this.zoomManager.getZoom());
        let zoom = definedZoomState(oldZoom);

        switch (event.value) {
            case 'reset-zoom':
                zoom = this.getResetZoom();
                break;

            case 'pan-left':
            case 'pan-right':
                zoom = translateZoom(zoom, event.value === 'pan-left' ? -this.scrollingStep : this.scrollingStep, 0);
                break;

            case 'zoom-in':
            case 'zoom-out':
                const scale = event.value === 'zoom-in' ? 1 - this.scrollingStep : 1 + this.scrollingStep;

                const anchorPointX = this.anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : this.anchorPointX;
                const anchorPointY = this.anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : this.anchorPointY;

                zoom = scaleZoom(zoom, this.isScalingX() ? scale : 1, this.isScalingY() ? scale : 1);
                zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, anchorPointX);
                zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, anchorPointY);
                break;
        }

        this.updateZoom(constrainZoom(zoom));
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        if (!this.enabled) return;

        const {
            series: { rect, paddedRect, shouldFlipXY },
            axes,
        } = event;

        this.seriesRect = rect;
        this.paddedRect = paddedRect;
        this.shouldFlipXY = shouldFlipXY;

        if (!axes) return;

        const [axesX, axesY] = _Util.bifurcate((axis) => axis.direction === ChartAxisDirection.X, axes);
        const rangeXAxisChanged = this.rangeX.updateAxis(axesX);
        const rangeYAxisChanged = this.rangeY.updateAxis(axesY);

        if (!rangeXAxisChanged && !rangeYAxisChanged) return;

        const newZoom: _ModuleSupport.AxisZoomState = {};
        newZoom.x = this.rangeX.getRange();
        newZoom.y = this.rangeY.getRange();

        if (newZoom.x != null || newZoom.y != null) {
            this.updateZoom(constrainZoom(definedZoomState(newZoom)));
        }
    }

    private onUpdateComplete({ minRect, minVisibleRect }: _ModuleSupport.UpdateCompleteEvent) {
        if (!this.enabled || !this.paddedRect || !minRect || !minVisibleRect) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());

        const minVisibleItemsWidth = this.shouldFlipXY ? this.minVisibleItemsY : this.minVisibleItemsX;
        const minVisibleItemsHeight = this.shouldFlipXY ? this.minVisibleItemsX : this.minVisibleItemsY;

        const widthRatio = (minVisibleRect.width * minVisibleItemsWidth) / this.paddedRect.width;
        const heightRatio = (minVisibleRect.height * minVisibleItemsHeight) / this.paddedRect.height;

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
        if (!this.enabled || !this.paddedRect || !event || !event.target) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(this.paddedRect, event.clientX, event.clientY);

        const scaledOriginX = origin.x * dx(zoom);
        const scaledOriginY = origin.y * dy(zoom);

        const size = UNIT.max - UNIT.min;
        const halfSize = size / 2;

        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };

        newZoom = scaleZoomCenter(
            newZoom,
            this.isScalingX() ? this.minRatioX : size,
            this.isScalingY() ? this.minRatioY : size
        );
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        this.updateZoom(constrainZoom(newZoom));
    }

    private onContextMenuPanToHere({ event }: ContextMenuActionParams) {
        if (!this.enabled || !this.paddedRect || !event || !event.target) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(this.paddedRect, event.clientX, event.clientY);

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

    private onZoomChange(e: _ModuleSupport.ZoomChangeEvent) {
        if (e.callerId !== 'zoom') {
            this.panner.stopInteractions();
        }
        this.toggleContextMenuActions(definedZoomState(this.zoomManager.getZoom()));
    }

    onZoomPanStart(e: _ModuleSupport.ZoomPanStartEvent): void {
        if (e.callerId !== 'zoom') {
            this.panner.stopInteractions();
        }
    }

    private onPanUpdate(e: ZoomPanUpdate) {
        const newZooms = this.panner.translateZooms(
            this.seriesRect!,
            this.zoomManager.getAxisZooms(),
            e.deltaX,
            e.deltaY
        );
        for (const [panAxisId, { direction: panDirection, zoom: panZoom }] of Object.entries(newZooms)) {
            this.updateAxisZoom(panAxisId, panDirection, panZoom);
        }
        this.tooltipManager.updateTooltip(TOOLTIP_ID);
        this.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
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
        return zoom.x.min === UNIT.min && zoom.x.max === UNIT.max && zoom.y.min === UNIT.min && zoom.y.max === UNIT.max;
    }

    private updateZoom(zoom: DefinedZoomState) {
        const dx_ = dx(zoom);
        const dy_ = dy(zoom);

        const oldZoom = definedZoomState(this.zoomManager.getZoom());

        const zoomedInTooFarX = dx_ <= dx(oldZoom) && dx_ < this.minRatioX;
        const zoomedInTooFarY = dy_ <= dy(oldZoom) && dy_ < this.minRatioY;

        if (zoomedInTooFarX) {
            zoom.x = constrainAxisWithOld(zoom.x, oldZoom.x, this.minRatioX);
        }

        if (zoomedInTooFarY) {
            zoom.y = constrainAxisWithOld(zoom.y, oldZoom.y, this.minRatioY);
        }

        this.zoomManager.updateZoom('zoom', zoom);
    }

    private updateAxisZoom(
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        partialZoom: _ModuleSupport.ZoomState | undefined
    ) {
        if (!partialZoom) return;

        if (!this.enableSecondaryAxis) {
            const fullZoom = definedZoomState(this.zoomManager.getZoom());
            fullZoom[direction] = partialZoom;
            this.updateZoom(fullZoom);
            return;
        }

        const d = partialZoom.max - partialZoom.min;
        const minRatio = direction === ChartAxisDirection.X ? this.minRatioX : this.minRatioY;

        // Discard the zoom update if it would take us below the min ratio
        if (d < minRatio) return;

        this.zoomManager.updateAxisZoom('zoom', axisId, partialZoom);
    }

    private getResetZoom() {
        const x = this.rangeX.getInitialRange() ?? this.ratioX.getInitialRatio() ?? UNIT;
        const y = this.rangeY.getInitialRange() ?? this.ratioY.getInitialRatio() ?? UNIT;

        return { x, y };
    }
}
