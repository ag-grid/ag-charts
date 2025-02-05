import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import { FocusIndicator } from '../../dom/focusIndicator';
import { FocusSwapChain } from '../../dom/focusSwapChain';
import { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import type { Point } from '../../scene/point';
import { Transformable } from '../../scene/transformable';
import { BaseManager } from '../../util/baseManager';
import { createId } from '../../util/id';
import { clamp } from '../../util/number';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import type { Widget } from '../../widget/widget';
import type {
    DragWidgetEvent,
    KeyboardWidgetEvent,
    MouseWidgetEvent,
    WheelWidgetEvent,
} from '../../widget/widgetEvents';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import type { ChartMode } from '../chartMode';
import { ChartUpdateType } from '../chartUpdateType';
import type { ChartType } from '../factory/chartTypes';
import type { HighlightChangeEvent } from '../interaction/highlightManager';
import { InteractionState } from '../interaction/interactionManager';
import { mapKeyboardEventToAction } from '../interaction/keyBindings';
import { TooltipManager } from '../interaction/tooltipManager';
import { getPickedFocusBBox, makeKeyboardPointerEvent } from '../keyboardUtil';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_TOOLTIP_CLASS, Tooltip, type TooltipContent, tooltipContentAriaLabel } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type PickFocusOutputs, type Series, type SeriesNodePickIntent } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { ISeries, SeriesNodeDatum } from './seriesTypes';
import type { DragInterpreterClickEvent } from '../interaction/dragInterpreter';

export interface SeriesAreaChartDependencies {
    fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
    getUpdateType(): ChartUpdateType;
    chartType: ChartType;
    seriesRoot: TranslatableGroup;
    ctx: ChartContext;
    tooltip: Tooltip;
    highlight: ChartHighlight;
    overlays: ChartOverlays;
    mode: ChartMode;
}

type ClickLikeEvent = DragInterpreterClickEvent | MouseWidgetEvent<'click'> | MouseWidgetEvent<'dblclick'>;
type HoverLikeEvent = Partial<Pick<DragWidgetEvent, 'device'>> &
    (ClickLikeEvent | MouseWidgetEvent<'mousemove'> | DragWidgetEvent<'drag-move'>);

type PickedNode = {
    series: Series<unknown, any, any>;
    datum: SeriesNodeDatum<unknown>;
    distance: number;
};

export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private series: Series<unknown, any, any>[] = [];
    private seriesRect?: BBox;
    private hoverRect?: BBox;
    private readonly focusIndicator: FocusIndicator;
    private readonly swapChain: FocusSwapChain;

    private readonly highlight = {
        /** Last received event that still needs to be applied. */
        pendingHoverEvent: undefined as HoverLikeEvent | undefined,
        /** Last applied event. */
        appliedHoverEvent: undefined as HoverLikeEvent | undefined,
        /** Last applied event, which has been temporarily stashed during the main chart update cycle. */
        stashedHoverEvent: undefined as HoverLikeEvent | undefined,
    };

    private readonly tooltip = {
        lastHover: undefined as HoverLikeEvent | undefined,
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
    private hoverDevice: 'pointer' | 'keyboard' = 'pointer';

    /**
     * This is the "second last" input event. It can be useful for keydown
     * events that for which don't to set the isFocusVisible state
     * (e.g. Backspace/Delete key on FC annotations, see AG-13041).
     *
     * Use with caution! The focus indicator must ALWAYS be visible for
     * keyboard-only users.
     */
    private previousInputDevice: 'pointer' | 'keyboard' = 'keyboard';

    private readonly focus = {
        sortedSeries: [] as Series<unknown, SeriesNodeDatum<unknown>, SeriesProperties<object>>[],
        series: undefined as Series<unknown, any, any> | undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined as SeriesNodeDatum<unknown> | undefined,
    };

    public constructor(private readonly chart: SeriesAreaChartDependencies) {
        super();

        const label1 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label1');
        const label2 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label2');
        this.swapChain = new FocusSwapChain(label1, label2, this.id, 'img');
        this.swapChain.addListener('blur', () => this.onBlur());
        this.swapChain.addListener('focus', () => this.onFocus());
        this.focusIndicator = new FocusIndicator(this.swapChain);
        this.focusIndicator.overrideFocusVisible(chart.mode === 'integrated' ? false : undefined); // AG-13197

        const { seriesDragInterpreter, seriesWidget, containerWidget } = chart.ctx.widgets;
        seriesWidget.setTabIndex(-1);
        this.destroyFns.push(
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label1'),
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label2'),
            seriesWidget.addListener('focus', () => this.swapChain.focus()),
            seriesWidget.addListener('mousemove', (event) => this.onHover(event)),
            seriesWidget.addListener('wheel', (event) => this.onWheel(event)),
            seriesWidget.addListener('mouseleave', (event) => this.onLeave(event)),
            seriesWidget.addListener('keydown', (event) => this.onKeyDown(event)),
            seriesWidget.addListener('contextmenu', (event, current) => this.onContextMenu(event, current)),
            seriesDragInterpreter.addListener('drag-move', (event) => this.onDragMove(event)),
            seriesDragInterpreter.addListener('click', (event) => this.onClick(event, seriesWidget)),
            seriesDragInterpreter.addListener('dblclick', (event) => this.onClick(event, seriesWidget)),
            containerWidget.addListener('contextmenu', (event, current) => this.onContextMenu(event, current)),
            containerWidget.addListener('click', (event, current) => this.onClick(event, current)),
            containerWidget.addListener('dblclick', (event, current) => this.onClick(event, current)),
            chart.ctx.animationManager.addListener('animation-start', () => this.clearAll()),
            chart.ctx.domManager.addListener('resize', () => this.clearAll()),
            chart.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            chart.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            chart.ctx.updateService.addListener('pre-scene-render', () => this.preSceneRender()),
            chart.ctx.updateService.addListener('update-complete', () => this.updateComplete()),
            chart.ctx.zoomManager.addListener('zoom-change', () => this.clearAll()),
            chart.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearAll())
        );
    }

    private isState(allowedStates: InteractionState) {
        return this.chart.ctx.interactionManager.isState(allowedStates);
    }

    private isIgnoredTouch(event: HoverLikeEvent) {
        return event.device === 'touch' && this.chart.ctx.chartService.touch.dragAction !== 'hover';
    }

    public dataChanged() {
        this.highlight.stashedHoverEvent ??= this.highlight.appliedHoverEvent;
        this.chart.ctx.tooltipManager.removeTooltip(this.id);
        this.focusIndicator.clear();
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
        if (this.focusIndicator.isFocusVisible() && this.isState(InteractionState.Focusable)) {
            // This function is called when something in the scene is redrawn such as a resize, or zoompan change.
            // Therefore we need to update the bounds of the focus indicator, but not aria-label. Hence refresh=true.
            this.handleSeriesFocus(0, 0, true);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.chart.ctx.updateService.update(type, opts);
    }

    public seriesChanged(series: Series<unknown, SeriesNodeDatum<unknown>, SeriesProperties<object>>[]) {
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
    }

    private onContextMenu(event: MouseWidgetEvent<'contextmenu'>, current: Widget): void {
        const { sourceEvent } = event;
        if (sourceEvent.currentTarget != current.getElement()) return;

        if (sourceEvent.target == this.chart.ctx.widgets.containerWidget.getElement()) {
            if (this.isState(InteractionState.ContextMenuable)) {
                const { currentX: canvasX, currentY: canvasY } = event;
                this.chart.ctx.contextMenuRegistry.dispatchContext('all', { sourceEvent, canvasX, canvasY }, {});
            }
            return;
        }

        let pickedNode: SeriesNodeDatum<unknown> | undefined;
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
            const match = this.pickNode({ x: event.currentX, y: event.currentY }, 'context-menu');
            if (match) {
                this.chart.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        const pickedSeries = pickedNode?.series;

        this.clearAll();
        const canvasX = event.currentX + current.cssLeft();
        const canvasY = event.currentY + current.cssTop();
        this.chart.ctx.contextMenuRegistry.dispatchContext(
            'series-area',
            { sourceEvent, canvasX, canvasY },
            { pickedSeries, pickedNode },
            position
        );
    }

    private onLeave(event: MouseWidgetEvent<'mouseleave'>): void {
        if (!this.isState(InteractionState.Clickable)) return;

        // Edge-case: when clicking an annotation to edit the text, do not consider this 'mouseleave' event. We may want
        // to remove this check, although it will require a snapshot update.
        const relatedTarget = event.sourceEvent.relatedTarget as Partial<HTMLElement> | null;
        if (relatedTarget?.className === 'ag-charts-text-input__textarea') {
            return;
        }
        if (this.chart.ctx.tooltipManager.isEnteringInteractiveTooltip(event)) {
            return;
        }

        this.chart.ctx.domManager.updateCursor(this.id);
        if (!this.focusIndicator.isFocusVisible()) this.clearAll();
    }

    private onWheel(_event: WheelWidgetEvent): void {
        if (!this.isState(InteractionState.Clickable)) return;
        this.focusIndicator?.overrideFocusVisible(false);
        this.previousInputDevice = 'pointer';
    }

    private onDragMove(event: DragWidgetEvent<'drag-move'>): void {
        if (!this.isState(InteractionState.Clickable)) return;
        this.focusIndicator?.overrideFocusVisible(false);
        this.onHoverLikeEvent(event);
    }

    private onHover(event: MouseWidgetEvent<'mousemove'>): void {
        if (!this.isState(InteractionState.Clickable)) return;
        this.onHoverLikeEvent(event);
    }

    private onHoverLikeEvent(event: HoverLikeEvent): void {
        if (this.isIgnoredTouch(event)) return;

        if (event.device === 'touch') {
            event.sourceEvent.preventDefault();
        }
        if (event.device === 'touch' || excludesType(event, 'drag-move')) {
            this.tooltip.lastHover = event;
        }
        this.hoverDevice = 'pointer';
        this.previousInputDevice = 'pointer';
        this.highlight.pendingHoverEvent = event;
        this.hoverScheduler.schedule();

        if (this.isState(InteractionState.Default)) {
            const { currentX: x, currentY: y } = event;
            const found = this.pickNode({ x, y }, 'event');
            if (found?.series.hasEventListener('nodeClick') || found?.series.hasEventListener('nodeDoubleClick')) {
                this.chart.ctx.domManager.updateCursor(this.id, 'pointer');
            } else {
                this.chart.ctx.domManager.updateCursor(this.id);
            }
        }
    }

    private onClick(event: ClickLikeEvent, current: Widget) {
        if (!this.isState(InteractionState.Default)) return;

        // Check whether the `event.sourceEvent` targets on the series-area, or the back of the chart. The logic is
        // different for `seriesWidget` and `containerWidget` because on the `seriesWidget` the target is one of the
        // focus swapchain elements (descendants of `seriesWidget`). Whereas with `containerWidget` we want an exact
        // match with the target because we want to ignore events target is the `seriesWidget` (which is a descendant of
        // `containerWidget`).
        if (current === this.chart.ctx.widgets.seriesWidget) {
            if (!current.getElement().contains(event.sourceEvent.target as Node | null)) {
                return;
            }
        } else if (event.sourceEvent.target != current.getElement()) {
            return;
        }

        this.focusIndicator.overrideFocusVisible(false);
        this.onHoverLikeEvent(event);

        if (current == this.chart.ctx.widgets.seriesWidget && this.checkSeriesNodeClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            event.sourceEvent.preventDefault();
            return;
        }

        // Fallback to Chart-level event dispatch.
        const newEvent = { type: event.type === 'click' ? 'click' : 'doubleClick', event: event.sourceEvent } satisfies
            | AgChartClickEvent
            | AgChartDoubleClickEvent;
        this.chart.fireEvent(newEvent);
    }

    private onFocus(): void {
        if (!this.isState(InteractionState.Focusable)) return;
        this.hoverDevice = this.focusIndicator.isFocusVisible() ? 'keyboard' : 'pointer';
        this.handleFocus(0, 0);
    }

    private onBlur() {
        if (!this.isState(InteractionState.Focusable)) return;
        this.hoverDevice = 'pointer';
        this.clearAll();
        this.focusIndicator.overrideFocusVisible(undefined);
    }

    private onKeyDown(widgetEvent: KeyboardWidgetEvent<'keydown'>) {
        if (!this.isState(InteractionState.Keyable)) return;

        const action = mapKeyboardEventToAction(widgetEvent.sourceEvent);
        if (action?.activatesFocusIndicator === false) {
            this.focusIndicator.overrideFocusVisible(this.previousInputDevice === 'keyboard');
        }

        switch (action?.name) {
            case 'redo':
                return this.chart.ctx.chartEventManager.seriesEvent('series-redo');
            case 'undo':
                return this.chart.ctx.chartEventManager.seriesEvent('series-undo');
            case 'zoomin':
                return this.chart.ctx.chartEventManager.seriesKeyNavZoom(1, widgetEvent);
            case 'zoomout':
                return this.chart.ctx.chartEventManager.seriesKeyNavZoom(-1, widgetEvent);
            case 'arrowup':
                return this.onArrow(-1, 0, widgetEvent);
            case 'arrowdown':
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
        if (!this.isState(InteractionState.Focusable)) return;
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
        if (!this.isState(InteractionState.Focusable)) return;
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

    private checkSeriesNodeClick(event: ClickLikeEvent & { preventZoomDblClick?: boolean }) {
        const result = this.pickNode({ x: event.currentX, y: event.currentY }, 'event');
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
            this.focusIndicator.update(overlayFocus.rect, this.seriesRect, false);
        }
    }

    private handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number, refresh = false) {
        if (this.chart.chartType === 'hierarchy' || this.chart.chartType === 'gauge') {
            this.handleSoloSeriesFocus(otherIndexDelta, datumIndexDelta, refresh);
            return;
        }
        const { focus, seriesRect } = this;
        const visibleSeries = focus.sortedSeries.filter((s) => s.visible);
        if (visibleSeries.length === 0) return;

        const oldPick = {
            datumIndex: focus.datumIndex - datumIndexDelta,
            otherIndex: focus.seriesIndex - otherIndexDelta,
        };

        // Update focused series:
        focus.seriesIndex = clamp(0, focus.seriesIndex, visibleSeries.length - 1);
        focus.series = visibleSeries[focus.seriesIndex];

        // Update focused datum:
        const { datumIndex, seriesIndex: otherIndex } = focus;
        const pick = focus.series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(otherIndexDelta, datumIndexDelta, oldPick, pick, refresh);
    }

    private handleSoloSeriesFocus(otherIndexDelta: number, datumIndexDelta: number, refresh: boolean) {
        // Some chart type (treemap, sunburst, gauges) can only have 1 series. So we'll repurpose the focus.seriesIndex
        // value. Hierarchical charts use arrowup/down to change depth and gauges use arrowup/down to change datum type
        // (bar/needle, targets). This allows the hierarchical and gauge charts to piggy-backon the base keyboard handling
        // implementation.
        this.focus.series = this.focus.sortedSeries[0];
        const {
            focus: { series, seriesIndex: otherIndex, datumIndex },
            seriesRect,
        } = this;
        if (series == null) return;
        const pick = series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(otherIndexDelta, datumIndexDelta, { datumIndex, otherIndex }, pick, refresh);
    }

    private updatePickedFocus(
        otherIndexDelta: number,
        datumIndexDelta: number,
        oldPick: Required<Pick<PickFocusOutputs, 'datumIndex' | 'otherIndex'>>,
        pick: PickFocusOutputs | undefined,
        refresh: boolean
    ) {
        const { focus, hoverRect } = this;
        if (pick === undefined || focus.series === undefined || hoverRect === undefined) return;

        const { datum, datumIndex, otherIndex } = pick;
        if (otherIndex !== undefined) {
            focus.seriesIndex = otherIndex;
        }
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
        this.focusIndicator.update(pick.bounds, this.seriesRect, pick.clipFocusBox);

        const keyboardEvent = makeKeyboardPointerEvent(focus.series, hoverRect, pick);

        // Update highlight/tooltip for keyboard users:
        if (keyboardEvent !== undefined && this.hoverDevice === 'keyboard') {
            // Stop pending async mouse events from updating the highlight/tooltip. At this point, the most recent event
            // came from the keyboard so that's what we should honour.
            this.tooltip.lastHover = undefined;
            this.highlight.appliedHoverEvent = undefined;
            this.highlight.pendingHoverEvent = undefined;
            this.highlight.stashedHoverEvent = undefined;

            const tooltipContent = focus.series.getTooltipContent(datum);
            const meta = TooltipManager.makeTooltipMeta(keyboardEvent, focus.series, datum);
            this.chart.ctx.highlightManager.updateHighlight(this.id, datum);
            this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, tooltipContent);

            if (!refresh) {
                // AG-13874 If all deltas are 0, it means that we're tabbing in (always announce). Otherwise, announce
                // the datum pick only if the indices have changed.
                const shouldAnnouncePick =
                    (datumIndexDelta === 0 && otherIndexDelta === 0) ||
                    oldPick.datumIndex !== pick.datumIndex ||
                    oldPick.otherIndex !== (pick.otherIndex ?? focus.seriesIndex);
                if (shouldAnnouncePick) {
                    this.swapChain.update(this.getDatumAriaText(datum, tooltipContent));
                }
            }
        }
    }

    private getDatumAriaText(datum: SeriesNodeDatum<unknown>, tooltipContent: TooltipContent | undefined): string {
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
        this.focusIndicator.clear();
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

        const { currentX, currentY } = event;
        const canvasX = event.currentX + (this.hoverRect?.x ?? 0);
        const canvasY = event.currentY + (this.hoverRect?.y ?? 0);
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(canvasX, canvasY)) {
            this.clearHighlight();
            return;
        }

        const { range } = this.chart.highlight;
        const intent = range === 'tooltip' ? 'highlight-tooltip' : 'highlight';
        const found = this.pickNode({ x: currentX, y: currentY }, intent);
        if (found) {
            this.chart.ctx.highlightManager.updateHighlight(this.id, found.datum);
            this.hoverDevice = 'pointer';
            return;
        }

        this.chart.ctx.highlightManager.updateHighlight(this.id); // FIXME: clearHighlight?
    }

    private handleHoverTooltip(event: HoverLikeEvent, redisplay: boolean) {
        if (!this.isState(InteractionState.Clickable)) return;

        const { currentX, currentY } = event;
        const canvasX = currentX + (this.hoverRect?.x ?? 0);
        const canvasY = currentY + (this.hoverRect?.y ?? 0);
        const targetElement = event.sourceEvent.target as HTMLElement;
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(canvasX, canvasY)) {
            if (this.hoverDevice == 'pointer') this.clearTooltip();
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

        const pick = this.pickNode({ x: event.currentX, y: event.currentY }, 'tooltip');
        if (!pick) {
            if (this.hoverDevice == 'pointer') this.clearTooltip();
            return;
        }

        this.hoverDevice = 'pointer';
        const content = pick.series.getTooltipContent(pick.datum);
        const tooltipEnabled = this.chart.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && content != null;
        if (shouldUpdateTooltip) {
            const meta = TooltipManager.makeTooltipMeta(
                { type: 'pointermove', canvasX, canvasY },
                pick.series,
                pick.datum
            );
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
            this.chart.ctx.domManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.properties.cursor && newSeries?.properties.cursor !== 'default' && newDatum) {
            this.chart.ctx.domManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }

    private pickNode(point: Point, intent: SeriesNodePickIntent, exactMatchOnly?: boolean): PickedNode | undefined {
        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();

        let result:
            | { series: Series<unknown, any, any>; datum: SeriesNodeDatum<unknown>; distance: number }
            | undefined;
        for (const series of reverseSeries) {
            if (!series.visible || !series.contentGroup.visible) {
                continue;
            }
            const { match, distance } = series.pickNode(point, intent, exactMatchOnly) ?? {};
            if (!match || distance == null) {
                continue;
            }
            if (!result || result.distance > distance) {
                result = { series, distance, datum: match };
            }
            if (distance === 0) {
                break;
            }
        }

        return result;
    }
}

function excludesType<T extends string, O extends { type: T }, X extends T>(
    obj: O & { type: T },
    excluded: X
): obj is O & { type: Exclude<T, X> } {
    return obj.type !== excluded;
}
