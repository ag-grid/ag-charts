import type { AgZoomAnchorPoint, _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { ZoomRect } from './scenes/zoomRect';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomPanner } from './zoomPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import {
    UNIT,
    constrainZoom,
    definedZoomState,
    pointToRatio,
    scaleZoomAxisWithPoint,
    scaleZoomCenter,
    translateZoom,
    unitZoomState,
} from './zoomTransformers';
import type { DefinedZoomState } from './zoomTypes';

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
    Validate,
    round: sharedRound,
} = _ModuleSupport;

const ANCHOR_CORD = UNION(['pointer', 'start', 'middle', 'end'], 'an anchor cord');

const CONTEXT_ZOOM_ACTION_ID = 'zoom-action';
const CONTEXT_PAN_ACTION_ID = 'pan-action';
const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';
const DECIMALS = 3;

const round = (value: number) => sharedRound(value, DECIMALS);

export class Zoom extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<Zoom>({
        newValue(newValue) {
            if (newValue) {
                this.registerContextMenuActions();
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

    @Validate(ANCHOR_CORD)
    public anchorPointX: AgZoomAnchorPoint = 'end';

    @Validate(ANCHOR_CORD)
    public anchorPointY: AgZoomAnchorPoint = 'middle';

    // Scenes
    private readonly scene: _Scene.Scene;
    private seriesRect?: _Scene.BBox;
    private paddedRect?: _Scene.BBox;

    // Module context
    private readonly cursorManager: _ModuleSupport.CursorManager;
    private readonly dataService: _ModuleSupport.DataService<any>;
    private readonly highlightManager: _ModuleSupport.HighlightManager;
    private readonly tooltipManager: _ModuleSupport.TooltipManager;
    private readonly updateService: _ModuleSupport.UpdateService;
    private readonly zoomManager: _ModuleSupport.ZoomManager;
    private readonly contextMenuRegistry: _ModuleSupport.ContextMenuRegistry;

    // Zoom methods
    private readonly axisDragger = new ZoomAxisDragger();
    private readonly panner = new ZoomPanner();
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();

    // State
    private isDragging = false;
    private hoveredAxis?: { id: string; direction: _ModuleSupport.ChartAxisDirection };
    private shouldFlipXY?: boolean;
    private minRatioX = 0;
    private minRatioY = 0;

    // TODO: This will become an option soon, and I don't want to delete my code in the meantime
    private enableSecondaryAxis = false;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.scene = ctx.scene;
        this.cursorManager = ctx.cursorManager;
        this.highlightManager = ctx.highlightManager;
        this.tooltipManager = ctx.tooltipManager;
        this.zoomManager = ctx.zoomManager;
        this.dataService = ctx.dataService;
        this.updateService = ctx.updateService;
        this.contextMenuRegistry = ctx.contextMenuRegistry;

        const { Default, ZoomDrag, Animation } = _ModuleSupport.InteractionState;
        const draggableState = Default | Animation | ZoomDrag;
        const clickableState = Default | Animation;
        this.destroyFns.push(
            ctx.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event), clickableState),
            ctx.interactionManager.addListener('drag', (event) => this.onDrag(event), draggableState),
            ctx.interactionManager.addListener('drag-start', (event) => this.onDragStart(event), draggableState),
            ctx.interactionManager.addListener('drag-end', () => this.onDragEnd(), draggableState),
            ctx.interactionManager.addListener('wheel', (event) => this.onWheel(event), clickableState),
            ctx.interactionManager.addListener('hover', () => this.onHover(), clickableState),
            ctx.chartEventManager.addListener('axis-hover', (event) => this.onAxisHover(event)),
            ctx.gestureDetector.addListener('pinch-move', (event) => this.onPinchMove(event as PinchEvent)),
            ctx.layoutService.addListener('layout-complete', (event) => this.onLayoutComplete(event)),
            ctx.updateService.addListener('update-complete', (event) => this.onUpdateComplete(event))
        );

        // Add selection zoom method and attach selection rect to root scene
        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect);

        this.scene.root?.appendChild(selectionRect);
        this.destroyFns.push(() => this.scene.root?.removeChild(selectionRect));
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

    private onDoubleClick(event: _ModuleSupport.InteractionEvent<'dblclick'>) {
        if (!this.enabled || !this.enableDoubleClickToReset) return;

        if (this.hoveredAxis) {
            const { id, direction } = this.hoveredAxis;
            this.updateAxisZoom(id, direction, { ...UNIT });
        } else if (
            this.paddedRect?.containsPoint(event.offsetX, event.offsetY) &&
            this.highlightManager.getActivePicked() == null
        ) {
            this.updateZoom(unitZoomState());
        }
    }

    private canDragSelection?: boolean;

    private onDragStart(event: _ModuleSupport.InteractionEvent<'drag-start'>) {
        this.canDragSelection = this.paddedRect?.containsPoint(event.offsetX, event.offsetY);
    }

    private onDrag(event: _ModuleSupport.InteractionEvent<'drag'>) {
        if (!this.enabled || !this.paddedRect || !this.seriesRect) return;

        this.ctx.interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);

        const sourceEvent = event.sourceEvent as DragEvent;

        const isPrimaryMouseButton = sourceEvent.button === 0;
        if (!isPrimaryMouseButton) return;

        this.isDragging = true;
        this.tooltipManager.updateTooltip(TOOLTIP_ID);

        const zoom = definedZoomState(this.zoomManager.getZoom());

        if (this.enableAxisDragging && this.hoveredAxis) {
            const { id: axisId, direction } = this.hoveredAxis;
            const anchor = direction === _ModuleSupport.ChartAxisDirection.X ? this.anchorPointX : this.anchorPointY;
            const axisZoom = this.zoomManager.getAxisZoom(axisId);
            const newZoom = this.axisDragger.update(event, direction, anchor, this.seriesRect, zoom, axisZoom);
            this.updateAxisZoom(axisId, direction, newZoom);
            return;
        }

        // Prevent the user from dragging outside the series rect (if not on an axis)
        if (!this.paddedRect.containsPoint(event.offsetX, event.offsetY)) {
            return;
        }

        // Allow panning if either selection is disabled or the panning key is pressed.
        if (this.enablePanning && (!this.enableSelecting || this.isPanningKeyPressed(sourceEvent))) {
            const newZooms = this.panner.updateDrag(event, this.seriesRect, this.zoomManager.getAxisZooms());
            for (const [axisId, { direction, zoom: newZoom }] of Object.entries(newZooms)) {
                this.updateAxisZoom(axisId, direction, newZoom);
            }
            this.cursorManager.updateCursor(CURSOR_ID, 'grabbing');
            return;
        }

        // If the user stops pressing the panKey but continues dragging, we shouldn't go to selection until they stop
        // dragging and click to start a new drag.
        if (
            !this.enableSelecting ||
            !this.canDragSelection ||
            this.isPanningKeyPressed(sourceEvent) ||
            this.panner.isPanning ||
            this.isMinZoom(zoom)
        ) {
            return;
        }

        this.selector.update(
            event,
            this.minRatioX,
            this.minRatioY,
            this.isScalingX(),
            this.isScalingY(),
            this.paddedRect,
            zoom
        );

        this.updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDragEnd() {
        this.ctx.interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!this.enabled || !this.isDragging) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());

        this.cursorManager.updateCursor(CURSOR_ID);

        if (this.enableAxisDragging && this.axisDragger.isAxisDragging) {
            this.axisDragger.stop();
        } else if (this.enablePanning && this.panner.isPanning) {
            this.panner.stop();
        } else if (this.enableSelecting && !this.isMinZoom(zoom) && this.canDragSelection) {
            const newZoom = this.selector.stop(this.seriesRect, this.paddedRect, zoom);
            this.updateZoom(newZoom);
        }

        this.isDragging = false;
        this.tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onWheel(event: _ModuleSupport.InteractionEvent<'wheel'>) {
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

        // Allow panning if either selection is disabled or the panning key is pressed.
        const sourceEvent: Partial<WheelEvent> = event.sourceEvent;
        const { deltaX, deltaY } = sourceEvent;
        if (this.enablePanning && deltaX !== undefined && deltaY !== undefined && Math.abs(deltaX) > Math.abs(deltaY)) {
            event.consume();
            event.sourceEvent.preventDefault();

            const newZooms = this.panner.updateHScroll(event.deltaX, this.seriesRect, this.zoomManager.getAxisZooms());
            for (const [axisId, { direction, zoom: newZoom }] of Object.entries(newZooms)) {
                this.updateAxisZoom(axisId, direction, newZoom);
            }
            return;
        }

        if (isSeriesScrolling || isAxisScrolling) {
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
    }

    private onHover() {
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
            newZoom.x.max += delta * (oldZoom.x.max - oldZoom.x.min);
            newZoom.x = scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x);
        }
        if (this.isScalingY()) {
            newZoom.y.max += delta * (oldZoom.y.max - oldZoom.y.min);
            newZoom.y = scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y);
        }

        this.updateZoom(constrainZoom(newZoom));
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        if (!this.enabled) return;

        const {
            series: { rect, paddedRect, shouldFlipXY },
        } = event;

        this.seriesRect = rect;
        this.paddedRect = paddedRect;
        this.shouldFlipXY = shouldFlipXY;
    }

    private onUpdateComplete({ minRect }: _ModuleSupport.UpdateCompleteEvent) {
        if (!this.enabled || !this.paddedRect || !minRect) return;

        // The minRect is the distance between the coarsest data points, so the user will not be able to zoom in further
        // on newly loaded fine grained data. Instead, ignore this and allow infinite zooming.
        if (this.dataService.isLazy()) {
            this.minRatioX = 0;
            this.minRatioY = 0;
            return;
        }

        const zoom = definedZoomState(this.zoomManager.getZoom());

        const minVisibleItemsWidth = this.shouldFlipXY ? this.minVisibleItemsY : this.minVisibleItemsX;
        const minVisibleItemsHeight = this.shouldFlipXY ? this.minVisibleItemsX : this.minVisibleItemsY;

        const widthRatio = (minRect.width * minVisibleItemsWidth) / this.paddedRect.width;
        const heightRatio = (minRect.height * minVisibleItemsHeight) / this.paddedRect.height;

        // We don't need to check flipping here again, as it is already built into the width & height ratios and the
        // zoom.x/y values themselves do not flip and are bound to width/height respectively.
        const ratioX = widthRatio * (zoom.x.max - zoom.x.min);
        const ratioY = heightRatio * (zoom.y.max - zoom.y.min);

        if (this.isScalingX()) {
            this.minRatioX = Math.min(1, round(ratioX));
        }

        if (this.isScalingY()) {
            this.minRatioY = Math.min(1, round(ratioY));
        }

        this.minRatioX ||= this.minRatioY || 0;
        this.minRatioY ||= this.minRatioX || 0;
    }

    private onContextMenuZoomToHere({ event }: ContextMenuActionParams) {
        if (!this.enabled || !this.paddedRect || !event || !event.target) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(this.paddedRect, event.clientX, event.clientY);

        const scaledOriginX = origin.x * (zoom.x.max - zoom.x.min);
        const scaledOriginY = origin.y * (zoom.y.max - zoom.y.min);

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

        const scaleX = zoom.x.max - zoom.x.min;
        const scaleY = zoom.y.max - zoom.y.min;

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

    private isPanningKeyPressed(event: MouseEvent) {
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
        const minXCheckValue = this.enableScrolling
            ? (zoom.x.max - zoom.x.min) * (1 - this.scrollingStep)
            : round(zoom.x.max - zoom.x.min);

        const minYCheckValue = this.enableScrolling
            ? (zoom.y.max - zoom.y.min) * (1 - this.scrollingStep)
            : round(zoom.y.max - zoom.y.min);

        const isMinXZoom = !this.isScalingX() || minXCheckValue <= this.minRatioX;
        const isMinYZoom = !this.isScalingY() || minYCheckValue <= this.minRatioX;

        return isMinXZoom && isMinYZoom;
    }

    private isMaxZoom(zoom: DefinedZoomState): boolean {
        return zoom.x.min === UNIT.min && zoom.x.max === UNIT.max && zoom.y.min === UNIT.min && zoom.y.max === UNIT.max;
    }

    private updateZoom(zoom: DefinedZoomState) {
        const dx = round(zoom.x.max - zoom.x.min);
        const dy = round(zoom.y.max - zoom.y.min);

        // Discard the zoom update if it would take us below either min ratio
        if (dx < this.minRatioX || dy < this.minRatioY) {
            this.contextMenuRegistry.disableAction(CONTEXT_ZOOM_ACTION_ID);
            this.contextMenuRegistry.enableAction(CONTEXT_PAN_ACTION_ID);
            return;
        }

        this.toggleContextMenuActions(zoom);

        this.zoomManager.updateZoom(zoom);
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

        const d = round(partialZoom.max - partialZoom.min);
        const minRatio = direction === ChartAxisDirection.X ? this.minRatioX : this.minRatioY;

        // Discard the zoom update if it would take us below the min ratio
        if (d >= minRatio) {
            this.zoomManager.updateAxisZoom(axisId, partialZoom);
        }
    }
}
