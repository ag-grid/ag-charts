import { _ModuleSupport, _Widget } from 'ag-charts-community';
import type {
    AxisID,
    BaseStyleTypeMap,
    CartesianAxisDirection,
    DefinedZoomState,
    DynamicContext,
    NormalisedSelectionOptions,
    NormalisedZoomOptions,
    ZoomMinMax,
} from 'ag-charts-core';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    ChartUpdateType,
    UNIT_MAX,
    UNIT_MIN,
    definedZoomState,
    entries,
    isNumberEqual,
    roundTo,
    toZoomState,
} from 'ag-charts-core';

import { ZoomScrollPanner } from '../zoom-interaction/zoomScrollPanner';
import { ZoomRect } from './scenes/zoomRect';
import { ZoomAutoScaler } from './zoomAutoScale';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomContextMenu } from './zoomContextMenu';
import { ZoomOnDataChange } from './zoomOnDataChange';
import { type ZoomPanUpdate, ZoomPanner } from './zoomPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import { ZoomToolbar } from './zoomToolbar';
import { ZoomTwoFingers } from './zoomTwoFingers';
import type { ZoomProperties } from './zoomTypes';
import {
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

// Extends the normalised type with undocumented options available at runtime.
type ZoomOpts = NormalisedZoomOptions & { enableIndependentAxes?: boolean };

const DISABLED_OPTS: ZoomOpts = { enabled: false } as ZoomOpts;

// `zoomManager` is optional on _ModuleSupport.ChartRegistry, but the zoom module registers it in
// its own `register()` hook, so it is guaranteed present whenever Zoom is
// instantiated. Narrow once here rather than asserting `!` at every call site.
export type ZoomCtx = Omit<DynamicContext<_ModuleSupport.ChartRegistry>, 'zoomManager'> & {
    readonly zoomManager: _ModuleSupport.ZoomManager;
};

export class Zoom extends AbstractModuleInstance {
    private get opts(): ZoomOpts {
        return this.ctx.chartState.getValue('options', 'zoom') ?? DISABLED_OPTS;
    }

    private get selectionOpts(): NormalisedSelectionOptions | undefined {
        return this.ctx.chartState.getValue('options', 'selection');
    }

    // Public getter required by `hasViewportSupport()` in chart.ts.
    get enabled(): boolean {
        return this.opts.enabled;
    }

    // Scenes
    private seriesRect?: _ModuleSupport.BBox;
    private paddedRect?: _ModuleSupport.BBox;

    // Zoom methods
    private readonly axisDragger = new ZoomAxisDragger();
    private readonly autoScaler: ZoomAutoScaler;
    private readonly contextMenu: ZoomContextMenu;
    private readonly panner = new ZoomPanner(this.ctx);
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();
    private readonly scrollPanner = new ZoomScrollPanner();
    private readonly twoFingers = new ZoomTwoFingers();
    private readonly buttons: ZoomToolbar;

    private hoveredAxisId?: AxisID;
    private hoveredAxisDirection?: ChartAxisDirection;

    // State
    private dragState = DragState.None;
    private shouldFlipXY?: boolean;
    private readonly isState = (state: _ModuleSupport.InteractionState) => this.ctx.interactionManager.isState(state);

    private destroyContextMenuActions: (() => void) | undefined = undefined;

    constructor(private readonly ctx: ZoomCtx) {
        super();

        const self = this;

        this.buttons = new ZoomToolbar(
            ctx,
            this.getModuleProperties.bind(this),
            this.updateZoom.bind(this),
            this.updateAxisZoom.bind(this),
            this.resetZoom.bind(this),
            this.isZoomValid.bind(this)
        );

        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect, this.getZoom.bind(this), this.isZoomValid.bind(this));
        this.contextMenu = new ZoomContextMenu(
            ctx.eventsHub,
            ctx.contextMenuRegistry,
            ctx.chartState,
            ctx.zoomManager,
            this.getModuleProperties.bind(this),
            () => this.paddedRect,
            this.updateZoom.bind(this),
            this.isZoomValid.bind(this)
        );

        // FIXME(AG-8627 TC10; AG-16414) `minVisibleItems` should have its own zoom:change-request handling
        const minVisibleItemsCallback = (event: _ModuleSupport.ZoomChangeRequestEvent): void => {
            if (this.opts.minVisibleItems > 0) {
                const restrictions = event.stateAsDefinedZoom();
                event.constrainZoom(this.constrainZoom(restrictions));
            }
        };
        // eslint-disable-next-line sonarjs/constructor-for-side-effects -- event handlers keep instance alive via cleanup registry
        new ZoomOnDataChange({
            chartState: ctx.chartState,
            eventsHub: ctx.eventsHub,
            zoomManager: ctx.zoomManager,
            axisManager: ctx.axisManager,
            cleanup: this.cleanup,
            onConstrainChanges: minVisibleItemsCallback,
            get opts() {
                return self.opts.onDataChange;
            },
        });

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
            ctx.eventsHub.on('zoom-interaction:zoom:axis-mouseleave', () => this.onAxisMouseLeave()),
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
            ctx.eventsHub.on('update:process-data', (event) => this.onProcessData(event)),
            ctx.eventsHub.on('layout:complete', (event) => this.onLayoutComplete(event)),
            ctx.eventsHub.on('zoom:change-request', (event) => this.onZoomChangeRequested(event)),
            ctx.eventsHub.on('zoom:pan-start', (event) => this.onZoomPanStart(event)),
            this.panner.addListener('update', (event) => this.onPanUpdate(event)),
            () => this.teardown()
        );

        // Init last, because we want `autoScaling` to be the last listener for `zoom:change-event` events:
        this.autoScaler = new ZoomAutoScaler({
            zoomManager: ctx.zoomManager,
            eventsHub: ctx.eventsHub,
            chartState: ctx.chartState,
            cleanup: this.cleanup,
            opts: {
                get enabled() {
                    return self.opts.enabled;
                },
                get enableIndependentAxes() {
                    return self.opts.enableIndependentAxes;
                },
                get autoScaling() {
                    return self.opts.autoScaling;
                },
            },
        });

        // Observe option changes. The callback runs immediately during registration
        // (chartState is populated before module creation), handling initial setup too.
        let prevEnabled: boolean | undefined;
        this.cleanup.register(
            ctx.chartState.observe((get) => {
                const opts = get('options', 'zoom');
                if (opts == null) return;

                ctx.zoomManager.setIndependentAxes(Boolean((opts as ZoomOpts).enableIndependentAxes));
                this.panner.deceleration = opts.deceleration;

                // ZoomToolbar still uses @Property/@ActionOnSet — sync options via set()
                if (opts.buttons) {
                    this.buttons.set(opts.buttons);
                }

                if (prevEnabled !== opts.enabled) {
                    prevEnabled = opts.enabled;
                    this.onEnabledChange(opts.enabled);
                }

                this.refreshTouchAction();
            }),
            ctx.eventsHub.on('zoom:change-complete', () => this.refreshTouchAction()),
            () => ctx.widgets.seriesWidget.setTouchAction(undefined)
        );
    }

    // iOS Safari ignores late preventDefault on touchmove, so suppress browser scroll via
    // touch-action. `pan-y` at [0,1] lets single-finger pans bubble; pinch still reaches us.
    private prevTouchAction: 'auto' | 'none' | 'pan-y' | undefined;
    private refreshTouchAction() {
        const { enabled, enablePanning, enableTwoFingerZoom } = this.opts;
        let next: 'none' | 'pan-y' | undefined;
        if (enabled && (enablePanning || enableTwoFingerZoom)) {
            next = isMaxZoom(this.getZoom()) ? 'pan-y' : 'none';
        }
        if (this.prevTouchAction === next) return;
        this.prevTouchAction = next;
        this.ctx.widgets.seriesWidget.setTouchAction(next);
    }

    private teardown() {
        this.ctx.zoomManager.setZoomModuleEnabled(false);
        this.buttons.destroy();
        this.destroyContextMenuActions?.();
    }

    private onEnabledChange(enabled: boolean) {
        this.ctx.zoomManager.setZoomModuleEnabled(enabled);
        this.destroyContextMenuActions?.();
        this.destroyContextMenuActions = this.contextMenu.registerActions(enabled);
    }

    private isIgnoredTouch(event: Pick<_Widget.DragWidgetEvent, 'device'> | undefined): boolean {
        if (event?.device !== 'touch') {
            return false;
        }
        if (this.ctx.chartState.getValue('options', 'touch').dragAction !== 'drag') {
            return true;
        }
        const { enableSelecting, enablePanning } = this.opts;
        if (enableSelecting) {
            return false;
        }
        if (!enablePanning) {
            return true;
        }
        return isMaxZoom(this.getZoom());
    }

    private onSeriesAreaDoubleClick(
        event?: _ModuleSupport.DragInterpreterDblClickEvent & { preventZoomDblClick?: boolean }
    ) {
        const { enabled, enableDoubleClickToReset } = this.opts;

        if (!enabled || !enableDoubleClickToReset) return;
        if (event?.preventZoomDblClick || !this.isState(InteractionState.ZoomClickable)) return;

        this.resetZoom('zoom-seriesarea-dblclick');
    }

    private onSeriesAreaDragStart(event: _Widget.DragWidgetEvent<'drag-start'>) {
        const { enabled, enablePanning, enableSelecting } = this.opts;
        const {
            ctx: { domManager },
            ctx,
        } = this;
        const zoomManager = ctx.zoomManager;

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

        const selectionOpts = this.selectionOpts;
        const hasDataSelection: boolean = !!(selectionOpts?.enabled && selectionOpts?.enableDrag);
        const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent as MouseEvent);
        const modifierlessDragInUse = enableSelecting || hasDataSelection;
        // Allow panning if either selection is disabled or the panning key is pressed.
        if (enablePanning && (!modifierlessDragInUse || panKeyPressed)) {
            domManager.updateCursor(CURSOR_ID, 'grabbing');
            newDragState = DragState.Pan;
            this.panner.start();
        } else if (enableSelecting && !panKeyPressed) {
            if (!hasDataSelection) {
                newDragState = DragState.Select;
            }
        }

        if ((this.dragState = newDragState) !== DragState.None) {
            zoomManager.fireZoomPanStartEvent('zoom');
        }
    }

    private onSeriesAreaDragMove(event: _Widget.DragWidgetEvent<'drag-move'>) {
        const { enabled } = this.opts;
        const {
            dragState,
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

        if (!interactionManager.isState(_ModuleSupport.InteractionState.Frozen)) {
            tooltipManager.updateTooltip(TOOLTIP_ID);
        }
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

        if (!this.opts.enabled || this.dragState === DragState.None) return;

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
        this.hoveredAxisId = event.axisId;
        this.hoveredAxisDirection = event.direction;
        this.updateAxisCursor(event.direction, event);
    }

    // Computes and applies the axis-hover cursor (ew/ns-resize, or grab in pan mode). Extracted from the
    // mouseenter handler so it can also be re-applied on drag end: releasing the mouse while still hovering
    // the axis must keep the resize cursor, but no fresh `mouseenter` fires because the pointer never left
    // the axis region. The optional `event` is only present on the mouseenter path.
    private updateAxisCursor(
        direction: ChartAxisDirection,
        event?: _ModuleSupport.ZoomInteractionAxisMouseEvent<'mouseenter'>
    ) {
        const { anchorPointX, anchorPointY, axisDraggingMode, enabled, enableAxisDragging } = this.opts;

        if (!enabled || !enableAxisDragging) {
            this.ctx.domManager.updateCursor(CURSOR_ID);
            return;
        }

        const zoom = this.getZoom();

        let cursor: BaseStyleTypeMap['cursor'];
        let showCursor = false;

        if (direction === ChartAxisDirection.X) {
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
            event?.stopProcessing();
            this.ctx.domManager.updateCursor(CURSOR_ID, cursor);
        } else {
            this.ctx.domManager.updateCursor(CURSOR_ID);
        }
    }

    private onAxisMouseLeave() {
        this.hoveredAxisId = undefined;
        this.hoveredAxisDirection = undefined;
        this.ctx.domManager.updateCursor(CURSOR_ID);

        const { enabled, enableAxisDragging } = this.opts;
        if (!enabled || !enableAxisDragging) return;
    }

    private onAxisDoubleClick(id: AxisID) {
        const { enabled, enableDoubleClickToReset } = this.opts;
        const { ctx } = this;
        const zoomManager = ctx.zoomManager;

        if (!enabled || !enableDoubleClickToReset || !this.isState(InteractionState.ZoomClickable)) return;

        this.previousAxisZoomValid = { [ChartAxisDirection.X]: true, [ChartAxisDirection.Y]: true };
        zoomManager.resetAxisZoom({ source: 'user-interaction', sourceDetail: 'zoom-axis-dblclick' }, id);
    }

    private onAxisDragStart(direction: ChartAxisDirection) {
        const { axisDraggingMode, enabled, enableAxisDragging } = this.opts;
        const { panner, ctx } = this;
        const zoomManager = ctx.zoomManager;
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
        const { anchorPointX, anchorPointY, enabled, enableAxisDragging } = this.opts;
        const {
            axisDragger,
            dragState,
            seriesRect,
            shouldFlipXY,
            ctx: { interactionManager, tooltipManager, eventsHub },
        } = this;

        if (!enabled || !enableAxisDragging || !seriesRect) return;

        interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);
        if (event.device === 'touch') {
            event.sourceEvent.preventDefault();
        }

        const zoom = this.getZoom();

        if (dragState === DragState.Pan) {
            this.panner.update(event);
        } else {
            let anchor = direction === ChartAxisDirection.X ? anchorPointX : anchorPointY;
            if (shouldFlipXY) anchor = direction === ChartAxisDirection.X ? anchorPointY : anchorPointX;
            const axisZoom = this.ctx.zoomManager.getAxisZoom(axisId);
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
        const { axisDraggingMode, enabled, enableAxisDragging } = this.opts;
        const {
            axisDragger,
            dragState,
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
        // The pointer never left the axis region during the drag, so no `mouseenter` will re-fire to restore
        // the hover cursor. Re-apply it here when still hovering an axis; otherwise clear it. In the released-
        // off-axis case `hoveredAxisId` may momentarily be stale, but the drag machinery synthesises a
        // `mouseleave` immediately after this handler, which clears it again.
        if (this.hoveredAxisId != null && this.hoveredAxisDirection != null) {
            this.updateAxisCursor(this.hoveredAxisDirection);
        } else {
            domManager.updateCursor(CURSOR_ID);
        }
        tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onNavZoom(event: _ModuleSupport.SeriesKeyNavZoomEvent) {
        const { enabled, enableScrolling } = this.opts;
        const { scroller } = this;
        const isFocusableState = this.ctx.interactionManager.isState(_ModuleSupport.InteractionState.Focusable);

        if (!isFocusableState || !enabled || !enableScrolling) return;
        event.widgetEvent.sourceEvent.preventDefault();

        this.updateZoom(
            userInteraction(`keyboard(${event.delta})`),
            scroller.updateDelta(event.delta, this.getModuleProperties(), this.getZoom())
        );
    }

    private onNavPanX(event: _ModuleSupport.SeriesKeyNavPanXEvent) {
        const { enabled } = this.opts;
        const isFocusableState = this.ctx.interactionManager.isState(_ModuleSupport.InteractionState.Focusable);

        if (!isFocusableState || !enabled) return;
        event.widgetEvent.sourceEvent.preventDefault();

        const delta: typeof event.delta = event.reverse
            ? ({ [-1]: 1, [1]: -1, home: 'end', end: 'home' } as const)[event.delta]
            : event.delta;
        const zoom = this.getZoom();
        const xdiff = dx(zoom);
        if (delta === 'home') {
            zoom.x.min = 0;
            zoom.x.max = xdiff;
        } else if (delta === 'end') {
            zoom.x.min = 1 - xdiff;
            zoom.x.max = 1;
        } else {
            const scrollDelta: number = delta * xdiff;
            zoom.x.min += scrollDelta;
            zoom.x.max += scrollDelta;
            zoom.x = constrainAxis(zoom.x);
        }
        this.updateZoom(userInteraction(`keyboard-page(${event.delta})`), zoom);
    }

    private onWheel(baseEvent: _ModuleSupport.ZoomInteractionWheelEvent) {
        const { enabled, enablePanning, enableScrolling, scrollingMode } = this.opts;
        const { paddedRect } = this;

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
        const { scrollingStep, scrollingMode = 'zoom' } = this.opts;
        const { scrollPanner, seriesRect, ctx } = this;
        const zoomManager = ctx.zoomManager;

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
        const { enabled, enableAxisScrolling } = this.opts;
        if (!enabled || !enableAxisScrolling) return;

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
        const { scroller, seriesRect, ctx } = this;
        const zoomManager = ctx.zoomManager;

        if (!seriesRect) {
            baseEvent.abort();
            return;
        }

        const { event } = baseEvent;

        let updated = true;

        const sourcing = userInteraction('zoom-axis-wheel');
        if (this.opts.enableIndependentAxes === true) {
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
        if (!this.opts.enableTwoFingerZoom || this.dragState !== DragState.None) return;
        if (this.twoFingers.start(event, current, this.getZoom())) {
            this.dragState = DragState.TwoFingers;
        }
    }

    private onTouchMove(event: _Widget.TouchWidgetEvent<'touchmove'>, current: _Widget.Widget) {
        if (!this.opts.enableTwoFingerZoom || this.dragState !== DragState.TwoFingers) return;
        const newZoom = this.twoFingers.update(event, current);
        this.updateZoom(userInteraction('zoom-seriesarea-twofingers'), constrainZoom(newZoom));
    }

    private onTouchEnd(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>) {
        if (!this.opts.enableTwoFingerZoom || this.dragState !== DragState.TwoFingers) return;
        event.sourceEvent.preventDefault();
        if (this.twoFingers.end(event)) {
            this.dragState = DragState.None;
        }
    }

    private onProcessData(event: _ModuleSupport.ProcessDataEvent) {
        this.shouldFlipXY = event.series.shouldFlipXY;
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const { enabled, enableDoubleClickToReset, enableAxisDragging, enableAxisScrolling } = this.opts;

        this.ctx.eventsHub.emit('axis-dom-proxy:update', {
            source: 'zoom',
            enabled,
            enableDoubleClick: enableDoubleClickToReset,
            enableDragging: enableAxisDragging,
            enableScrolling: enableAxisScrolling,
            enableContextMenu: false,
        });

        if (!enabled) return;

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
            ctx: { tooltipManager, interactionManager },
            ctx,
        } = this;
        const zoomManager = ctx.zoomManager;

        if (!seriesRect) return;

        const newZooms = panner.translateZooms(seriesRect, zoomManager.getAxisZooms(), event.deltaX, event.deltaY);
        this.updateChanges(userInteraction('zoom-seriesarea-panner'), newZooms);
        if (!interactionManager.isState(_ModuleSupport.InteractionState.Frozen)) {
            tooltipManager.updateTooltip(TOOLTIP_ID);
        }
    }

    private isPanningKeyPressed(event: MouseEvent | WheelEvent) {
        switch (this.opts.panKey) {
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

    private isScalingX(axes: ZoomOpts['axes']) {
        if (axes === 'xy') return true;
        return this.shouldFlipXY ? axes === 'y' : axes === 'x';
    }

    private isScalingY(axes: ZoomOpts['axes']) {
        if (axes === 'xy') return true;
        return this.shouldFlipXY ? axes === 'x' : axes === 'y';
    }

    private constrainZoom(newZoom: DefinedZoomState) {
        return this.ctx.zoomManager.constrainZoomToItemCount(
            newZoom,
            this.opts.minVisibleItems,
            this.autoScaler.enabled
        );
    }

    private previousZoomValid = true;
    private isZoomValid(
        newZoom: DefinedZoomState,
        options?: { directional?: boolean; includeYVisibleRange?: boolean }
    ) {
        const { minVisibleItems } = this.opts;
        const { ctx } = this;
        const zoomManager = ctx.zoomManager;

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
        const { minVisibleItems } = this.opts;
        const { ctx } = this;
        const zoomManager = ctx.zoomManager;

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
        const partialZoom = toZoomState(changes) ?? {};
        const currentZoom = this.getZoom();
        this.updateZoom(sourcing, {
            x: partialZoom.x ?? currentZoom.x,
            y: partialZoom.y ?? currentZoom.y,
        });
    }

    private updateZoom(sourcing: _ModuleSupport.UpdateZoomSourcing, zoom: DefinedZoomState) {
        if (this.opts.enableIndependentAxes) {
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
        const { enableIndependentAxes } = this.opts;
        const { ctx } = this;
        const zoomManager = ctx.zoomManager;

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
        return definedZoomState(this.ctx.chartState.getValue('zoom'));
    }

    private getModuleProperties(overrides?: Partial<ZoomProperties>): ZoomProperties {
        const { anchorPointX, anchorPointY, axes, enabled, enableIndependentAxes, keepAspectRatio, scrollingStep } =
            this.opts;
        return {
            anchorPointX: overrides?.anchorPointX ?? (this.shouldFlipXY ? anchorPointY : anchorPointX),
            anchorPointY: overrides?.anchorPointY ?? (this.shouldFlipXY ? anchorPointX : anchorPointY),
            enabled: overrides?.enabled ?? enabled,
            independentAxes: overrides?.independentAxes ?? enableIndependentAxes === true,
            isScalingX: overrides?.isScalingX ?? this.isScalingX(axes),
            isScalingY: overrides?.isScalingY ?? this.isScalingY(axes),
            keepAspectRatio: overrides?.keepAspectRatio ?? keepAspectRatio ?? false,
            scrollingStep: overrides?.scrollingStep ?? scrollingStep,
        };
    }
}
