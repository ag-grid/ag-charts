import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import { FocusIndicator } from '../../dom/focusIndicator';
import { FocusSwapChain } from '../../dom/focusSwapChain';
import { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { Transformable } from '../../scene/transformable';
import { BaseManager } from '../../util/baseManager';
import { createId } from '../../util/id';
import { clamp } from '../../util/number';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import { excludesType } from '../../util/type-guards';
import type { KeyboardWidgetEvent } from '../../widget/widgetEvents';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import type { ChartMode } from '../chartMode';
import { ChartUpdateType } from '../chartUpdateType';
import type { HighlightChangeEvent } from '../interaction/highlightManager';
import { InteractionState } from '../interaction/interactionManager';
import { mapKeyboardEventToAction } from '../interaction/keyBindings';
import type { RegionEvent } from '../interaction/regionManager';
import { TooltipManager } from '../interaction/tooltipManager';
import { getPickedFocusBBox, makeKeyboardPointerEvent } from '../keyboardUtil';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_TOOLTIP_CLASS, Tooltip, type TooltipContent, tooltipContentAriaLabel } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type PickFocusOutputs, type Series } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { ISeries, SeriesNodeDatum } from './seriesTypes';
import { pickNode } from './util';

export interface SeriesAreaChartDependencies {
    fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
    getUpdateType(): ChartUpdateType;
    chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'standalone' | 'gauge';
    seriesRoot: TranslatableGroup;
    ctx: ChartContext;
    tooltip: Tooltip;
    highlight: ChartHighlight;
    overlays: ChartOverlays;
    mode: ChartMode;
}

type TooltipEventTypes = 'hover' | 'click' | 'dblclick';
type HighlightEventTypes = 'hover' | 'drag' | 'click' | 'dblclick';

export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private series: Series<any, any>[] = [];
    private seriesRect?: BBox;
    private hoverRect?: BBox;
    private readonly focusIndicator: FocusIndicator;
    private readonly swapChain: FocusSwapChain;

    private readonly highlight = {
        /** Last received event that still needs to be applied. */
        pendingHoverEvent: undefined as RegionEvent<HighlightEventTypes> | undefined,
        /** Last applied event. */
        appliedHoverEvent: undefined as RegionEvent<HighlightEventTypes> | undefined,
        /** Last applied event, which has been temporarily stashed during the main chart update cycle. */
        stashedHoverEvent: undefined as RegionEvent<HighlightEventTypes> | undefined,
    };

    private readonly tooltip = {
        lastHover: undefined as RegionEvent<TooltipEventTypes> | undefined,
    };

    /**
     * A11y Requirements for Tooltip/Highlight (see AG-13051 for details):
     *
     *   -   When the series-area is blurred, always the mouse to update the tooltip/highlight.
     *
     *   -   When the series-area receives a `focus` event, use `:focus-visible` to guess the input device.
     *       (this is decided by the browser).
     *
     *   -   For keyboard users, `focus` and `keydown` events always updates & shows the tooltip/highlight on
     *       the currently (or newly) focused datum.
     *
     *   -   For keyboard users, `mousemove` events update the tooltip/highlight iff `pickNode` finds a match
     *       for the mouse event offsets.
     */
    private hoverDevice: 'mouse' | 'keyboard' = 'mouse';

    /**
     * This is the "second last" input event. It can be useful for keydown
     * events that for which don't to set the isFocusVisible state
     * (e.g. Backspace/Delete key on FC annotations, see AG-13041).
     *
     * Use with caution! The focus indicator must ALWAYS be visible for
     * keyboard-only users.
     */
    private previousInputDevice: 'mouse' | 'keyboard' = 'keyboard';

    private readonly focus = {
        sortedSeries: [] as Series<SeriesNodeDatum, SeriesProperties<object>>[],
        series: undefined as Series<any, any> | undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined as SeriesNodeDatum | undefined,
    };

    public constructor(private readonly chart: SeriesAreaChartDependencies) {
        super();
        const { Clickable, All } = InteractionState;

        const label1 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label1');
        const label2 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label2');
        this.swapChain = new FocusSwapChain(label1, label2, this.id, 'img');
        this.swapChain.addListener('blur', () => this.onBlur());
        this.swapChain.addListener('focus', () => this.onFocus());
        this.focusIndicator = new FocusIndicator(this.swapChain);
        this.focusIndicator.overrideFocusVisible(chart.mode === 'integrated' ? false : undefined); // AG-13197

        const seriesRegion = chart.ctx.regionManager.getRegion('series');
        this.destroyFns.push(
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label1'),
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label2'),
            seriesRegion.addListener('drag', (event) => this.onHoverLikeEvent(event), Clickable),
            seriesRegion.addListener('hover', (event) => this.onHover(event), Clickable),
            seriesRegion.addListener('wheel', (event) => this.onWheel(event), Clickable),
            seriesRegion.addListener('leave', () => this.onLeave(), Clickable),
            chart.ctx.widgets.seriesWidget.addListener('keydown', (event) => this.onKeyDown(event)),
            chart.ctx.animationManager.addListener('animation-start', () => this.clearAll()),
            chart.ctx.domManager.addListener('resize', () => this.clearAll()),
            chart.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            chart.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            chart.ctx.regionManager.listenAll('contextmenu', (event) => this.onContextMenu(event), All),
            chart.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            chart.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            chart.ctx.updateService.addListener('pre-scene-render', () => this.preSceneRender()),
            chart.ctx.updateService.addListener('update-complete', () => this.updateComplete()),
            chart.ctx.zoomManager.addListener('zoom-change', () => this.clearAll()),
            chart.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearAll())
        );
    }

    private isState(allowedStates: InteractionState) {
        return this.chart.ctx.interactionManager.isState(allowedStates);
    }

    public dataChanged() {
        this.highlight.stashedHoverEvent ??= this.highlight.appliedHoverEvent;
        this.chart.ctx.tooltipManager.removeTooltip(this.id);
        this.focusIndicator.focus = undefined;
        this.clearHighlight();
    }

    private preSceneRender() {
        if (this.highlight.stashedHoverEvent != null) {
            this.highlight.pendingHoverEvent = this.highlight.stashedHoverEvent;
            this.highlight.stashedHoverEvent = undefined;
            this.handleHoverHighlight(true);
        }

        if (this.tooltip.lastHover != null) {
            this.handleHoverTooltip(this.tooltip.lastHover, true);
        }
    }

    private updateComplete() {
        if (this.focusIndicator.isFocusVisible()) {
            // This function is called when something in the scene is redrawn such as a resize, or zoompan change.
            // Therefore we need to update the bounds of the focus indicator, but not aria-label. Hence refresh=true.
            this.handleSeriesFocus(0, 0, true);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.chart.ctx.updateService.update(type, opts);
    }

    public seriesChanged(series: Series<SeriesNodeDatum, SeriesProperties<object>>[]) {
        this.focus.sortedSeries = [...series].sort((a, b) => {
            let fpA = a.properties.focusPriority ?? Infinity;
            let fpB = b.properties.focusPriority ?? Infinity;
            if (fpA === fpB) {
                [fpA, fpB] = [a._declarationOrder, b._declarationOrder];
            }
            // Note: `Infinity-Infinity` results in `NaN`, so use `<` comparison instead of `-` subtraction.
            if (fpA < fpB) {
                return -1;
            } else if (fpA > fpB) {
                return 1;
            }
            return 0;
        });
        this.series = series;
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.seriesRect = event.series.rect;
        this.hoverRect = event.series.paddedRect;
        this.chart.ctx.widgets.seriesWidget.setBounds(event.series.paddedRect);
        this.chart.ctx.widgets.chartWidget.setBounds(event.chart);
        this.focusIndicator.rect = this.seriesRect;
    }

    private onContextMenu(event: RegionEvent<'contextmenu'>): void {
        if (event.region === 'root') {
            if (this.isState(InteractionState.ContextMenuable)) {
                this.chart.ctx.contextMenuRegistry.dispatchContext('all', event, {});
            }
            return;
        }

        let pickedNode: SeriesNodeDatum | undefined;
        let position: { x: number; y: number } | undefined;
        if (this.focusIndicator.isFocusVisible()) {
            pickedNode = this.chart.ctx.highlightManager.getActiveHighlight();
            if (pickedNode && this.seriesRect && pickedNode.midPoint) {
                position = Transformable.toCanvasPoint(
                    pickedNode.series.contentGroup,
                    pickedNode.midPoint.x,
                    pickedNode.midPoint.y
                );
            }
        } else if (this.isState(InteractionState.ContextMenuable)) {
            const match = pickNode(this.series, { x: event.regionX, y: event.regionY }, 'context-menu');
            if (match) {
                this.chart.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        const pickedSeries = pickedNode?.series;

        this.clearAll();
        this.chart.ctx.contextMenuRegistry.dispatchContext(
            'series-area',
            event,
            { pickedSeries, pickedNode },
            position
        );
    }

    private onLeave(): void {
        this.chart.ctx.cursorManager.updateCursor(this.id);
        if (!this.focusIndicator.isFocusVisible()) this.clearAll();
    }

    private onWheel(_event: RegionEvent<'wheel'>): void {
        this.focusIndicator?.overrideFocusVisible(false);
        this.previousInputDevice = 'mouse';
    }

    private onHover(event: RegionEvent<'hover'>): void {
        this.onHoverLikeEvent(event);
    }

    private onHoverLikeEvent(event: RegionEvent<HighlightEventTypes>): void {
        if (excludesType(event, 'drag')) {
            this.tooltip.lastHover = event;
        }
        this.hoverDevice = 'mouse';
        this.previousInputDevice = 'mouse';
        this.highlight.pendingHoverEvent = event;
        this.hoverScheduler.schedule();

        if (this.isState(InteractionState.Default)) {
            const { regionX: x, regionY: y } = event;
            const found = pickNode(this.series, { x, y }, 'event');
            if (found?.series.hasEventListener('nodeClick') || found?.series.hasEventListener('nodeDoubleClick')) {
                this.chart.ctx.cursorManager.updateCursor(this.id, 'pointer');
            } else {
                this.chart.ctx.cursorManager.updateCursor(this.id);
            }
        }
    }

    private onClick(event: RegionEvent<'click' | 'dblclick'>) {
        this.focusIndicator.overrideFocusVisible(false);
        this.onHoverLikeEvent(event);
        if (this.seriesRect?.containsPoint(event.canvasX, event.canvasY) && this.checkSeriesNodeClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            event.preventDefault();
            return;
        }

        // Fallback to Chart-level event dispatch.
        const newEvent = { type: event.type === 'click' ? 'click' : 'doubleClick', event: event.sourceEvent } satisfies
            | AgChartClickEvent
            | AgChartDoubleClickEvent;
        this.chart.fireEvent(newEvent);
    }

    private onFocus(): void {
        if (!this.isState(InteractionState.Keyable)) return;
        this.hoverDevice = this.focusIndicator.isFocusVisible() ? 'keyboard' : 'mouse';
        this.handleFocus(0, 0);
    }

    private onBlur() {
        if (!this.isState(InteractionState.Keyable)) return;
        this.hoverDevice = 'mouse';
        this.clearAll();
        this.focusIndicator.overrideFocusVisible(undefined);
    }

    private onKeyDown(widgetEvent: KeyboardWidgetEvent<'keydown'>) {
        if (!this.isState(InteractionState.Keyable)) return;

        const actionName = mapKeyboardEventToAction(widgetEvent.sourceEvent);
        switch (actionName) {
            case 'redo':
                this.focusIndicator.overrideFocusVisible(this.previousInputDevice === 'keyboard');
                return this.chart.ctx.chartEventManager.seriesEvent('series-redo');
            case 'undo':
                this.focusIndicator.overrideFocusVisible(this.previousInputDevice === 'keyboard');
                return this.chart.ctx.chartEventManager.seriesEvent('series-undo');
            case 'zoomin':
                return this.chart.ctx.chartEventManager.seriesKeyNavZoom(1, widgetEvent);
            case 'zoomout':
                return this.chart.ctx.chartEventManager.seriesKeyNavZoom(-1, widgetEvent);
            case 'arrowdown':
                return this.onArrow(-1, 0, widgetEvent);
            case 'arrowup':
                return this.onArrow(1, 0, widgetEvent);
            case 'arrowleft':
                return this.onArrow(0, -1, widgetEvent);
            case 'arrowright':
                return this.onArrow(0, 1, widgetEvent);
            case 'submit':
                return this.onSubmit(widgetEvent);
        }
    }

    private onArrow(seriesIndexDelta: number, datumIndexDelta: number, event: KeyboardWidgetEvent<'keydown'>): void {
        if (!this.isState(InteractionState.Keyable)) return;
        this.hoverDevice = 'keyboard';
        this.previousInputDevice = 'keyboard';
        this.focusIndicator.overrideFocusVisible(true);
        this.focus.seriesIndex += seriesIndexDelta;
        this.focus.datumIndex += datumIndexDelta;
        this.handleFocus(seriesIndexDelta, datumIndexDelta);
        event.sourceEvent.preventDefault();
        this.chart.ctx.chartEventManager.seriesEvent('series-focus-change');
    }

    private onSubmit(event: KeyboardWidgetEvent<'keydown'>): void {
        if (!this.isState(InteractionState.Keyable)) return;
        const { series, datum } = this.focus;
        const sourceEvent = event.sourceEvent;
        if (series !== undefined && datum !== undefined) {
            series.fireNodeClickEvent(sourceEvent, datum);
        } else {
            this.chart.fireEvent<AgChartClickEvent>({
                type: 'click',
                event: sourceEvent,
            });
        }
        sourceEvent.preventDefault();
    }

    private checkSeriesNodeClick(event: RegionEvent<'click' | 'dblclick'> & { preventZoomDblClick?: boolean }) {
        let point = { x: event.regionX, y: event.regionY };
        if (event.region !== 'series') {
            point = Transformable.fromCanvasPoint(this.chart.seriesRoot, event.canvasX, event.canvasY);
        }
        const result = pickNode(this.series, point, 'event');
        if (result == null) return false;

        if (event.type === 'click') {
            result.series.fireNodeClickEvent(event.sourceEvent, result.datum);
            return true;
        }

        if (event.type === 'dblclick') {
            // See: AG-11737#TC3, AG-11676
            //
            // The Zoom module's double-click handler resets the zoom, but only if there isn't an
            // exact match on a node. This is counter-intuitive, and there's no built-in mechanism
            // in the InteractionManager / RegionManager for the Zoom module to listen to non-exact
            // series-rect double-clicks. As a workaround, we'll set this boolean to tell the Zoom
            // double-click handler to ignore the event whenever we are double-clicking exactly on
            // a node.
            event.preventZoomDblClick = result.distance === 0;

            result.series.fireNodeDoubleClickEvent(event.sourceEvent, result.datum);
            return true;
        }

        return false;
    }

    private handleFocus(seriesIndexDelta: number, datumIndexDelta: number) {
        const overlayFocus = this.chart.overlays.getFocusInfo(this.chart.ctx.localeManager);
        if (overlayFocus == null) {
            this.handleSeriesFocus(seriesIndexDelta, datumIndexDelta);
        } else {
            this.focusIndicator.focus = overlayFocus.rect;
            this.focusIndicator.clip = false;
        }
    }

    private handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number, refresh = false) {
        if (this.chart.chartType === 'hierarchy') {
            this.handleHierarchySeriesFocus(otherIndexDelta, datumIndexDelta, refresh);
            return;
        }
        const { focus, seriesRect } = this;
        const visibleSeries = focus.sortedSeries.filter((s) => s.visible);
        if (visibleSeries.length === 0) return;

        // Update focused series:
        focus.seriesIndex = clamp(0, focus.seriesIndex, visibleSeries.length - 1);
        focus.series = visibleSeries[focus.seriesIndex];

        // Update focused datum:
        const { datumIndex, seriesIndex: otherIndex } = focus;
        const pick = focus.series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick, refresh);
    }

    private handleHierarchySeriesFocus(otherIndexDelta: number, datumIndexDelta: number, refresh: boolean) {
        // Hierarchial charts (treemap, sunburst) can only have 1 series. So we'll repurpose the focus.seriesIndex
        // value to control the focused depth. This allows the hierarchial charts to piggy-back on the base keyboard
        // handling implementation.
        this.focus.series = this.focus.sortedSeries[0];
        const {
            focus: { series, seriesIndex: otherIndex, datumIndex },
            seriesRect,
        } = this;
        if (series == null) return;
        const pick = series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick, refresh);
    }

    private updatePickedFocus(pick: PickFocusOutputs | undefined, refresh: boolean) {
        const { focus, hoverRect } = this;
        if (pick === undefined || focus.series === undefined || hoverRect === undefined) return;

        const { datum, datumIndex } = pick;
        focus.datumIndex = datumIndex;
        focus.datum = datum;

        if (this.focusIndicator.isFocusVisible()) {
            this.chart.ctx.animationManager.reset();
        }

        if (this.focusIndicator.isFocusVisible()) {
            const focusBBox: Readonly<BBox> = getPickedFocusBBox(pick);
            const { x, y } = focusBBox.computeCenter();
            if (!hoverRect.containsPoint(x, y)) {
                const panSuccess = this.chart.ctx.zoomManager.panToBBox(this.id, hoverRect, focusBBox);
                if (panSuccess) {
                    return; // Wait for update to ensure that we show the tooltip/highlight correctly.
                }
            }
        }

        // Update the bounds of the focus indicator:
        this.focusIndicator.clip = pick.clipFocusBox;
        this.focusIndicator.focus = pick.showFocusBox ? pick.bounds : undefined;

        const keyboardEvent = makeKeyboardPointerEvent(hoverRect, pick);

        // Update highlight/tooltip for keyboard users:
        if (keyboardEvent !== undefined && this.hoverDevice === 'keyboard') {
            // Stop pending async mouse events from updating the highlight/tooltip. At this point, the most recent event
            // came from the keyboard so that's what we should honour.
            this.tooltip.lastHover = undefined;
            this.highlight.appliedHoverEvent = undefined;
            this.highlight.pendingHoverEvent = undefined;
            this.highlight.stashedHoverEvent = undefined;

            const tooltipContent = focus.series.getTooltipContent(datum);
            const meta = TooltipManager.makeTooltipMeta(keyboardEvent, datum);
            this.chart.ctx.highlightManager.updateHighlight(this.id, datum);
            this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, tooltipContent);
            if (!refresh) {
                this.swapChain.update(this.getDatumAriaText(datum, tooltipContent));
            }
        }
    }

    private getDatumAriaText(datum: SeriesNodeDatum, tooltipContent: TooltipContent | string | undefined): string {
        const description = tooltipContent == null ? '' : tooltipContentAriaLabel(tooltipContent);
        return this.chart.ctx.localeManager.t('ariaAnnounceHoverDatum', {
            datum: datum.series.getDatumAriaText?.(datum, description) ?? description,
        });
    }

    private clearHighlight() {
        this.highlight.pendingHoverEvent = undefined;
        this.highlight.appliedHoverEvent = undefined;
        this.chart.ctx.highlightManager.updateHighlight(this.id);
    }

    private clearTooltip() {
        this.chart.ctx.tooltipManager.removeTooltip(this.id);
        this.tooltip.lastHover = undefined;
    }

    private clearAll() {
        this.clearHighlight();
        this.clearTooltip();
        this.focusIndicator.focus = undefined;
    }

    private readonly hoverScheduler = debouncedAnimationFrame(() => {
        if (!this.tooltip.lastHover && !this.highlight.pendingHoverEvent) return;

        if (this.chart.getUpdateType() <= ChartUpdateType.SERIES_UPDATE) {
            // Reschedule until the current update processing is complete, if we try to
            // perform a highlight mid-update then we may not have fresh node data to work with.
            this.hoverScheduler.schedule();
            return;
        }

        if (this.highlight.pendingHoverEvent) {
            this.handleHoverHighlight(false);
        }
        if (this.tooltip.lastHover) {
            this.handleHoverTooltip(this.tooltip.lastHover, false);
        }
    });

    private handleHoverHighlight(redisplay: boolean) {
        this.highlight.appliedHoverEvent = this.highlight.pendingHoverEvent;
        this.highlight.pendingHoverEvent = undefined;

        const event = this.highlight.appliedHoverEvent;
        if (!event || !this.isState(InteractionState.Clickable)) return;

        const { canvasX, canvasY } = event;
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(canvasX, canvasY)) {
            this.clearHighlight();
            return;
        }

        let pickCoords = { x: event.regionX, y: event.regionY };
        if (event.region !== 'series') {
            pickCoords = Transformable.fromCanvasPoint(this.chart.seriesRoot, canvasX, canvasY);
        }

        const { range } = this.chart.highlight;
        const intent = range === 'tooltip' ? 'highlight-tooltip' : 'highlight';
        const found = pickNode(this.series, pickCoords, intent);
        if (found) {
            this.chart.ctx.highlightManager.updateHighlight(this.id, found.datum);
            this.hoverDevice = 'mouse';
            return;
        }

        this.chart.ctx.highlightManager.updateHighlight(this.id); // FIXME: clearHighlight?
    }

    private handleHoverTooltip(event: RegionEvent<TooltipEventTypes>, redisplay: boolean) {
        if (!this.isState(InteractionState.Clickable)) return;

        const { canvasX, canvasY, regionX, regionY } = event;
        const targetElement = event.sourceEvent.target as HTMLElement;
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(canvasX, canvasY)) {
            if (this.hoverDevice == 'mouse') this.clearTooltip();
            return;
        }

        if (
            targetElement &&
            this.chart.tooltip.interactive &&
            this.chart.ctx.domManager.isManagedChildDOMElement(targetElement, 'canvas-overlay', DEFAULT_TOOLTIP_CLASS)
        ) {
            // Skip tooltip update if tooltip is interactive, and the source event was for a tooltip HTML element.
            return;
        }

        let pickCoords = { x: regionX, y: regionY };
        if (event.region !== 'series') {
            pickCoords = Transformable.fromCanvasPoint(this.chart.seriesRoot, canvasX, canvasY);
        }

        const pick = pickNode(this.series, pickCoords, 'tooltip');
        if (!pick) {
            if (this.hoverDevice == 'mouse') this.clearTooltip();
            return;
        }

        this.hoverDevice = 'mouse';
        const content = pick.series.getTooltipContent(pick.datum);
        const tooltipEnabled = this.chart.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && content != null;
        if (shouldUpdateTooltip) {
            const meta = TooltipManager.makeTooltipMeta(event, pick.datum);
            this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, content);
        }
    }

    private changeHighlightDatum(event: HighlightChangeEvent) {
        const seriesToUpdate: Set<ISeries<any, any>> = new Set();
        const { series: newSeries = undefined, datum: newDatum } = event.currentHighlight ?? {};
        const { series: lastSeries = undefined, datum: lastDatum } = event.previousHighlight ?? {};

        if (lastSeries) {
            seriesToUpdate.add(lastSeries);
        }

        if (newSeries) {
            seriesToUpdate.add(newSeries);
        }

        // Adjust cursor if a specific datum is highlighted, rather than just a series.
        if (lastSeries?.properties.cursor && lastDatum) {
            this.chart.ctx.cursorManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.properties.cursor && newSeries?.properties.cursor !== 'default' && newDatum) {
            this.chart.ctx.cursorManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }
}
