import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import * as ContextMenu from '../context-menu/main';
import { ZoomRect } from './scenes/zoomRect';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomPanner } from './zoomPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import { constrainZoom, definedZoomState, pointToRatio, scaleZoomCenter, translateZoom } from './zoomTransformers';
import type { AnchorPoint, DefinedZoomState } from './zoomTypes';

const { BOOLEAN, NUMBER, STRING_UNION, ChartAxisDirection, ChartUpdateType, Validate } = _ModuleSupport;

const CONTEXT_ZOOM_ACTION_ID = 'zoom-action';
const CONTEXT_PAN_ACTION_ID = 'pan-action';
const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';
const ZOOM_ID = 'zoom';

const round = (value: number, decimals: number) => {
    const pow = Math.pow(10, decimals);
    return Math.round(value * pow) / pow;
};

export class Zoom extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = true;

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

    @Validate(STRING_UNION('alt', 'ctrl', 'meta', 'shift'))
    public panKey: 'alt' | 'ctrl' | 'meta' | 'shift' = 'alt';

    @Validate(STRING_UNION('xy', 'x', 'y'))
    public axes: 'xy' | 'x' | 'y' = 'x';

    @Validate(NUMBER(0, 1))
    public scrollingStep = 0.1;

    @Validate(NUMBER(0, 1))
    public minXRatio: number = 0.2;

    @Validate(NUMBER(0, 1))
    public minYRatio: number = 0.2;

    @Validate(STRING_UNION('pointer', 'start', 'middle', 'end'))
    public anchorPointX: AnchorPoint = 'end';

    @Validate(STRING_UNION('pointer', 'start', 'middle', 'end'))
    public anchorPointY: AnchorPoint = 'middle';

    // Scenes
    private readonly scene: _Scene.Scene;
    private seriesRect?: _Scene.BBox;

    // Module context
    private readonly cursorManager: _ModuleSupport.CursorManager;
    private readonly highlightManager: _ModuleSupport.HighlightManager;
    private readonly tooltipManager: _ModuleSupport.TooltipManager;
    private readonly zoomManager: _ModuleSupport.ZoomManager;
    private readonly updateService: _ModuleSupport.UpdateService;

    // Zoom methods
    private readonly axisDragger = new ZoomAxisDragger();
    private readonly panner = new ZoomPanner();
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();

    // State
    private isDragging = false;
    private hoveredAxis?: { id: string; direction: _ModuleSupport.ChartAxisDirection };
    private shouldFlipXY?: boolean;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.scene = ctx.scene;
        this.cursorManager = ctx.cursorManager;
        this.highlightManager = ctx.highlightManager;
        this.tooltipManager = ctx.tooltipManager;
        this.zoomManager = ctx.zoomManager;
        this.updateService = ctx.updateService;

        const interactionOpts = { bypassPause: ['animation' as const] };
        this.destroyFns.push(
            ctx.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event), interactionOpts),
            ctx.interactionManager.addListener('drag', (event) => this.onDrag(event), interactionOpts),
            ctx.interactionManager.addListener('drag-end', () => this.onDragEnd(), interactionOpts),
            ctx.interactionManager.addListener('wheel', (event) => this.onWheel(event), interactionOpts),
            ctx.interactionManager.addListener('hover', () => this.onHover(), interactionOpts),
            ctx.chartEventManager.addListener('axis-hover', (event) => this.onAxisHover(event)),
            ctx.layoutService.addListener('layout-complete', (event) => this.onLayoutComplete(event))
        );

        // Add selection zoom method and attach selection rect to root scene
        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect);

        this.scene.root?.appendChild(selectionRect);
        this.destroyFns.push(() => this.scene.root?.removeChild(selectionRect));

        // Add context menu zoom actions
        ContextMenu._registerDefaultAction(
            CONTEXT_ZOOM_ACTION_ID,
            'Zoom to here',
            (params: ContextMenu.ContextMenuActionParams) => this.onContextMenuZoomToHere(params)
        );
        ContextMenu._registerDefaultAction(
            CONTEXT_PAN_ACTION_ID,
            'Pan to here',
            (params: ContextMenu.ContextMenuActionParams) => this.onContextMenuPanToHere(params)
        );
        ContextMenu._disableAction(CONTEXT_PAN_ACTION_ID);
    }

    private onDoubleClick(event: _ModuleSupport.InteractionEvent<'dblclick'>) {
        if (!this.enabled || !this.enableDoubleClickToReset) return;

        if (this.hoveredAxis) {
            const { id, direction } = this.hoveredAxis;
            this.updateAxisZoom(id, direction, { min: 0, max: 1 });
        } else if (
            this.seriesRect?.containsPoint(event.offsetX, event.offsetY) &&
            this.highlightManager.getActivePicked() === undefined
        ) {
            this.updateZoom({ x: { min: 0, max: 1 }, y: { min: 0, max: 1 } });
        }
    }

    private onDrag(event: _ModuleSupport.InteractionEvent<'drag'>) {
        if (!this.enabled) return;

        const sourceEvent = event.sourceEvent as DragEvent;

        const isPrimaryMouseButton = sourceEvent.button === 0;
        if (!isPrimaryMouseButton) return;

        this.isDragging = true;
        this.tooltipManager.updateTooltip(TOOLTIP_ID);

        const zoom = definedZoomState(this.zoomManager.getZoom());

        if (this.enableAxisDragging && this.seriesRect && this.hoveredAxis) {
            const { id: axisId, direction } = this.hoveredAxis;
            const anchor = direction === _ModuleSupport.ChartAxisDirection.X ? this.anchorPointX : this.anchorPointY;
            const axisZoom = this.zoomManager.getAxisZoom(axisId) ?? { min: 0, max: 1 };
            const newZoom = this.axisDragger.update(event, direction, anchor, this.seriesRect, zoom, axisZoom);
            this.updateAxisZoom(axisId, direction, newZoom);
            return;
        }

        // Allow panning if either selection is disabled or the panning key is pressed.
        if (this.enablePanning && this.seriesRect && (!this.enableSelecting || this.isPanningKeyPressed(sourceEvent))) {
            const newZooms = this.panner.update(event, this.seriesRect, this.zoomManager.getAxisZooms());
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
            this.isPanningKeyPressed(sourceEvent) ||
            this.panner.isPanning ||
            this.isMinZoom(zoom)
        ) {
            return;
        }

        this.selector.update(
            event,
            this.minXRatio,
            this.minYRatio,
            this.isScalingX(),
            this.isScalingY(),
            this.seriesRect,
            zoom
        );

        this.updateService.update(ChartUpdateType.PERFORM_LAYOUT);
    }

    private onDragEnd() {
        // Stop single clicks from triggering drag end and resetting the zoom
        if (!this.enabled || !this.isDragging) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());

        this.cursorManager.updateCursor(CURSOR_ID);

        if (this.enableAxisDragging && this.axisDragger.isAxisDragging) {
            this.axisDragger.stop();
        } else if (this.enablePanning && this.panner.isPanning) {
            this.panner.stop();
        } else if (this.enableSelecting && !this.isMinZoom(zoom)) {
            const newZoom = this.selector.stop(this.seriesRect, zoom);
            this.updateZoom(newZoom);
        }

        this.isDragging = false;
        this.tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onWheel(event: _ModuleSupport.InteractionEvent<'wheel'>) {
        if (!this.enabled || !this.enableScrolling || !this.seriesRect) return;

        const currentZoom = this.zoomManager.getZoom();

        const isSeriesScrolling = this.seriesRect.containsPoint(event.offsetX, event.offsetY);
        const isAxisScrolling = this.enableAxisDragging && this.hoveredAxis != null;

        let isScalingX = this.isScalingX();
        let isScalingY = this.isScalingY();

        if (isAxisScrolling) {
            isScalingX = this.hoveredAxis!.direction === _ModuleSupport.ChartAxisDirection.X;
            isScalingY = !isScalingX;
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

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        if (!this.enabled) return;

        const {
            series: { paddedRect, shouldFlipXY },
        } = event;

        this.seriesRect = paddedRect;
        this.shouldFlipXY = shouldFlipXY;
    }

    private onContextMenuZoomToHere({ event }: ContextMenu.ContextMenuActionParams) {
        if (!this.enabled || !this.seriesRect || !event || !event.target) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(this.seriesRect, event.clientX, event.clientY);

        const scaledOriginX = origin.x * (zoom.x.max - zoom.x.min);
        const scaledOriginY = origin.y * (zoom.y.max - zoom.y.min);

        let newZoom = {
            x: { min: origin.x - 0.5, max: origin.x + 0.5 },
            y: { min: origin.y - 0.5, max: origin.y + 0.5 },
        };

        newZoom = scaleZoomCenter(
            newZoom,
            this.isScalingX() ? this.minXRatio : 1,
            this.isScalingY() ? this.minYRatio : 1
        );
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        this.updateZoom(constrainZoom(newZoom));
    }

    private onContextMenuPanToHere({ event }: ContextMenu.ContextMenuActionParams) {
        if (!this.enabled || !this.seriesRect || !event || !event.target) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(this.seriesRect, event.clientX, event.clientY);

        const scaleX = zoom.x.max - zoom.x.min;
        const scaleY = zoom.y.max - zoom.y.min;

        const scaledOriginX = origin.x * scaleX;
        const scaledOriginY = origin.y * scaleY;

        let newZoom = {
            x: { min: origin.x - 0.5, max: origin.x + 0.5 },
            y: { min: origin.y - 0.5, max: origin.y + 0.5 },
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
            : round(zoom.x.max - zoom.x.min, 2);

        const minYCheckValue = this.enableScrolling
            ? (zoom.y.max - zoom.y.min) * (1 - this.scrollingStep)
            : round(zoom.y.max - zoom.y.min, 2);

        const isMinXZoom = !this.isScalingX() || minXCheckValue <= this.minXRatio;
        const isMinYZoom = !this.isScalingY() || minYCheckValue <= this.minXRatio;

        return isMinXZoom && isMinYZoom;
    }

    private isMaxZoom(zoom: DefinedZoomState): boolean {
        return zoom.x.min === 0 && zoom.x.max === 1 && zoom.y.min === 0 && zoom.y.max === 1;
    }

    private updateZoom(zoom: DefinedZoomState) {
        const dx = round(zoom.x.max - zoom.x.min, 2);
        const dy = round(zoom.y.max - zoom.y.min, 2);

        // Discard the zoom update if it would take us below either min ratio
        if (dx < this.minXRatio || dy < this.minYRatio) {
            ContextMenu._disableAction(CONTEXT_ZOOM_ACTION_ID);
            ContextMenu._enableAction(CONTEXT_PAN_ACTION_ID);
            return;
        }

        if (this.isMinZoom(zoom)) {
            ContextMenu._disableAction(CONTEXT_ZOOM_ACTION_ID);
        } else {
            ContextMenu._enableAction(CONTEXT_ZOOM_ACTION_ID);
        }

        if (this.isMaxZoom(zoom)) {
            ContextMenu._disableAction(CONTEXT_PAN_ACTION_ID);
        } else {
            ContextMenu._enableAction(CONTEXT_PAN_ACTION_ID);
        }

        this.zoomManager.updateZoom(ZOOM_ID, zoom);
    }

    private updateAxisZoom(
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        partialZoom: _ModuleSupport.ZoomState | undefined
    ) {
        if (!partialZoom) return;

        partialZoom.min = round(partialZoom.min, 3);
        partialZoom.max = round(partialZoom.max, 3);

        const d = round(partialZoom.max - partialZoom.min, 2);

        // Discard the zoom update if it would take us below either min ratio
        if ((direction === ChartAxisDirection.X && d < this.minXRatio) || d < this.minYRatio) {
            return;
        }

        this.zoomManager.updateAxisZoom(ZOOM_ID, axisId, partialZoom);
    }
}
