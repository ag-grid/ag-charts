import type { MementoOriginator, Point } from 'ag-charts-core';
import { ChartUpdateType, Logger, Vec4, clamp, createId, objectsEqual, validate } from 'ag-charts-core';
import type { AgChartClickEvent, AgChartDoubleClickEvent, AgPickedItemsState, AgPickedState } from 'ag-charts-types';

import type {
    HighlightChangeEvent,
    HighlightNodeDatum,
    LayoutCompleteEvent,
    SeriesAreaClickEvent,
    SeriesAreaHoverEvent,
} from '../../core/eventsHub';
import { FocusIndicator } from '../../dom/focusIndicator';
import { FocusSwapChain } from '../../dom/focusSwapChain';
import { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { Transformable } from '../../scene/transformable';
import { BaseManager } from '../../util/baseManager';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import type { Widget } from '../../widget/widget';
import type {
    ClickLikeEvent,
    DragWidgetEvent,
    HoverLikeEvent,
    KeyboardSyntheticMouseWidgetEvent,
    KeyboardWidgetEvent,
    MouseWidgetEvent,
    WheelWidgetEvent,
} from '../../widget/widgetEvents';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import type { ChartMode } from '../chartMode';
import { commonChartOptions } from '../chartOptionsDefs';
import type { ChartType } from '../factory/expectedModules';
import { InteractionState } from '../interaction/interactionManager';
import { mapKeyboardEventToAction } from '../interaction/keyBindings';
import { TooltipManager } from '../interaction/tooltipManager';
import { getPickedFocusBBox, makeKeyboardPointerEvent } from '../keyboardUtil';
import type { ChartOverlays } from '../overlay/chartOverlays';
import {
    DEFAULT_TOOLTIP_CLASS,
    Tooltip,
    type TooltipContent,
    type TooltipPaginationState,
    tooltipContentAriaLabel,
} from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type PickFocusOutputs, type SeriesNodePickIntent, type UnknownSeries } from './series';
import type { DatumIndexType, SeriesNodeDatum } from './seriesTypes';

type FocusAnnounceMode = 'always' | 'never' | 'when-changed';

type HoverDevice = 'keyboard' | 'pointer' | 'setState';

enum PickedFocusStatus {
    SUCCESS,
    SERIES_NOT_FOUND,
    DATUM_NOT_FOUND,
    PAN_REQUIRED,
}

export interface SeriesAreaChartDependencies {
    fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
    getUpdateType(): ChartUpdateType;
    getTooltipContent: <DatumIndex extends DatumIndexType>(
        series: UnknownSeries,
        datumIndex: DatumIndex,
        removeThisDatum: unknown,
        purpose: 'aria-label' | 'tooltip'
    ) => TooltipContent[];
    chartType: ChartType;
    seriesRoot: TranslatableGroup;
    ctx: ChartContext;
    tooltip: Tooltip;
    highlight: ChartHighlight;
    overlays: ChartOverlays;
    mode: ChartMode;
}

type PickedNodes = {
    matches: PickedNode[];
    distance: number;
};

interface PickedNode {
    series: UnknownSeries;
    datum: SeriesNodeDatum<DatumIndexType>;
    datumIndex: unknown;
}

function pickedNodesEqual(a: PickedNode, b: PickedNode) {
    return a.series === b.series && objectsEqual(a.datumIndex, b.datumIndex);
}

function getItemId(node: PickedNode): AgPickedItemsState['itemId'] {
    // FIXME: How to serialise/deserialise datums is still TBD.
    if (node.datum.itemId) return `${node.datum.itemId}`;
    return JSON.stringify(node.datum.datumIndex);
}

function toMememto(node: PickedNode): AgPickedItemsState {
    return { seriesId: node.series.id, itemId: getItemId(node) };
}

class PickedNodeState {
    private candidates: PickedNode[] = [];
    private active: PickedNode | undefined;

    get current(): PickedNode | undefined {
        return this.active;
    }

    reset() {
        this.candidates.length = 0;
        this.active = undefined;
    }

    update(nextCandidates: PickedNode[], previousActive?: PickedNode) {
        this.candidates = nextCandidates;

        let nextIndex = PickedNodeState.indexOf(nextCandidates, previousActive);
        if (nextIndex === -1) nextIndex = 0;
        this.active = nextCandidates[nextIndex];

        return { current: this.active, index: nextIndex, length: nextCandidates.length };
    }

    next() {
        const { candidates, active } = this;
        const hoverIndex = active == null ? -1 : candidates.findIndex((c) => pickedNodesEqual(c, active));
        if (hoverIndex === -1) return undefined;

        let nextIndex = hoverIndex + 1;
        if (nextIndex >= candidates.length) {
            nextIndex = 0;
        }
        this.active = candidates[nextIndex];

        return { current: this.active, index: nextIndex, length: this.candidates.length };
    }

    private static indexOf(candidates: PickedNode[], node: PickedNode | undefined): number {
        return node == undefined ? -1 : candidates.findIndex((c) => pickedNodesEqual(c, node));
    }
}

export class SeriesAreaManager extends BaseManager implements MementoOriginator<AgPickedState> {
    static readonly className = 'SeriesAreaManager';
    readonly id = createId(this);
    mementoOriginatorKey: string = 'picked';

    private series: UnknownSeries[] = [];
    private seriesRect?: BBox;
    private hoverRect?: BBox;
    public readonly focusIndicator?: FocusIndicator;
    private readonly swapChain: FocusSwapChain;
    private announceMode: FocusAnnounceMode = 'when-changed';

    get bbox() {
        return (this.seriesRect ?? BBox.zero).clone();
    }

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
     *   -   When the series-area is blurred, allow the mouse to update the tooltip/highlight.
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
    private hoverDevice: HoverDevice = 'pointer';

    private pickedNodes?: PickedNodes;

    private readonly focus = {
        sortedSeries: [] as UnknownSeries[],
        series: undefined as UnknownSeries | undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined as SeriesNodeDatum<DatumIndexType> | undefined,
    };

    private cachedTooltipContent:
        | { series: UnknownSeries; datumIndex: unknown; content: TooltipContent[] }
        | undefined = undefined;

    public constructor(private readonly chart: SeriesAreaChartDependencies) {
        super();

        const initialAltText = chart.ctx.localeManager.t('ariaInitSeriesArea');
        const label1 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label1');
        const label2 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label2');
        this.swapChain = new FocusSwapChain(label1, label2, 'img', initialAltText);
        this.swapChain.addListener('blur', (event) => this.onBlur(event));
        this.swapChain.addListener('focus', () => this.onFocus());
        if (chart.ctx.domManager.mode === 'normal') {
            this.focusIndicator = new FocusIndicator(this.swapChain);
            this.focusIndicator.overrideFocusVisible(chart.mode === 'integrated' ? false : undefined); // AG-13197
        }

        const { seriesDragInterpreter, seriesWidget, containerWidget } = chart.ctx.widgets;
        seriesWidget.setTabIndex(-1);
        this.cleanup.register(
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label1'),
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label2'),
            seriesWidget.addListener('focus', () => this.swapChain.focus({ preventScroll: true })),
            seriesWidget.addListener('mousemove', (event) => this.onHover(event, seriesWidget)),
            seriesWidget.addListener('wheel', (event) => this.onWheel(event)),
            seriesWidget.addListener('mouseleave', (event) => this.onLeave(event)),
            seriesWidget.addListener('keydown', (event) => this.onKeyDown(event)),
            seriesWidget.addListener('contextmenu', (event, current) => this.onContextMenu(event, current)),
            containerWidget.addListener('contextmenu', (event, current) => this.onContextMenu(event, current)),
            containerWidget.addListener('click', (event, current) => this.onClick(event, current)),
            containerWidget.addListener('dblclick', (event, current) => this.onClick(event, current)),
            chart.ctx.animationManager.addListener('animation-start', () => this.onAnimationStart()),
            chart.ctx.eventsHub.on('dom:resize', () => this.clearAll()),
            chart.ctx.eventsHub.on('highlight:change', (event) => this.changeHighlightDatum(event)),
            chart.ctx.eventsHub.on('layout:complete', (event) => this.layoutComplete(event)),
            chart.ctx.updateService.addListener('pre-scene-render', () => this.preSceneRender()),
            chart.ctx.updateService.addListener('update-complete', () => this.updateComplete()),
            chart.ctx.eventsHub.on('zoom:change-complete', () => this.clearAll()),
            chart.ctx.eventsHub.on('zoom:pan-start', () => this.clearAll())
        );
        if (seriesDragInterpreter) {
            this.cleanup.register(
                seriesDragInterpreter.events.on('drag-move', (event) => this.onDragMove(event, seriesWidget)),
                seriesDragInterpreter.events.on('click', (event) => this.onClick(event, seriesWidget)),
                seriesDragInterpreter.events.on('dblclick', (event) => this.onClick(event, seriesWidget))
            );
        }
    }

    private isState(allowedStates: InteractionState) {
        return this.chart.ctx.interactionManager.isState(allowedStates);
    }

    private isIgnoredTouch(event: HoverLikeEvent) {
        if (event.device !== 'touch' || event.type === 'click') return false;
        if (this.chart.ctx.chartService.touch.dragAction === 'hover') return false;

        if (this.chart.ctx.chartService.touch.dragAction === 'drag') {
            if (this.isState(InteractionState.AnnotationsMoveable)) {
                return false;
            }
        }
        return true;
    }

    public dataChanged() {
        this.cachedTooltipContent = undefined;

        if (this.highlight.appliedHoverEvent) {
            this.highlight.stashedHoverEvent ??= this.highlight.appliedHoverEvent;
            this.clearHighlight();
        }

        if (this.hoverDevice !== 'setState') {
            this.chart.ctx.tooltipManager.removeTooltip(this.id);
            this.focusIndicator?.clear();
        }
    }

    private preSceneRender() {
        if (this.highlight.stashedHoverEvent != null) {
            // Use more up-to-date hover event if available.
            this.highlight.pendingHoverEvent = this.tooltip.lastHover ?? this.highlight.stashedHoverEvent;
            this.highlight.stashedHoverEvent = undefined;
            this.handleHoverHighlight(true);
        }

        if (this.tooltip.lastHover != null) {
            this.handleHoverTooltip(this.tooltip.lastHover, true);
        }
    }

    private updateComplete() {
        // NOTE: Do the `isFocusVisible()` check last as its the most expensive part.
        if (this.isState(InteractionState.Focusable) && this.focusIndicator?.isFocusVisible()) {
            // This function is usually called when something in the scene is redrawn such as a resize, or zoompan
            // change. In such a case, we need to update the bounds of the focus indicator, but not aria-label. Hence
            // setting mode='never' to avoid announcing the change.
            //
            // However, this method can also be called after an overlay is missed, such as after async data is loaded
            // (AG-15228). The overlay also updates the aria-label in the swapchain, so we want to announce the series
            // focus when the overlay is dismissed. We use mode='always', so ensure that the change is announced even
            // when no focus indices have changed.
            //
            if (this.announceMode !== 'always') {
                this.announceMode = 'never';
            }
            this.handleFocus(0, 0);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.chart.ctx.updateService.update(type, opts);
    }

    public seriesChanged(series: UnknownSeries[]) {
        this.focus.sortedSeries = [...series].sort((a, b) => {
            let fpA = a.properties.focusPriority ?? Infinity;
            let fpB = b.properties.focusPriority ?? Infinity;
            if (fpA === fpB) {
                [fpA, fpB] = [a.declarationOrder, b.declarationOrder];
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
        this.hoverRect = event.series.rect;
        this.chart.ctx.widgets.seriesWidget.setBounds(event.series.rect);
        if (this.chart.ctx.domManager.mode === 'normal') {
            this.chart.ctx.widgets.chartWidget.setBounds(event.chart);
        }
    }

    private onAnimationStart(): void {
        if (this.hoverDevice !== 'setState') {
            this.clearAll();
        }
    }

    private onContextMenu(event: MouseWidgetEvent<'contextmenu'>, current: Widget): void {
        const { sourceEvent } = event;
        if (sourceEvent.currentTarget != current.getElement()) return;

        if (current !== this.chart.ctx.widgets.seriesWidget) {
            if (this.isState(InteractionState.ContextMenuable)) {
                const { currentX: canvasX, currentY: canvasY } = event;
                this.chart.ctx.contextMenuRegistry.dispatchContext(
                    'always',
                    { widgetEvent: event, canvasX, canvasY },
                    undefined
                );
            }
            return;
        }

        let pickedNode: HighlightNodeDatum | undefined;
        let position: { x: number; y: number } | undefined;
        if (this.focusIndicator?.isFocusVisible()) {
            pickedNode = this.chart.ctx.highlightManager.getActiveHighlight();
            if (pickedNode && this.seriesRect && pickedNode.midPoint) {
                position = Transformable.toCanvasPoint(
                    pickedNode.series.contentGroup,
                    pickedNode.midPoint.x,
                    pickedNode.midPoint.y
                );
            }
        } else if (this.isState(InteractionState.ContextMenuable)) {
            const pick = this.pickNodes({ x: event.currentX, y: event.currentY }, 'context-menu');
            if (pick) {
                this.chart.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = pick.matches[0].datum;
            }
        }

        const pickedSeries = pickedNode?.series;

        this.clearAll();
        const canvasX = event.currentX + current.cssLeft();
        const canvasY = event.currentY + current.cssTop();
        const { datumIndex } = pickedNode ?? {};
        if (pickedSeries && pickedNode && datumIndex != null) {
            this.chart.ctx.contextMenuRegistry.dispatchContext(
                'series-node',
                { widgetEvent: event, canvasX, canvasY },
                { pickedSeries, pickedNode: { ...pickedNode, datumIndex } },
                position
            );
        } else {
            this.chart.ctx.contextMenuRegistry.dispatchContext(
                'series-area',
                { widgetEvent: event, canvasX, canvasY },
                undefined,
                position
            );
        }
    }

    private onLeave(event: MouseWidgetEvent<'mouseleave'>): void {
        if (!this.isState(InteractionState.Clickable)) return;

        // Edge-case: when clicking an annotation to edit the text, do not consider this 'mouseleave' event. We may want
        // to remove this check, although it will require a snapshot update.
        const relatedTarget = event.sourceEvent.relatedTarget as Partial<HTMLElement> | null;
        if (relatedTarget?.className === 'ag-charts-text-input__textarea') {
            return;
        }
        if (this.maybeEnterInteractiveTooltip(event.sourceEvent)) {
            return;
        }

        this.chart.ctx.domManager.updateCursor(this.id);
        if (this.hoverDevice !== 'keyboard') this.clearAll(true); // true = delayed
    }

    private onWheel(_event: WheelWidgetEvent): void {
        if (!this.isState(InteractionState.Clickable)) return;
        this.focusIndicator?.overrideFocusVisible(false);
        this.hoverDevice = 'pointer';
    }

    private onDragMove(event: DragWidgetEvent<'drag-move'>, current: Widget): void {
        if (!this.isState(InteractionState.Clickable)) return;
        this.focusIndicator?.overrideFocusVisible(false);
        this.onHoverLikeEvent(event, current);
    }

    private onHover(event: MouseWidgetEvent<'mousemove'>, current: Widget): void {
        if (!this.isState(InteractionState.Clickable)) return;
        this.onHoverLikeEvent(event, current);
    }

    private onHoverLikeEvent(event: HoverLikeEvent, current: Widget): void {
        if (this.isIgnoredTouch(event)) return;

        if (event.device === 'touch' && this.chart.ctx.chartService.touch.dragAction === 'hover') {
            event.sourceEvent.preventDefault();
        }

        // Ignore hover events outside the series-area for the purpose of tooltips + highlights.
        if (current !== this.chart.ctx.widgets.seriesWidget) return;

        if (event.device === 'touch' || excludesType(event, 'drag-move')) {
            this.tooltip.lastHover = event;
        }

        this.hoverDevice = 'pointer';
        this.highlight.pendingHoverEvent = event;
        this.hoverScheduler.schedule();

        let pick: PickedNodes | undefined;
        if (this.isState(InteractionState.Default)) {
            const { currentX: x, currentY: y } = event;
            pick = this.pickNodes({ x, y }, 'event');
            const matches = pick?.matches;
            const found = matches?.[0];
            if (
                found?.series.hasEventListener('seriesNodeClick') ||
                found?.series.hasEventListener('seriesNodeDoubleClick') ||
                (matches != null && matches.length > 1 && this.chart.tooltip.pagination)
            ) {
                this.chart.ctx.domManager.updateCursor(this.id, 'pointer');
            } else {
                this.chart.ctx.domManager.updateCursor(this.id);
            }
        }

        const consumed = Boolean(pick?.matches.length);
        this.emitSeriesAreaHoverEvent(event, consumed);
    }

    private onClick(event: ClickLikeEvent | KeyboardSyntheticMouseWidgetEvent, current: Widget) {
        if (event.device === 'keyboard') {
            return; // already handled natively by 'keydown' listener
        }
        // Skip any playing animations
        if (current === this.chart.ctx.widgets.seriesWidget && this.chart.ctx.animationManager.isActive()) {
            this.chart.ctx.animationManager.skipCurrentBatch();
        }

        if (event.device === 'touch' && current === this.chart.ctx.widgets.seriesWidget) {
            this.swapChain.focus({ preventScroll: true });
        }
        if (!this.isState(InteractionState.Clickable)) return;

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

        this.focusIndicator?.overrideFocusVisible(false);

        this.onHoverLikeEvent(event, current);

        const isSeriesWidget = current === this.chart.ctx.widgets.seriesWidget;

        // Do not run chartOptions click handlers if an annotation is selected.
        if (!this.isState(InteractionState.Default)) {
            if (isSeriesWidget) {
                this.emitSeriesAreaClickEvent(event, false);
            }
            return;
        }

        if (isSeriesWidget) {
            const consumed = Boolean(this.checkSeriesNodeClick(event));
            if (consumed) {
                this.emitSeriesAreaClickEvent(event, true);
                this.update(ChartUpdateType.SERIES_UPDATE);
                event.sourceEvent.preventDefault();
                return;
            }
            this.emitSeriesAreaClickEvent(event, false);
        }

        // Fallback to Chart-level event dispatch.
        const newEvent = { type: event.type === 'click' ? 'click' : 'doubleClick', event: event.sourceEvent } satisfies
            | AgChartClickEvent
            | AgChartDoubleClickEvent;
        this.chart.fireEvent(newEvent);
    }

    private emitSeriesAreaHoverEvent(event: HoverLikeEvent, consumed: boolean): void {
        const coords = this.toCanvasCoordinates(event.currentX, event.currentY);
        if (coords == null) return;

        const payload: SeriesAreaHoverEvent = {
            x: coords.x,
            y: coords.y,
            consumed,
            sourceEvent: event.sourceEvent,
        };

        this.chart.ctx.eventsHub.emit('series-area:hover', payload);
    }

    private emitSeriesAreaClickEvent(
        event: ClickLikeEvent | KeyboardSyntheticMouseWidgetEvent,
        consumed: boolean
    ): void {
        if (!('currentX' in event)) return;

        const coords = this.toCanvasCoordinates(event.currentX, event.currentY);
        if (coords == null) return;

        const payload: SeriesAreaClickEvent = {
            x: coords.x,
            y: coords.y,
            consumed,
            sourceEvent: event.sourceEvent,
        };

        this.chart.ctx.eventsHub.emit('series-area:click', payload);
    }

    private toCanvasCoordinates(x: number, y: number) {
        const offsetX = this.hoverRect?.x ?? this.seriesRect?.x ?? 0;
        const offsetY = this.hoverRect?.y ?? this.seriesRect?.y ?? 0;

        return { x: x + offsetX, y: y + offsetY };
    }

    private onFocus(): void {
        if (!this.isState(InteractionState.Focusable)) return;
        this.hoverDevice = this.focusIndicator?.isFocusVisible(true) ? 'keyboard' : 'pointer';
        this.handleFocus(0, 0);
    }

    private onBlur(event: FocusEvent) {
        if (!this.isState(InteractionState.Focusable)) return;
        this.hoverDevice = 'pointer';
        if (!this.maybeEnterInteractiveTooltip(event)) {
            this.clearAll(true); // true = delayed
        }
        this.focusIndicator?.overrideFocusVisible(undefined);
    }

    private onKeyDown(widgetEvent: KeyboardWidgetEvent<'keydown'>) {
        if (!this.isState(InteractionState.Keyable)) return;

        const action = mapKeyboardEventToAction(widgetEvent.sourceEvent);
        if (action?.activatesFocusIndicator === false) {
            this.focusIndicator?.overrideFocusVisible(this.hoverDevice === 'keyboard');
        }

        switch (action?.name) {
            case 'redo':
                return this.chart.ctx.eventsHub.emit('series:redo', null);
            case 'undo':
                return this.chart.ctx.eventsHub.emit('series:undo', null);
            case 'zoomin':
                return this.chart.ctx.eventsHub.emit('series:keynav-zoom', { delta: 1, widgetEvent });
            case 'zoomout':
                return this.chart.ctx.eventsHub.emit('series:keynav-zoom', { delta: -1, widgetEvent });
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
        this.focusIndicator?.overrideFocusVisible(true);
        this.focus.seriesIndex += seriesIndexDelta;
        this.focus.datumIndex += datumIndexDelta;
        this.handleFocus(seriesIndexDelta, datumIndexDelta);
        event.sourceEvent.preventDefault();
        this.chart.ctx.eventsHub.emit('series:focus-change', null);
    }

    private onSubmit(event: KeyboardWidgetEvent<'keydown'>): void {
        if (!this.isState(InteractionState.Focusable)) return;
        const { series, datum } = this.focus;
        const sourceEvent = event.sourceEvent;
        if (series != null && datum != null) {
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
        const result = this.pickNodes({ x: event.currentX, y: event.currentY }, 'event');
        if (result == null || result.matches.length === 0) return;

        const paginationUpdate = this.updateTooltipCandidate(result.matches);
        const { series, datum } = paginationUpdate ?? result.matches[0];
        const distance = paginationUpdate == null ? result.distance : 0;

        if (event.type === 'click') {
            const defaultBehavior = series.fireNodeClickEvent(event.sourceEvent, datum);

            const nextTooltipCandidate =
                defaultBehavior && this.chart.tooltip.pagination ? this.tooltipCandidates.next() : undefined;
            if (nextTooltipCandidate != null) {
                event.sourceEvent.preventDefault();
                const { currentX, currentY } = event;
                const canvasX = currentX + (this.hoverRect?.x ?? 0);
                const canvasY = currentY + (this.hoverRect?.y ?? 0);
                this.highlight.pendingHoverEvent ??= this.highlight.appliedHoverEvent;
                this.handleHoverHighlight(false);
                this.showTooltip(nextTooltipCandidate.current, canvasX, canvasY, {
                    index: nextTooltipCandidate.index,
                    length: nextTooltipCandidate.length,
                });
            }

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
            event.preventZoomDblClick = distance === 0;

            series.fireNodeDoubleClickEvent(event.sourceEvent, datum);
            return true;
        }

        return false;
    }

    private updateTooltipCandidate(pickedNodes: PickedNode[]): PickedNode | undefined {
        return this.chart.tooltip.pagination
            ? this.tooltipCandidates.update(pickedNodes, this.tooltipCandidates.current)?.current
            : undefined;
    }

    private handleFocus(seriesIndexDelta: number, datumIndexDelta: number) {
        const overlayFocus = this.chart.overlays.getFocusInfo(this.chart.ctx.localeManager);
        if (overlayFocus == null) {
            if (this.handleSeriesFocus(seriesIndexDelta, datumIndexDelta) === PickedFocusStatus.SUCCESS) {
                this.announceMode = 'when-changed';
            } else {
                // As a safe-guard, always announce the next focus-change if this current focus-change failed.
                this.announceMode = 'always';
            }
        } else {
            this.focusIndicator?.update(overlayFocus.rect, this.seriesRect, false);
            this.swapChain.update(overlayFocus.text);
            this.announceMode = 'always';
        }
    }

    private handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number): PickedFocusStatus {
        if (this.chart.chartType === 'standalone') {
            return this.handleSoloSeriesFocus(otherIndexDelta, datumIndexDelta);
        }
        const { focus } = this;
        const visibleSeries = focus.sortedSeries.filter((s) => s.visible && s.focusable);
        if (visibleSeries.length === 0) return PickedFocusStatus.SERIES_NOT_FOUND;

        const oldDatumIndex = focus.datumIndex - datumIndexDelta;
        const oldOtherIndex = focus.seriesIndex - otherIndexDelta;

        // Update focused series:
        focus.seriesIndex = clamp(0, focus.seriesIndex, visibleSeries.length - 1);
        focus.series = visibleSeries[focus.seriesIndex];

        // Update focused datum:
        const datumIndex = this.focus.datumIndex;
        const otherIndex = this.focus.seriesIndex;
        return this.updatePickedFocus(
            datumIndex,
            datumIndexDelta,
            oldDatumIndex,
            otherIndex,
            otherIndexDelta,
            oldOtherIndex
        );
    }

    private handleSoloSeriesFocus(otherIndexDelta: number, datumIndexDelta: number): PickedFocusStatus {
        // Some chart type (treemap, sunburst, gauges) can only have 1 series. So we'll repurpose the focus.seriesIndex
        // value. Hierarchical charts use arrowup/down to change depth and gauges use arrowup/down to change datum type
        // (bar/needle, targets). This allows the hierarchical and gauge charts to piggyback on the base keyboard handling
        // implementation.
        this.focus.series = this.focus.sortedSeries[0];
        const datumIndex = this.focus.datumIndex;
        const otherIndex = this.focus.seriesIndex;
        const oldDatumIndex = this.focus.datumIndex - datumIndexDelta;
        const oldOtherIndex = this.focus.seriesIndex - otherIndexDelta;
        return this.updatePickedFocus(
            datumIndex,
            datumIndexDelta,
            oldDatumIndex,
            otherIndex,
            otherIndexDelta,
            oldOtherIndex
        );
    }

    private updatePickedFocus(
        datumIndex: number,
        datumIndexDelta: number,
        oldDatumIndex: number,
        otherIndex: number,
        otherIndexDelta: number,
        oldOtherIndex: number
    ): PickedFocusStatus {
        const { focus, hoverRect, seriesRect } = this;
        if (focus.series == null || hoverRect == null) return PickedFocusStatus.SERIES_NOT_FOUND;

        const pick = focus?.series?.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        if (!pick) return PickedFocusStatus.DATUM_NOT_FOUND;

        const { datum } = pick;
        focus.datum = datum;
        focus.datumIndex = pick.datumIndex;
        if (pick.otherIndex != null) {
            focus.seriesIndex = pick.otherIndex;
        }

        if (this.focusIndicator?.isFocusVisible()) {
            this.chart.ctx.animationManager.reset();

            const focusBBox: Readonly<BBox> = getPickedFocusBBox(pick);
            const { x, y } = focusBBox.computeCenter();

            if (!hoverRect.containsPoint(x, y)) {
                const panSuccess = this.chart.ctx.zoomManager.panToBBox(hoverRect, focusBBox);
                if (panSuccess) {
                    // Wait for an update to ensure that we show the tooltip/highlight correctly.
                    return PickedFocusStatus.PAN_REQUIRED;
                }
            }
            // AG-14102 Check if focusBBox is still completely outside the viewport (e.g. panning is disabled), and
            // move/clip it if needed.
            const { x1, x2, y1, y2 } = Vec4.from(focusBBox);
            const nw = hoverRect.containsPoint(x1, y1);
            const ne = hoverRect.containsPoint(x2, y1);
            const sw = hoverRect.containsPoint(x1, y2);
            const se = hoverRect.containsPoint(x2, y2);
            if (!(nw || ne || sw || se)) {
                // Move the focus box, insuring that we keeping 2px padding on all sides (AG-13067)
                const hoverBounds = Vec4.from(hoverRect);
                pick.movedBounds = focusBBox.clone();

                if (x1 < hoverBounds.x1 && x2 < hoverBounds.x1) {
                    pick.movedBounds.x = hoverBounds.x1 - 2;
                    pick.movedBounds.width = 4;
                } else if (x1 > hoverBounds.x2 && x2 > hoverBounds.x2) {
                    pick.movedBounds.x = hoverBounds.x2 - 2;
                    pick.movedBounds.width = 4;
                }

                if (y1 < hoverBounds.y1 && y2 < hoverBounds.y1) {
                    pick.movedBounds.y = hoverBounds.y1 - 2;
                    pick.movedBounds.height = 4;
                } else if (y1 > hoverBounds.y2 && y2 > hoverBounds.y2) {
                    pick.movedBounds.y = hoverBounds.y2 - 2;
                    pick.movedBounds.height = 4;
                }
            }
        }

        // Update the bounds of the focus indicator:
        this.focusIndicator?.update(pick.movedBounds ?? pick.bounds, this.seriesRect, pick.clipFocusBox);

        const tooltipContent = this.getTooltipContent(focus.series, datum.datumIndex, datum, 'aria-label');
        const keyboardEvent = makeKeyboardPointerEvent(focus.series, hoverRect, pick);

        // Update highlight/tooltip for keyboard users:
        if (keyboardEvent != null && this.hoverDevice === 'keyboard') {
            // Stop pending async mouse events from updating the highlight/tooltip. At this point, the most recent event
            // came from the keyboard so that's what we should honour.
            this.tooltip.lastHover = undefined;
            this.highlight.appliedHoverEvent = undefined;
            this.highlight.pendingHoverEvent = undefined;
            this.highlight.stashedHoverEvent = undefined;

            const meta = TooltipManager.makeTooltipMeta(keyboardEvent, focus.series, datum, pick.movedBounds);
            this.chart.ctx.highlightManager.updateHighlight(this.id, datum);
            if (this.isTooltipEnabled(focus.series)) {
                this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, tooltipContent);
            }
        }

        this.maybeAnnouncePickedFocus(
            datumIndexDelta,
            oldDatumIndex,
            otherIndexDelta,
            oldOtherIndex,
            pick,
            tooltipContent
        );

        return PickedFocusStatus.SUCCESS;
    }

    private maybeAnnouncePickedFocus(
        datumIndexDelta: number,
        oldDatumIndex: number,
        otherIndexDelta: number,
        oldOtherIndex: number,
        pick: PickFocusOutputs,
        tooltipContent: TooltipContent[]
    ) {
        const { focus } = this;
        let mode: 'always' | 'never';

        if (this.announceMode === 'when-changed') {
            // AG-13874 If all deltas are 0, it means that we're tabbing in (always announce). Otherwise, announce
            // the datum pick only if the indices have changed.
            const shouldAnnouncePick =
                (datumIndexDelta === 0 && otherIndexDelta === 0) ||
                oldDatumIndex !== pick.datumIndex ||
                oldOtherIndex !== (pick.otherIndex ?? focus.seriesIndex);
            if (shouldAnnouncePick) {
                mode = 'always';
            } else {
                mode = 'never';
            }
        } else {
            mode = this.announceMode;
        }

        if (mode === 'always') {
            this.swapChain.update(this.getDatumAriaText(pick.datum, tooltipContent));
        }
    }

    private getDatumAriaText(datum: SeriesNodeDatum<DatumIndexType>, tooltipContent: TooltipContent[]): string {
        const description = tooltipContent == null ? '' : tooltipContentAriaLabel(tooltipContent);
        return this.chart.ctx.localeManager.t('ariaAnnounceHoverDatum', {
            datum: datum.series.getDatumAriaText?.(datum, description) ?? description,
        });
    }

    private clearHighlight(delayed: boolean = false) {
        this.highlight.pendingHoverEvent = undefined;
        this.highlight.appliedHoverEvent = undefined;
        this.chart.ctx.highlightManager.updateHighlight(this.id, undefined, delayed);
    }

    private clearTooltip(delayed: boolean = false) {
        this.chart.ctx.tooltipManager.removeTooltip(this.id, undefined, delayed);
        this.tooltip.lastHover = undefined;
    }

    private clearPicked(): void {
        this.pickedNodes = undefined;
        this.tooltipCandidates.reset();
    }

    private clearAll(delayed: boolean = false) {
        this.clearPicked();
        this.clearHighlight(delayed);
        this.clearTooltip(delayed); // Pass through the delayed flag
        this.focusIndicator?.clear();
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
        const pick = this.pickNodes({ x: currentX, y: currentY }, intent);
        if (!pick || pick.matches.length === 0) {
            this.chart.ctx.highlightManager.updateHighlight(this.id, undefined, true); // true = delayed
            return;
        }

        const { current: tooltipPick } = this.tooltipCandidates;
        const tooltipMatch =
            tooltipPick == null ? undefined : pick.matches.find((m) => pickedNodesEqual(m, tooltipPick));

        const datum = tooltipMatch?.datum ?? pick.matches[0].datum;

        this.chart.ctx.highlightManager.updateHighlight(this.id, datum);
        this.hoverDevice = 'pointer';
    }

    private readonly tooltipCandidates = new PickedNodeState();
    private handleHoverTooltip(event: HoverLikeEvent, redisplay: boolean) {
        const { current: previousHover } = this.tooltipCandidates;
        this.tooltipCandidates.reset();
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

        const pick = this.pickNodes({ x: event.currentX, y: event.currentY }, 'tooltip');
        if (!pick || pick.matches.length === 0) {
            if (this.hoverDevice == 'pointer') this.clearTooltip(true); // true = delayed
            return;
        }

        this.hoverDevice = 'pointer';

        if (pick.distance === 0) {
            const { current, index, length } = this.tooltipCandidates.update(
                pick.matches,
                this.chart.tooltip.pagination ? previousHover : undefined
            );

            this.showTooltip(current, canvasX, canvasY, { index, length });
        } else {
            this.showTooltip(pick.matches[0], canvasX, canvasY);
        }
    }

    private showTooltip(
        { series, datum, datumIndex }: PickedNode,
        canvasX: number,
        canvasY: number,
        pagination?: TooltipPaginationState
    ) {
        const tooltipContent = this.getTooltipContent(series, datumIndex, datum, 'tooltip');
        const shouldUpdateTooltip = tooltipContent != null;
        if (shouldUpdateTooltip) {
            const meta = TooltipManager.makeTooltipMeta(
                { type: 'pointermove', canvasX, canvasY },
                series,
                datum,
                undefined
            );
            this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, tooltipContent, pagination);
        } else {
            this.chart.ctx.tooltipManager.removeTooltip(this.id, undefined, true); // true = delayed
        }
    }

    private maybeEnterInteractiveTooltip(event: FocusEvent | MouseEvent) {
        return this.chart.tooltip.maybeEnterInteractiveTooltip(event, () => {
            this.tooltip.lastHover = undefined;
            this.chart.ctx.tooltipManager.removeTooltip(this.id);
            this.chart.ctx.highlightManager.updateHighlight(this.id, undefined, true); // true = delayed
        });
    }

    private changeHighlightDatum(event: HighlightChangeEvent) {
        const lastSeries = event.previousHighlight?.series;
        const newSeries = event.currentHighlight?.series;

        // Adjust the cursor if a specific datum is highlighted, rather than just a series.
        if (lastSeries?.properties.cursor && event.previousHighlight?.datum) {
            this.chart.ctx.domManager.updateCursor(lastSeries.id);
        }
        if (
            newSeries?.properties.cursor &&
            newSeries.properties.cursor !== 'default' &&
            event.currentHighlight?.datum
        ) {
            this.chart.ctx.domManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        if (newSeries == null || lastSeries == null) {
            this.update(ChartUpdateType.SERIES_UPDATE, { clearCallbackCache: true });
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, {
                seriesToUpdate: new Set([lastSeries, newSeries].filter(Boolean)),
                clearCallbackCache: true,
            });
        }
    }

    private pickNodes(point: Point, intent: SeriesNodePickIntent, exactMatchOnly?: boolean): PickedNodes | undefined {
        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();

        // Check if any series with 'area' tooltip range contains the point
        const { x, y } = point;
        const seriesContainingPoint = new Set<UnknownSeries>();
        for (const series of reverseSeries) {
            if (series.visible && series.contentGroup.visible && series.properties.tooltip.range === 'area') {
                if (series.isPointInArea?.(x, y)) {
                    seriesContainingPoint.add(series);
                }
            }
        }

        const filterToContainingSeries = seriesContainingPoint.size > 0;

        let result: PickedNodes | undefined;
        for (const series of reverseSeries) {
            if (!series.visible || !series.contentGroup.visible) continue;

            // If we found series with 'area' tooltip range containing the point, only pick from those series
            if (
                filterToContainingSeries &&
                series.properties.tooltip.range === 'area' &&
                !seriesContainingPoint.has(series)
            ) {
                continue;
            }

            const pick = series.pickNodes(point, intent, exactMatchOnly);
            if (pick == null || pick.datums.length === 0) continue;

            const { datums, distance } = pick;
            if (pick.datums.length === 0) continue;

            if (distance === 0) {
                // Accumulate multiple series when the nodes are under the cursor
                // I.e. the distance is 0
                if (result?.distance !== 0) {
                    result = { matches: [], distance: 0 };
                }

                for (const datum of datums) {
                    const { datumIndex } = datum;
                    result.matches.push({ series, datum, datumIndex });
                }
            } else if (result == null || result.distance > distance) {
                // Don't accumulate multiple datums when matching by nearest distance
                const [datum] = datums;
                const { datumIndex } = datum;
                result = { matches: [{ series, datum, datumIndex }], distance };
            }
        }

        this.pickedNodes = result;
        return result;
    }

    private isTooltipEnabled(series: UnknownSeries): boolean {
        return series.tooltipEnabled ?? this.chart.tooltip.enabled;
    }

    // Do not return undefined tooltip content if we're obtaining it to update the series-area aria-label.
    // (CRT-869, CRT-901, CRT-871, CRT-909).
    private getTooltipContent(
        series: UnknownSeries,
        datumIndex: unknown,
        datum: SeriesNodeDatum<DatumIndexType>,
        purpose: 'aria-label'
    ): TooltipContent[];

    private getTooltipContent(
        series: UnknownSeries,
        datumIndex: unknown,
        datum: SeriesNodeDatum<DatumIndexType>,
        purpose: 'tooltip'
    ): TooltipContent[] | undefined;

    private getTooltipContent(
        series: UnknownSeries,
        datumIndex: DatumIndexType,
        datum: SeriesNodeDatum<DatumIndexType>,
        purpose: 'aria-label' | 'tooltip'
    ): TooltipContent[] | undefined {
        let result: TooltipContent[] | undefined;

        if (purpose === 'aria-label' || this.isTooltipEnabled(series)) {
            const { cachedTooltipContent } = this;
            if (cachedTooltipContent?.series === series && cachedTooltipContent.datumIndex === datumIndex) {
                result = cachedTooltipContent.content;
            } else {
                const content: TooltipContent[] = this.chart.getTooltipContent(series, datumIndex, datum, purpose);
                this.cachedTooltipContent = { series, datumIndex, content };
                result = content;
            }
            // Verify assumptions of overload #1 and #2
            purpose satisfies 'aria-label' | 'tooltip';
            result satisfies TooltipContent[];
        } else {
            this.cachedTooltipContent = undefined;
            // Verify assumptions of overload #2
            purpose satisfies 'tooltip';
            result satisfies TooltipContent[] | undefined;
        }

        return result;
    }

    public createMemento(): AgPickedState {
        const active: PickedNode | undefined = this.tooltipCandidates.current ?? this.pickedNodes?.matches[0];
        return {
            frozen: false,
            activeItem: active ? toMememto(active) : undefined,
        };
    }

    public guardMemento(blob: unknown, messages: string[]): blob is AgPickedState | undefined {
        if (blob == undefined) return true;

        const validationResult = validate(blob, commonChartOptions.initialState.picked);
        messages.push(...validationResult.invalid.map((err) => err.toString()));
        return validationResult.invalid.length === 0;
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: AgPickedState | undefined): void {
        const desiredPickedNodes: PickedNodes | undefined = this.findPickedNodes(memento);
        if (desiredPickedNodes == undefined) {
            this.clearPicked();
        } else {
            this.hoverDevice = 'setState';
            this.pickedNodes = desiredPickedNodes;
            this.updateTooltipCandidate(desiredPickedNodes.matches);
            const { datum } = desiredPickedNodes.matches[0];
            this.chart.ctx.highlightManager.updateHighlight(this.id, datum);
            if (this.chart.tooltip.enabled && datum.midPoint) {
                this.showTooltip(desiredPickedNodes.matches[0], datum.midPoint.x, datum.midPoint.y);
            }
        }
    }

    public findPickedNodes(memento: AgPickedState | undefined): PickedNodes | undefined {
        if (memento?.activeItem == undefined) return undefined;

        const desiredItemId: string | undefined = memento.activeItem.itemId;
        if (desiredItemId == undefined) return undefined;

        const desiredSeriesId: string = memento.activeItem.seriesId;
        const desiredSeries: PickedNode['series'] | undefined = this.series.find((s) => s.id === desiredSeriesId);
        if (desiredSeries == undefined) {
            Logger.warn(`Cannot find series '${desiredSeries}'`);
            return undefined;
        }

        const desiredDatum: PickedNode['datum'] | undefined = desiredSeries.findNodeDatum(desiredItemId);
        if (desiredDatum == undefined) {
            Logger.warn(`Cannot find datum: { seriesId: '${desiredSeriesId}', itemId: '${desiredItemId}' }`);
            return undefined;
        }

        const restoredPick: PickedNode = {
            datum: desiredDatum,
            datumIndex: desiredDatum.datumIndex,
            series: desiredSeries,
        };
        return { matches: [restoredPick], distance: 0 };
    }
}

function excludesType<T extends string, O extends { type: T }, X extends T>(
    obj: O & { type: T },
    excluded: X
): obj is O & { type: Exclude<T, X> } {
    return obj.type !== excluded;
}
