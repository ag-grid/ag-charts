import type { AgZoomAnchorPoint } from 'ag-charts-community';
import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { debounce } from 'ag-charts-core';

import { ZoomRect } from './scenes/zoomRect';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomContextMenu } from './zoomContextMenu';
import { ZoomDOMProxy } from './zoomDOMProxy';
import { type ZoomPanUpdate, ZoomPanner } from './zoomPanner';
import { ZoomScrollPanner } from './zoomScrollPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import { ZoomToolbar } from './zoomToolbar';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT,
    constrainAxisWithOld,
    definedZoomState,
    dx,
    dy,
    isZoomLess,
} from './zoomUtils';

const {
    BOOLEAN,
    NUMBER,
    RATIO,
    UNION,
    OBJECT,
    OR,
    ActionOnSet,
    ChartAxisDirection,
    ChartUpdateType,
    Validate,
    InteractionState,
    ProxyProperty,
    round: sharedRound,
} = _ModuleSupport;

const round = (value: number) => sharedRound(value, 10);

const ANCHOR_POINT = UNION(['pointer', 'start', 'middle', 'end'], 'an anchor cord');

const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';

enum DragState {
    None,
    Axis,
    Pan,
    Select,
}

interface ZoomAutoScale {
    enabled: boolean;
    padding: number;
}

class ZoomAutoScaling extends _ModuleSupport.BaseProperties implements ZoomAutoScale {
    constructor(protected onChange: (opts: ZoomAutoScale) => void) {
        super();
    }

    @Validate(BOOLEAN)
    @ActionOnSet<ZoomAutoScaling>({
        changeValue(enabled) {
            this.onChange({ enabled, padding: this.padding });
        },
    })
    enabled = false;

    @Validate(RATIO)
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
    @Validate(BOOLEAN)
    public enabled = false;

    @Validate(BOOLEAN)
    public enableAxisDragging = true;

    @Validate(BOOLEAN)
    public enableDoubleClickToReset = true;

    @ActionOnSet<Zoom>({
        changeValue(newValue) {
            this.ctx.zoomManager.setIndependentAxes(Boolean(newValue));
        },
    })
    @Validate(BOOLEAN, { optional: true })
    public enableIndependentAxes?: boolean;

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

    @Validate(BOOLEAN)
    public keepAspectRatio = false;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsX = 2;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsY = 2;

    @Validate(ANCHOR_POINT)
    public anchorPointX: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_X;

    @Validate(ANCHOR_POINT)
    public anchorPointY: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_Y;

    @Validate(OBJECT)
    public readonly autoScaling = new ZoomAutoScaling((newValue) => {
        this.ctx.zoomManager.setAutoScaleYAxis(newValue.enabled, newValue.padding);
    });

    @Validate(OBJECT)
    public buttons = new ZoomToolbar(
        this.ctx,
        this.getModuleProperties.bind(this),
        this.getResetZoom.bind(this),
        this.updateZoom.bind(this),
        this.updateAxisZoom.bind(this),
        this.resetZoom.bind(this)
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
    private readonly domProxy: ZoomDOMProxy;

    @ProxyProperty('panner.deceleration')
    @Validate(OR(RATIO, UNION(['off', 'short', 'long'], 'a deceleration')))
    public deceleration: number | 'off' | 'short' | 'long' = 'short';

    // State
    private dragState = DragState.None;
    private hoveredAxis?: { direction: _ModuleSupport.ChartAxisDirection; id: string };
    private shouldFlipXY?: boolean;
    private minRatioX = 0;
    private minRatioY = 0;
    private readonly isState = (state: _ModuleSupport.InteractionState) => this.ctx.interactionManager.isState(state);

    private destroyContextMenuActions: (() => void) | undefined = undefined;

    private isFirstWheelEvent = true;
    private readonly debouncedWheelReset = debounce(() => {
        this.isFirstWheelEvent = true;
    }, 100);

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect);
        this.contextMenu = new ZoomContextMenu(
            ctx.contextMenuRegistry,
            ctx.zoomManager,
            this.getModuleProperties.bind(this),
            () => this.paddedRect,
            this.updateZoom.bind(this)
        );

        this.domProxy = new ZoomDOMProxy({
            onDragStart: (id, dir) => this.onAxisDragStart(id, dir),
            onDrag: (ev) => this.onDragMove({ currentX: ev.offsetX, currentY: ev.offsetY }),
            onDragEnd: () => this.onDragEnd(),
            onDoubleClick: (id, direction) => {
                this.hoveredAxis = { id, direction };
                this.onDoubleClick();
                this.hoveredAxis = undefined;
            },
        });

        this.destroyFns.push(
            ctx.scene.attachNode(selectionRect),
            ctx.chartEventManager.addListener('series-keynav-zoom', (event) => this.onNavZoom(event)),
            ctx.widgets.seriesDragInterpreter.addListener('dblclick', (event) => this.onDoubleClick(event)),
            ctx.widgets.seriesDragInterpreter.addListener('drag-move', (event) => this.onDragMove(event)),
            ctx.widgets.seriesDragInterpreter.addListener('drag-start', (event) => this.onDragStart(event)),
            ctx.widgets.seriesDragInterpreter.addListener('drag-end', () => this.onDragEnd()),
            ctx.widgets.seriesWidget.addListener('wheel', (event) => this.onWheel(event)),
            ctx.layoutManager.addListener('layout:complete', (event) => this.onLayoutComplete(event)),
            ctx.updateService.addListener('update-complete', (event) => this.onUpdateComplete(event)),
            ctx.zoomManager.addListener('zoom-change', (event) => this.onZoomChange(event)),
            ctx.zoomManager.addListener('zoom-pan-start', (event) => this.onZoomPanStart(event)),
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

        const zoom = this.getZoom();

        if (this.contextMenu) {
            this.destroyContextMenuActions?.();
            this.destroyContextMenuActions = this.contextMenu.registerActions(enabled, zoom);
        }
    }

    private onDoubleClick(event?: _Widget.MouseWidgetEvent<'dblclick'> & { preventZoomDblClick?: boolean }) {
        const {
            enabled,
            enableDoubleClickToReset,
            hoveredAxis,
            ctx: { zoomManager },
        } = this;

        if (!enabled || !enableDoubleClickToReset || !this.isState(InteractionState.ZoomClickable)) return;

        if (hoveredAxis) {
            zoomManager.resetAxisZoom('zoom', hoveredAxis.id);
        } else if (!event?.preventZoomDblClick) {
            this.resetZoom();
        }
    }

    private onDragStart(event: _Widget.DragWidgetEvent<'drag-start'> | undefined) {
        const {
            enabled,
            enableAxisDragging,
            enablePanning,
            enableSelecting,
            hoveredAxis,
            ctx: { cursorManager, zoomManager },
        } = this;

        if (!enabled) return;
        if (!this.hoveredAxis && !this.isState(InteractionState.ZoomDraggable)) return;

        this.panner.stopInteractions();

        // Determine which ZoomDrag behaviour to use.
        let newDragState = DragState.None;

        if (enableAxisDragging && hoveredAxis) {
            newDragState = DragState.Axis;
        } else if (event != null) {
            const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent as MouseEvent);
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

    private onDragMove(event: { currentX: number; currentY: number }) {
        const {
            anchorPointX,
            anchorPointY,
            axisDragger,
            dragState,
            enabled,
            paddedRect,
            panner,
            selector,
            seriesRect,
            hoveredAxis,
            ctx: { interactionManager, tooltipManager, updateService, zoomManager },
        } = this;

        if (!enabled || !paddedRect || !seriesRect) return;
        if (!this.hoveredAxis && !this.isState(InteractionState.ZoomDraggable)) return;

        interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);

        const zoom = this.getZoom();

        switch (dragState) {
            case DragState.Axis: {
                if (!hoveredAxis) break;

                const { id: axisId, direction } = hoveredAxis;
                const anchor = direction === _ModuleSupport.ChartAxisDirection.X ? anchorPointX : anchorPointY;
                const axisZoom = zoomManager.getAxisZoom(axisId);
                const newZoom = axisDragger.update(event, direction, anchor, seriesRect, zoom, axisZoom);
                zoomManager.setAxisManuallyAdjusted('zoom', axisId);
                this.updateAxisZoom(axisId, direction, newZoom);
                break;
            }

            case DragState.Pan:
                panner.update(event);
                break;

            case DragState.Select:
                selector.update(event, this.getModuleProperties(), paddedRect, zoom);
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
                this.hoveredAxis = undefined;
                axisDragger.stop();
                break;

            case DragState.Pan:
                panner.stop();
                break;

            case DragState.Select: {
                if (!selector.didUpdate()) break;
                const zoom = this.getZoom();
                if (this.isMinZoom(zoom)) break;
                const newZoom = selector.stop(this.seriesRect, this.paddedRect, zoom);
                this.updateZoom(newZoom);
                break;
            }
        }

        this.dragState = DragState.None;
        cursorManager.updateCursor(CURSOR_ID);
        tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onNavZoom(event: _ModuleSupport.SeriesKeyNavZoomChartEvent) {
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
        for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
            this.updateAxisZoom(axisId, direction, zoom);
        }
    }

    private onWheelScrolling(event: _Widget.WheelWidgetEvent) {
        const {
            enableAxisDragging,
            enableIndependentAxes,
            hoveredAxis,
            scroller,
            seriesRect,
            ctx: { zoomManager },
        } = this;

        if (!seriesRect) return;

        const zoom = this.getZoom();
        const isZoomCapped = (this.isMaxZoom(zoom) && event.deltaY > 0) || (this.isMinZoom(zoom) && event.deltaY < 0);

        if (!this.isFirstWheelEvent || !isZoomCapped) {
            event.sourceEvent.preventDefault();
        }

        // Prevent browser scrolling when smooth wheel events continue being fired after the chart
        // reaches a min or max extent
        this.isFirstWheelEvent = false;
        this.debouncedWheelReset();

        const isAxisScrolling = enableAxisDragging && hoveredAxis != null;

        let isScalingX = this.isScalingX();
        let isScalingY = this.isScalingY();

        if (isAxisScrolling) {
            isScalingX = hoveredAxis.direction === _ModuleSupport.ChartAxisDirection.X;
            isScalingY = !isScalingX;
        }

        const props = this.getModuleProperties({ isScalingX, isScalingY });

        if (enableIndependentAxes === true) {
            const newZooms = scroller.updateAxes(event, props, seriesRect, zoomManager.getAxisZooms());
            for (const [axisId, { direction, zoom: axisZoom }] of Object.entries(newZooms)) {
                if (isAxisScrolling && hoveredAxis.id !== axisId) continue;
                this.updateAxisZoom(axisId, direction, axisZoom);
            }
        } else {
            const newZoom = scroller.update(event, props, seriesRect, this.getZoom());
            this.updateUnifiedZoom(newZoom);
        }
    }

    private onAxisDragStart(id: string, direction: _ModuleSupport.ChartAxisDirection) {
        this.hoveredAxis = { id, direction };
        this.onDragStart(undefined);
    }

    _didAutoZoomOnMount = false;
    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        this.domProxy.update(this.ctx);
        const { enabled } = this;

        if (!enabled) return;

        const {
            series: { rect, paddedRect, shouldFlipXY },
        } = event;

        this.seriesRect = rect;
        this.paddedRect = paddedRect;
        this.shouldFlipXY = shouldFlipXY;

        this._didAutoZoomOnMount = true;
    }

    private onUpdateComplete(event: { minRect?: _ModuleSupport.BBox; minVisibleRect?: _ModuleSupport.BBox }) {
        const { minRect, minVisibleRect } = event;
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

    private onZoomChange(event: _ModuleSupport.ZoomChangeEvent) {
        if (event.callerId !== 'zoom') {
            this.panner.stopInteractions();
        }

        const zoom = this.getZoom();
        this.contextMenu.toggleActions(zoom);
        this.buttons.toggleVisibleZoomed(this.isMaxZoom(zoom));
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

        for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
            this.updateAxisZoom(axisId, direction, zoom);
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

    private isMinZoom(zoom: DefinedZoomState): boolean {
        return isZoomLess(zoom, this.minRatioX, this.minRatioY);
    }

    private isMaxZoom(zoom: DefinedZoomState): boolean {
        const max = UNIT.max - UNIT.min;
        return dx(zoom) === max && dy(zoom) === max;
    }

    private updateZoom(zoom: DefinedZoomState) {
        if (this.enableIndependentAxes) {
            this.updatePrimaryAxisZooms(zoom);
        } else {
            this.updateUnifiedZoom(zoom);
        }
    }

    private resetZoom() {
        this.ctx.zoomManager.resetZoom('zoom');
    }

    private updatePrimaryAxisZoom(zoom: DefinedZoomState, direction: _ModuleSupport.ChartAxisDirection) {
        this.ctx.zoomManager.updatePrimaryAxisZoom('zoom', direction, zoom[direction]);
    }

    private updatePrimaryAxisZooms(zoom: DefinedZoomState) {
        this.updatePrimaryAxisZoom(zoom, ChartAxisDirection.X);
        this.updatePrimaryAxisZoom(zoom, ChartAxisDirection.Y);
    }

    private updateUnifiedZoom(zoom: DefinedZoomState) {
        const {
            minRatioX,
            minRatioY,
            ctx: { zoomManager },
        } = this;

        const oldZoom = this.getZoom();

        const dx_ = dx(zoom);
        const zoomedInTooFarX = dx_ <= dx(oldZoom) && dx_ < minRatioX;

        if (zoomedInTooFarX) {
            zoom.x = constrainAxisWithOld(zoom.x, oldZoom.x, minRatioX);
        }

        const dy_ = dy(zoom);
        const zoomedInTooFarY = dy_ <= dy(oldZoom) && dy_ < minRatioY;

        if (zoomedInTooFarY) {
            zoom.y = constrainAxisWithOld(zoom.y, oldZoom.y, minRatioY);
        }

        zoomManager.updateZoom('zoom', zoom);
    }

    private updateAxisZoom(
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        axisZoom: _ModuleSupport.ZoomState | undefined
    ) {
        const {
            enableIndependentAxes,
            minRatioX,
            minRatioY,
            ctx: { zoomManager },
        } = this;

        if (!axisZoom) return;

        const zoom = this.getZoom();

        if (enableIndependentAxes !== true) {
            zoom[direction] = axisZoom;
            this.updateUnifiedZoom(zoom);
            return;
        }

        const deltaAxis = axisZoom.max - axisZoom.min;
        const deltaOld = zoom[direction].max - zoom[direction].min;
        const minRatio = direction === ChartAxisDirection.X ? minRatioX : minRatioY;

        if (deltaAxis <= deltaOld && deltaAxis < minRatio) {
            return;
        }

        zoomManager.updateAxisZoom('zoom', axisId, axisZoom);
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
            minRatioX: overrides?.minRatioX ?? this.minRatioX,
            minRatioY: overrides?.minRatioY ?? this.minRatioY,
            scrollingStep: overrides?.scrollingStep ?? this.scrollingStep,
        };
    }
}
