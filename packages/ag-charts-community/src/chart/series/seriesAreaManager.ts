import type { CallbackParamRules, CanvasPoint, CurrentPoint, DynamicContext, Point, Writeable } from 'ag-charts-core';
import { ChartUpdateType, Vec4, clamp, createId } from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgChartClickEvent,
    AgChartDoubleClickEvent,
    AgContextMenuItemShowOn,
    AgInitialFocus,
} from 'ag-charts-types';

import type {
    ActiveLoadMementoEvent,
    HighlightChangeEvent,
    HighlightNodeDatum,
    HighlightSelectionUpdatedEvent,
    LayoutCompleteEvent,
    SeriesAreaClickEvent,
    SeriesAreaContextMenuEvent,
    SeriesAreaHoverEvent,
    SeriesKeyNavPanXEvent,
    UpdateOpts,
    ZoomChangeCompleteEvent,
} from '../../core/eventsHub';
import { FocusIndicator } from '../../dom/focusIndicator';
import { FocusSwapChain } from '../../dom/focusSwapChain';
import type { ChartRegistry } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import type { Node as SceneNode } from '../../scene/node';
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
import type { ChartHighlight } from '../chartHighlight';
import type { ChartType } from '../chartType';
import type { ContextMenuRegionContexts } from '../interaction/contextMenuTypes';
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
import { PickManager, type PickedNode, type PickedNodes, getItemId } from './pickManager';
import {
    type PickFocusInputs,
    type PickFocusOutputs,
    type PickViewportFocusInputs,
    type SeriesNodePickIntent,
    type UnknownSeries,
} from './series';
import { type DatumIndex, SelectionState, type SeriesNodeDatum } from './seriesTypes';
import { getDatumRefPoint } from './util';

type FocusAnnounceMode = 'always' | 'never' | 'when-changed';

type HoverDevice = 'keyboard' | 'pointer' | 'setState';

enum PickedFocusStatus {
    SUCCESS,
    SERIES_NOT_FOUND,
    DATUM_NOT_FOUND,
    PAN_REQUIRED,
    PENDING_VIEWPORT_FOCUS,
}

type FocusIndices = {
    datumIndex: number;
    otherIndex: number;
};
type FocusDeltas = {
    datumIndexDelta: number;
    otherIndexDelta: number;
};
type FocusOldIndices = {
    oldDatumIndex: number;
    oldOtherIndex: number;
};
type HandleFocusInputs = FocusIndices | FocusDeltas;
type UpdatePickedFocusInputs = FocusIndices & FocusDeltas & FocusOldIndices;

type FindPickedNodesResult = PickedNodes | 'series-hidden' | undefined;

export interface SeriesAreaChartDependencies {
    hasViewportSupport(): boolean;
    hasPgUpPgDownSupport(): boolean;
    fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
    getUpdateType(): ChartUpdateType;
    getTooltipContent: (
        series: PickedNode['series'],
        datumIndex: DatumIndex,
        removeThisDatum: SeriesNodeDatum,
        purpose: 'aria-label' | 'tooltip'
    ) => TooltipContent[];
    chartType: ChartType;
    seriesRoot: TranslatableGroup;
    ctx: DynamicContext<ChartRegistry>;
    tooltip: Tooltip;
    highlight: ChartHighlight;
    overlays: ChartOverlays;
}

function computeHighlightInViewport(
    highlightSelection: HighlightSelectionUpdatedEvent['highlightSelection'],
    viewport: BBox
): boolean {
    for (const highlightSelectionEntry of highlightSelection) {
        const highlightBBox = Transformable.toCanvas(highlightSelectionEntry.node);
        if (highlightBBox.intersectsWith(viewport)) {
            return true;
        }
    }
    return false;
}

/** Nodes without a datum index cannot be identified by a context-menu item action, so they are dropped. */
function seriesNodeContexts(pickedNodes: readonly HighlightNodeDatum[]): SeriesNodeDatum[] {
    const contexts: SeriesNodeDatum[] = [];
    for (const { datumIndex, ...node } of pickedNodes) {
        if (datumIndex != null) contexts.push({ ...node, datumIndex });
    }
    return contexts;
}

function computePendingViewportFocus(event: ZoomChangeCompleteEvent): PickViewportFocusInputs['where'] | undefined {
    switch (event.sourceDetail) {
        case 'keyboard-page(1)':
        case 'keyboard-page(-1)':
            return 'viewport-start';

        case 'keyboard-page(home)':
            return 'data-start';

        case 'keyboard-page(end)':
            return 'data-end';

        default:
            return undefined;
    }
}

export class SeriesAreaManager extends BaseManager {
    static readonly className = 'SeriesAreaManager';
    readonly id = createId(this);

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

    private readonly activeState = {
        lastActive: undefined as Required<Pick<AgActiveItemState, 'seriesId' | 'itemId'>> | undefined | 'legend',
        highlightInViewport: true,
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
    private _device: HoverDevice = 'pointer';

    private setHoverDevice(desiredDevice: HoverDevice): void {
        // Keyboard and Pointer interactions are still permitted on Frozen charts. However, we shouldn't update the
        // hoverDevice when we receive Keyboard/Pointer events, because we should still be honouring the `setState`
        // requested active highlight/tooltip.
        if (desiredDevice === 'setState' || !this.isState(InteractionState.Frozen)) {
            this._device = desiredDevice;
        }
    }
    private getHoverDevice(): HoverDevice {
        return this._device;
    }

    private readonly pickManager: PickManager;

    private readonly focus = {
        initialized: false,
        sortedSeries: [] as UnknownSeries[],
        series: undefined as UnknownSeries | undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined as SeriesNodeDatum | undefined,
        pendingViewportFocus: undefined as PickViewportFocusInputs['where'] | undefined,
    };

    private cachedTooltipContent:
        | { series: PickedNode['series']; datumIndex: unknown; content: TooltipContent[] }
        | undefined = undefined;

    public constructor(private readonly chart: SeriesAreaChartDependencies) {
        super();

        this.hoverScheduler = this.createHoverScheduler();

        this.pickManager = new PickManager(chart.ctx.activeManager, chart.tooltip);

        const initialAltText = chart.ctx.localeManager.t('ariaInitSeriesArea');
        const label1 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label1');
        const label2 = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label2');
        this.swapChain = new FocusSwapChain(label1, label2, 'img', initialAltText);
        this.swapChain.addListener('blur', (event) => this.onBlur(event));
        this.swapChain.addListener('focus', () => this.onFocus());
        if (chart.ctx.domManager.mode === 'normal') {
            this.focusIndicator = new FocusIndicator(this.swapChain);
            this.focusIndicator.overrideFocusVisible(
                chart.ctx.chartState.getValue('options', 'mode') === 'integrated' ? false : undefined // AG-13197
            );
        }

        const { seriesDragInterpreter, seriesWidget, containerWidget } = chart.ctx.widgets;
        seriesWidget.setTabIndex(-1);
        this.cleanup.register(
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label1'),
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label2'),
            seriesWidget.addListener('focus', () => this.focusIndicator?.focus({ preventScroll: true })),
            seriesWidget.addListener('mousemove', (event) => this.onHover(event, seriesWidget)),
            seriesWidget.addListener('wheel', (event) => this.onWheel(event)),
            seriesWidget.addListener('mouseleave', (event) => this.onLeave(event)),
            seriesWidget.addListener('keydown', (event) => this.onKeyDown(event)),
            seriesWidget.addListener('contextmenu', (event, current) => this.onContextMenu(event, current)),
            containerWidget.addListener('contextmenu', (event, current) => this.onContextMenu(event, current)),
            containerWidget.addListener('click', (event, current) => this.onClick(event, current)),
            containerWidget.addListener('dblclick', (event, current) => this.onClick(event, current)),
            chart.ctx.animationManager.addListener('animation-start', () => this.onAnimationStart()),
            chart.ctx.eventsHub.on('active:load-memento', (event) => this.onActiveLoadMemento(event)),
            chart.ctx.chartState.observe((get) => {
                const activeItem = get('activeItem');
                if (activeItem?.type === 'legend') {
                    this.clearStaleHighlightTooltip();
                    this.activeState.lastActive = 'legend';
                }
            }),
            chart.ctx.eventsHub.on('dom:resize', () => this.onResize()),
            chart.ctx.eventsHub.on('dom:container-change', () => this.resetHoverScheduler()),
            chart.ctx.eventsHub.on('highlight:change', (event) => this.changeHighlightDatum(event)),
            chart.ctx.eventsHub.on('highlight:selection-updated', (event) => this.onHighlightSelectionUpdate(event)),
            chart.ctx.eventsHub.on('layout:complete', (event) => this.layoutComplete(event)),
            chart.ctx.eventsHub.on('update:pre-scene-render', () => this.preSceneRender()),
            chart.ctx.eventsHub.on('update:complete', () => this.updateComplete()),
            chart.ctx.eventsHub.on('zoom:change-complete', (event) => this.onZoomChangeComplete(event)),
            chart.ctx.eventsHub.on('collapsed:change', () => {
                // Re-announce the focused node after a toggle. Gated so background changes
                // (memento restore, off-screen series) don't trigger spurious announcements.
                if (this.focusIndicator?.isFocusVisible()) {
                    this.announceMode = 'always';
                }
            }),
            chart.ctx.eventsHub.on('zoom:pan-start', () => this.clearAll()),
            chart.ctx.eventsHub.on('legend:item-hover', (event) => this.onLegendHover(event))
        );
        if (seriesDragInterpreter) {
            this.cleanup.register(
                seriesDragInterpreter.events.on('drag-move', (event) => this.onDragMove(event, seriesWidget)),
                seriesDragInterpreter.events.on('click', (event) => this.onClick(event, seriesWidget)),
                seriesDragInterpreter.events.on('dblclick', (event) => this.onClick(event, seriesWidget))
            );
        }
    }

    private initFocus(initialFocus: AgInitialFocus): void {
        if (this.focus.initialized) return;
        this.focus.initialized = true;

        switch (initialFocus) {
            case 'data-end': {
                // We don't need to know the length of the input data; indices that are too small or too big will get
                // clamped. So just set datumIndex to the maximum.
                this.focus.datumIndex = Number.MAX_VALUE;
                break;
            }
            case 'viewport-start':
            case 'viewport-end': {
                this.focus.pendingViewportFocus = initialFocus;
                break;
            }
            default:
                // Nothing to do if initialFocus is 'data-start' (datumIndex is zero-initialised). Just verify at
                // compile-time that we've not missed an AgInitialFocus case:
                initialFocus satisfies 'data-start';
        }
    }

    private isState(allowedStates: InteractionState) {
        return this.chart.ctx.interactionManager.isState(allowedStates);
    }

    private isIgnoredTouch(event: HoverLikeEvent) {
        if (event.device !== 'touch' || event.type === 'click') return false;

        const { dragAction } = this.chart.ctx.chartState.getValue('options', 'touch');
        if (dragAction === 'hover') return false;

        if (dragAction === 'drag') {
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

        if (this.getHoverDevice() !== 'setState') {
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

        if (this.getHoverDevice() === 'setState') {
            this.refreshSetState();
        }
    }

    private updateComplete() {
        const { pendingViewportFocus } = this.focus;
        if (pendingViewportFocus && this.focus.series !== undefined) {
            this.focus.pendingViewportFocus = undefined;
            this.pickViewportFocus(pendingViewportFocus);
        } else if (this.isState(InteractionState.Focusable) && this.focusIndicator?.isFocusVisible()) {
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

            // The focus indicator & label might be outdated, but the current focus isn't changing. Therefore, just
            // refresh the focus indicator & label, but without emitting the 'series:focus-change' event (doing so would
            // trigger and infinite redraw loop).
            this.refreshFocus();
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.chart.ctx.eventsHub.emit('chart:request-update', { type, opts });
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
        if (this.getHoverDevice() !== 'setState' && this.activeState.lastActive !== 'legend') {
            this.clearAll();
        }
    }

    private onResize(): void {
        const activeHighlight = this.chart.ctx.highlightManager.getActiveHighlight();
        this.clearAll();

        if (this.pickManager.wasActivationPrevented()) {
            // AG-16704 TC2; when the user calls preventDefault() an activeChange with `source: 'user-interaction'`
            // (meaning we have hover-device 'pointer' or 'keyboard'), then we'll need to redraw the highlight rather
            // than clear it. Let's switch to the `setState` internally to do that.
            if (activeHighlight !== undefined) {
                this.setHoverDevice('setState');
                this.activeState.lastActive = {
                    itemId: getItemId(activeHighlight),
                    seriesId: activeHighlight.series.id,
                };
            }
        }
    }

    private onZoomChangeComplete(event: ZoomChangeCompleteEvent): void {
        this.clearAll();
        this.focus.pendingViewportFocus = computePendingViewportFocus(event);
    }

    private onContextMenu(event: MouseWidgetEvent<'contextmenu'>, current: Widget): void {
        const { sourceEvent } = event;
        if (sourceEvent.currentTarget != current.getElement()) return;

        if (current !== this.chart.ctx.widgets.seriesWidget) {
            if (this.isState(InteractionState.ContextMenuable)) {
                const { currentX: canvasX, currentY: canvasY } = event;
                this.chart.ctx.contextMenuRegistry?.dispatchContext(
                    'always',
                    { widgetEvent: event, canvasX, canvasY },
                    undefined
                );
            }
            return;
        }

        // Every node under the point, not just the topmost: overlapping markers each get their own context.
        let pickedNodes: readonly HighlightNodeDatum[] = [];
        let position: CanvasPoint | undefined;
        if (this.focusIndicator?.isFocusVisible()) {
            const pickedNode = this.chart.ctx.highlightManager.getActiveHighlight();
            if (pickedNode) pickedNodes = [pickedNode];
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
                this.pickManager.maybeActivate(undefined, (): void => {
                    this.chart.ctx.highlightManager.updateHighlight(this.id);
                });
                pickedNodes = pick.matches;
            }
        }

        this.clearAll();
        const canvasX = event.currentX + current.cssLeft();
        const canvasY = event.currentY + current.cssTop();

        const regions: AgContextMenuItemShowOn[] = ['series-area'];
        const contexts: ContextMenuRegionContexts = {};
        const nodeContexts = seriesNodeContexts(pickedNodes);
        if (nodeContexts.length > 0) {
            regions.push('series-node');
            contexts['series-node'] = nodeContexts;
        }

        // Ask axis-owning modules whether an axis overlaps this point (mirrors the hover/drag handoff). They
        // annotate `axis` rather than dispatching, so a single menu can offer both the series and axis regions.
        const collectEvent: Writeable<SeriesAreaContextMenuEvent> = {
            canvasX,
            canvasY,
            widgetEvent: event,
            crossLine: [],
        };
        this.chart.ctx.eventsHub.emit('series-area:contextmenu', collectEvent);
        if (collectEvent.axis) {
            regions.push('axis');
            contexts.axis = collectEvent.axis;
        }
        if (collectEvent.crossLine.length > 0) {
            regions.push('cross-line');
            contexts['cross-line'] = collectEvent.crossLine;
        }

        // Primary region for backwards-compatible `showOn`: a node wins over a cross line, which wins over an
        // overlapping axis, which wins over the bare series area (matches the pre-multi-region dispatch precedence).
        let primary: AgContextMenuItemShowOn = 'series-area';
        if (contexts['series-node']) {
            primary = 'series-node';
        } else if (collectEvent.crossLine.length > 0) {
            primary = 'cross-line';
        } else if (collectEvent.axis) {
            primary = 'axis';
        }

        this.chart.ctx.contextMenuRegistry?.dispatchContextRegions(
            primary,
            regions,
            contexts,
            { widgetEvent: event, canvasX, canvasY },
            position
        );
    }

    private onLeave(event: MouseWidgetEvent<'mouseleave'>): void {
        if (!this.isState(InteractionState.Hoverable)) return;

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
        if (this.getHoverDevice() !== 'keyboard') this.clearAll(true); // true = delayed
    }

    private onWheel(_event: WheelWidgetEvent): void {
        if (!this.isState(InteractionState.Hoverable)) return;
        this.focusIndicator?.overrideFocusVisible(false);
        this.setHoverDevice('pointer');
    }

    private onDragMove(event: DragWidgetEvent<'drag-move'>, current: Widget): void {
        if (!this.isState(InteractionState.Hoverable)) return;
        this.focusIndicator?.overrideFocusVisible(false);
        this.onHoverLikeEvent(event, current);
    }

    private onHover(event: MouseWidgetEvent<'mousemove'>, current: Widget): void {
        if (!this.isState(InteractionState.Clickable)) return;
        this.onHoverLikeEvent(event, current);
    }

    private onHoverLikeEvent(event: HoverLikeEvent, current: Widget): void {
        if (this.isIgnoredTouch(event)) return;

        if (event.device === 'touch' && this.chart.ctx.chartState.getValue('options', 'touch').dragAction === 'hover') {
            event.sourceEvent.preventDefault();
        }

        // Ignore hover events outside the series-area for the purpose of tooltips + highlights.
        if (current !== this.chart.ctx.widgets.seriesWidget) return;

        this.tooltip.lastHover = event;

        this.setHoverDevice('pointer');
        this.highlight.pendingHoverEvent = event;
        this.hoverScheduler.schedule();

        let pick: PickedNodes | undefined;
        if (this.isState(InteractionState.Default | InteractionState.Frozen)) {
            const { currentX: x, currentY: y } = event;
            pick = this.pickNodes({ x, y }, 'event');
            const matches = pick?.matches;
            const found = matches?.[0];
            if (
                (found?.series.isSelectionEnabled() && found?.series.isDatumSelectable(found.datumIndex)) ||
                found?.series.hasEventListener('seriesNodeClick') ||
                found?.series.hasEventListener('seriesNodeDoubleClick') ||
                found?.series.hasBuiltinListener(pick?.target) ||
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

        // Synthetic Touch click events do not always put the series-area into focus, but we want these events to
        // put the series-area into focus regardless of whether anything is highlighted or not. We want to
        // programmatically focus on the HTMLElement before firing the API click event. This ensure that we keep
        // Touch UX consistent with Mouse UX.
        if (event.device === 'touch' && current === this.chart.ctx.widgets.seriesWidget) {
            this.focusIndicator?.focus({ preventScroll: true, focusVisible: false });
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
        if (this.isState(InteractionState.AnnotationsMoveable)) {
            if (isSeriesWidget) {
                this.emitSeriesAreaClickEvent(event, false);
            }
            return;
        }

        if (isSeriesWidget) {
            const clicked = this.checkSeriesNodeClick(event);
            if (clicked) {
                this.emitSeriesAreaClickEvent(event, true, clicked.node, clicked.target);
                this.update(ChartUpdateType.SERIES_UPDATE);
                event.sourceEvent.preventDefault();
                return;
            }
            this.emitSeriesAreaClickEvent(event, false);
        }

        // Fallback to Chart-level event dispatch.
        const newEvent = { type: event.type === 'click' ? 'click' : 'doubleClick', event: event.sourceEvent } satisfies
            | CallbackParamRules<AgChartClickEvent>
            | CallbackParamRules<AgChartDoubleClickEvent>;
        this.chart.fireEvent(newEvent);
    }

    private emitSeriesAreaHoverEvent(event: HoverLikeEvent, consumed: boolean): void {
        const { canvasX, canvasY } = this.toCanvasCoordinates(event);
        const payload: SeriesAreaHoverEvent = { canvasX, canvasY, consumed, sourceEvent: event.sourceEvent };
        this.chart.ctx.eventsHub.emit('series-area:hover', payload);
    }

    private emitSeriesAreaClickEvent(
        event: ClickLikeEvent | KeyboardSyntheticMouseWidgetEvent,
        consumed: boolean,
        clickedNode?: PickedNode,
        target?: SceneNode<unknown>
    ): void {
        const { type, sourceEvent } = event;
        const payload: SeriesAreaClickEvent = { type, consumed, sourceEvent, clickedNode, target };

        const { datum } = this.focus;
        const oldSelectionState = datum?.series.getDataSelectionState(datum.datumIndex);
        this.chart.ctx.eventsHub.emit('series-area:click', payload);
        const newSelectionState = datum?.series.getDataSelectionState(datum.datumIndex);

        if (oldSelectionState !== newSelectionState) {
            this.announceDataSelectionChange();
        }
    }

    private toCanvasCoordinates(event: CurrentPoint): CanvasPoint {
        return {
            canvasX: event.currentX + (this.hoverRect?.x ?? this.seriesRect?.x ?? 0),
            canvasY: event.currentY + (this.hoverRect?.y ?? this.seriesRect?.y ?? 0),
        };
    }

    private onFocus(): void {
        if (!this.isState(InteractionState.Focusable) || !this.focusIndicator) return;
        this.initFocus(this.chart.ctx.chartState.getValue('options', 'keyboard').initialFocus);
        const focusVisibleStyle: boolean = this.focusIndicator.onFocus();
        this.setHoverDevice(focusVisibleStyle ? 'keyboard' : 'pointer');

        const { pendingViewportFocus } = this.focus;
        if (this.refreshFocus() === PickedFocusStatus.PENDING_VIEWPORT_FOCUS && pendingViewportFocus) {
            this.focus.pendingViewportFocus = undefined;
            this.pickViewportFocus(pendingViewportFocus);
        }
    }

    private onBlur(event: FocusEvent) {
        if (!this.isState(InteractionState.Focusable)) return;
        this.setHoverDevice('pointer');
        if (!this.isState(InteractionState.Frozen) && !this.maybeEnterInteractiveTooltip(event)) {
            this.clearAll(true); // true = delayed
        }
        this.focusIndicator?.onBlur();
    }

    private onKeyDown(widgetEvent: KeyboardWidgetEvent<'keydown'>): void {
        if (!this.isState(InteractionState.Keyable)) return;

        const action = mapKeyboardEventToAction(widgetEvent.sourceEvent);
        if (action?.activatesFocusIndicator === false) {
            this.focusIndicator?.overrideFocusVisible(this.getHoverDevice() === 'keyboard');
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
            case 'panxleft':
                return this.onPage(-1, widgetEvent);
            case 'panxright':
                return this.onPage(1, widgetEvent);
            case 'arrowup':
                return this.onArrow(-1, 0, widgetEvent);
            case 'arrowdown':
                return this.onArrow(1, 0, widgetEvent);
            case 'arrowleft':
                return this.onArrow(0, -1, widgetEvent);
            case 'arrowright':
                return this.onArrow(0, 1, widgetEvent);
            case 'home':
                return this.onHome(widgetEvent);
            case 'end':
                return this.onEnd(widgetEvent);
            case 'submit':
                return this.onSubmit(widgetEvent);
            case 'expand':
                return this.onExpandCollapse('series:keynav-expand', widgetEvent);
            case 'collapse':
                return this.onExpandCollapse('series:keynav-collapse', widgetEvent);
            case 'delete':
                return;
            default:
                action?.name satisfies undefined; // check for switch-exhaustion
        }
    }

    private onPage(delta: SeriesKeyNavPanXEvent['delta'], widgetEvent: KeyboardWidgetEvent<'keydown'>): void {
        if (!this.chart.hasPgUpPgDownSupport()) return;
        if (!this.onNav(widgetEvent)) return;
        const reverse: boolean = this.focus.series?.axes.x?.options.reverse === true;
        this.chart.ctx.eventsHub.emit('series:keynav-panx', { delta, reverse, widgetEvent });
    }

    private onNav(event: KeyboardWidgetEvent<'keydown'>): boolean {
        if (!this.isState(InteractionState.Focusable)) return false;
        this.setHoverDevice('keyboard');
        this.focusIndicator?.overrideFocusVisible(true);
        event.sourceEvent.preventDefault();
        return true;
    }

    private onArrow(otherIndexDelta: number, datumIndexDelta: number, event: KeyboardWidgetEvent<'keydown'>): void {
        if (!this.onNav(event)) return;
        this.focus.seriesIndex += otherIndexDelta;
        this.focus.datumIndex += datumIndexDelta;
        this.handleFocusFromUserInput({ datumIndexDelta, otherIndexDelta });
    }

    private onHome(event: KeyboardWidgetEvent<'keydown'>): void {
        if (this.chart.hasViewportSupport()) {
            return this.onPage('home', event);
        }

        if (!this.onNav(event)) return;
        this.handleFocusFromUserInput({ otherIndex: this.focus.seriesIndex, datumIndex: 0 });
    }

    private onEnd(event: KeyboardWidgetEvent<'keydown'>): void {
        if (this.chart.hasViewportSupport()) {
            return this.onPage('end', event);
        }

        if (!this.onNav(event)) return;
        const n = this.focus.series?.data?.data.length;
        if (n !== undefined) {
            this.handleFocusFromUserInput({ otherIndex: this.focus.seriesIndex, datumIndex: n - 1 });
        }
    }

    private onSubmit(event: KeyboardWidgetEvent<'keydown'>): void {
        if (!this.onNav(event)) return;
        const { series, datum } = this.focus;
        const sourceEvent = event.sourceEvent;
        if (series != null && datum != null) {
            const defaultBehavior = series.fireNodeClickEvent(sourceEvent, datum);
            if (defaultBehavior) {
                const syntheticEvent: KeyboardSyntheticMouseWidgetEvent = {
                    type: 'click',
                    device: 'keyboard',
                    sourceEvent,
                };
                this.emitSeriesAreaClickEvent(syntheticEvent, true, datum);
                this.update(ChartUpdateType.SERIES_UPDATE);
            }
        } else {
            this.chart.fireEvent<CallbackParamRules<AgChartClickEvent>>({
                type: 'click',
                event: sourceEvent,
            });
        }
    }

    private onExpandCollapse(
        type: 'series:keynav-expand' | 'series:keynav-collapse',
        widgetEvent: KeyboardWidgetEvent<'keydown'>
    ) {
        const nodeDatum = this.focus.datum;
        if (nodeDatum) {
            this.chart.ctx.eventsHub.emit(type, { nodeDatum, widgetEvent });
        }
    }

    private checkSeriesNodeClick(
        event: ClickLikeEvent & { preventZoomDblClick?: boolean }
    ): { node: PickedNode; target: SceneNode<unknown> | undefined } | undefined {
        const pickedNodes = this.pickNodes({ x: event.currentX, y: event.currentY }, 'event');
        const updated = this.pickManager.onPickedNodesTooltip(pickedNodes);
        if (pickedNodes === undefined || updated.active === undefined) return undefined;

        const distance = updated.paginationState == null ? pickedNodes.distance : 0;

        // A dedicated control (e.g. the org-chart expander) owns its clicks: it still drives its own
        // interaction via the `series-area:click` event emitted by the caller, but must not also
        // reach the user's node click / double-click listeners (AG-17947).
        const firesUserClickListeners = updated.active.series.firesUserClickListeners(pickedNodes.target);

        if (event.type === 'click') {
            const defaultBehavior = firesUserClickListeners
                ? updated.active.series.fireNodeClickEvent(event.sourceEvent, updated.active)
                : true;
            if (defaultBehavior) {
                const next = this.pickManager.nextCandidate();
                if (next.active !== undefined) {
                    const { active } = next;
                    const { canvasX, canvasY } = this.toCanvasCoordinates(event);
                    this.highlight.pendingHoverEvent ??= this.highlight.appliedHoverEvent;
                    this.handleHoverHighlight(false, {
                        active,
                        defaultCb: () => {
                            this.showTooltip(active, canvasX, canvasY, next.paginationState);
                        },
                    });
                }
            }
            return { node: updated.active, target: pickedNodes.target };
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

            if (firesUserClickListeners) {
                updated.active.series.fireNodeDoubleClickEvent(event.sourceEvent, updated.active);
            }
            return { node: updated.active, target: pickedNodes.target };
        }

        return undefined;
    }

    private handleFocusFromUserInput(inputs: HandleFocusInputs): void {
        this.handleFocus(inputs);
        this.chart.ctx.eventsHub.emit('series:focus-change', null);
    }

    private refreshFocus(): PickedFocusStatus {
        return this.handleFocus({ datumIndexDelta: 0, otherIndexDelta: 0 });
    }

    private handleFocus(inputs: HandleFocusInputs): PickedFocusStatus {
        const overlayFocus = this.chart.overlays.getFocusInfo(this.chart.ctx.localeManager);
        if (overlayFocus == null) {
            const status = this.handleSeriesFocus(inputs);
            if (status === PickedFocusStatus.SUCCESS) {
                this.announceMode = 'when-changed';
            } else {
                // As a safe-guard, always announce the next focus-change if this current focus-change failed.
                this.announceMode = 'always';
            }
            return status;
        } else {
            this.focusIndicator?.update(overlayFocus.rect, this.seriesRect, false);
            this.swapChain.update(overlayFocus.text);
            this.announceMode = 'always';
            return PickedFocusStatus.SUCCESS;
        }
    }

    private handleSeriesFocus(inputs: HandleFocusInputs): PickedFocusStatus {
        if ('datumIndexDelta' in inputs) {
            return this.handleSeriesFocusDeltas(inputs);
        } else {
            return this.handleSeriesFocusIndices(inputs);
        }
    }

    private makeUpdateFocusParamsFromDeltas(
        inputs: FocusDeltas
    ): UpdatePickedFocusInputs | PickedFocusStatus.SERIES_NOT_FOUND {
        const { otherIndexDelta, datumIndexDelta } = inputs;
        if (this.chart.chartType === 'standalone') {
            // Some chart type (treemap, sunburst, gauges) can only have 1 series. So we'll repurpose the focus.seriesIndex
            // value. Hierarchical charts use arrowup/down to change depth and gauges use arrowup/down to change datum type
            // (bar/needle, targets). This allows the hierarchical and gauge charts to piggyback on the base keyboard handling
            // implementation.
            this.focus.series = this.focus.sortedSeries[0];
            const datumIndex = this.focus.datumIndex;
            const otherIndex = this.focus.seriesIndex;
            const oldDatumIndex = this.focus.datumIndex - datumIndexDelta;
            const oldOtherIndex = this.focus.seriesIndex - otherIndexDelta;
            return {
                datumIndex,
                datumIndexDelta,
                oldDatumIndex,
                otherIndex,
                otherIndexDelta,
                oldOtherIndex,
            };
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
        return {
            datumIndex,
            datumIndexDelta,
            oldDatumIndex,
            otherIndex,
            otherIndexDelta,
            oldOtherIndex,
        };
    }

    private handleSeriesFocusDeltas(inputs: FocusDeltas): PickedFocusStatus {
        const updateInputs = this.makeUpdateFocusParamsFromDeltas(inputs);
        if (updateInputs === PickedFocusStatus.SERIES_NOT_FOUND) return PickedFocusStatus.SERIES_NOT_FOUND;
        return this.pickFocus(updateInputs);
    }

    private handleSeriesFocusIndices(inputs: FocusIndices): PickedFocusStatus {
        const { datumIndex, otherIndex } = inputs;
        const oldDatumIndex = this.focus.datumIndex;
        const oldOtherIndex = this.focus.seriesIndex;
        return this.pickFocus({
            datumIndex,
            datumIndexDelta: datumIndex - oldDatumIndex,
            oldDatumIndex: oldDatumIndex,
            otherIndex,
            otherIndexDelta: otherIndex - oldOtherIndex,
            oldOtherIndex: oldOtherIndex,
        });
    }

    private pickFocus(inputs: UpdatePickedFocusInputs): PickedFocusStatus {
        const { datumIndex, datumIndexDelta, otherIndex, otherIndexDelta } = inputs;
        const { focus, hoverRect, seriesRect } = this;
        if (focus.series == null || hoverRect == null) return PickedFocusStatus.SERIES_NOT_FOUND;

        const focusInputs: PickFocusInputs = { datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect };
        const pick = focus.series.pickFocus(focusInputs);
        if (!pick) return PickedFocusStatus.DATUM_NOT_FOUND;

        return this.updatePickedFocus(inputs, pick);
    }

    private pickViewportFocus(where: PickViewportFocusInputs['where']): PickedFocusStatus {
        const { focus, hoverRect } = this;
        if (focus.series == null || hoverRect == null) return PickedFocusStatus.SERIES_NOT_FOUND;

        const pick = focus.series.pickViewportFocus({ where, hoverRect, otherIndex: focus.seriesIndex });
        if (!pick) return PickedFocusStatus.DATUM_NOT_FOUND;

        const inputs: UpdatePickedFocusInputs = {
            datumIndex: pick.datumIndex,
            datumIndexDelta: 0,
            oldDatumIndex: this.focus.datumIndex,
            otherIndex: pick.otherIndex ?? this.focus.seriesIndex,
            otherIndexDelta: 0,
            oldOtherIndex: this.focus.seriesIndex,
        };
        return this.updatePickedFocus(inputs, pick);
    }

    private updatePickedFocus(inputs: UpdatePickedFocusInputs, pick: PickFocusOutputs): PickedFocusStatus {
        const { datumIndexDelta, oldDatumIndex, otherIndexDelta, oldOtherIndex } = inputs;
        const { focus, hoverRect } = this;
        if (focus.series == null || hoverRect == null) return PickedFocusStatus.SERIES_NOT_FOUND;
        if (focus.pendingViewportFocus !== undefined) return PickedFocusStatus.PENDING_VIEWPORT_FOCUS;

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
                const panTarget = focus.series.mapFocusBBoxToPanTarget(hoverRect, focusBBox);
                const panSuccess = this.chart.ctx.zoomManager?.panToBBox(hoverRect, panTarget);
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

        const tooltipContent = this.getTooltipContent(datum, 'aria-label');
        const keyboardEvent = makeKeyboardPointerEvent(focus.series, hoverRect, pick);

        // Update highlight/tooltip for keyboard users:
        if (keyboardEvent != null && this.getHoverDevice() === 'keyboard') {
            // Stop pending async mouse events from updating the highlight/tooltip. At this point, the most recent event
            // came from the keyboard so that's what we should honour.
            this.clearCachedEvents();

            if (!this.isState(InteractionState.Frozen)) {
                const meta = TooltipManager.makeTooltipMeta(keyboardEvent, focus.series, datum, pick.movedBounds);
                this.pickManager.maybeActivate(
                    datum,
                    ({ series }): void => {
                        this.chart.ctx.highlightManager.updateHighlight(this.id, datum);
                        if (this.isTooltipEnabled(series)) {
                            this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, tooltipContent);
                        }
                    },
                    { defaultCbArg: { series: focus.series } }
                );
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
            this.swapChain.update(this.getDatumAriaText('keynav', pick.datum, tooltipContent));
        }
    }

    private announceDataSelectionChange(): void {
        const { datum } = this.focus;
        if (datum !== undefined) {
            const tooltipContent = this.getTooltipContent(datum, 'aria-label');
            this.swapChain.update(this.getDatumAriaText('selectionChange', datum, tooltipContent));
        }
    }

    private getDatumAriaText(
        source: 'keynav' | 'selectionChange',
        datum: SeriesNodeDatum,
        tooltipContent: TooltipContent[]
    ): string {
        const description =
            tooltipContent == null ? '' : tooltipContentAriaLabel(tooltipContent, this.chart.ctx.logger);
        const ariaMeta = datum.series.getDatumAriaMeta(datum, description);
        const datumText = this.chart.ctx.localeManager.t('ariaAnnounceHoverDatum', {
            datum: ariaMeta?.text ?? description,
        });

        // TODO: We may want to use the 'aria-describedby' attribute for interaction instructions (similar to how we do
        // it with legend items).
        const withInstructions = (text: string): string => {
            return ariaMeta?.instructions ? [text, ...ariaMeta.instructions].join('. ') : text;
        };

        const dataSelectionStateText = this.getSelectedStateAriaText(datum);
        if (dataSelectionStateText === undefined) {
            return withInstructions(datumText);
        } else {
            // When using the Arrow/Tab keys, announce the 'selected/unselected' state at the end.
            //
            // When changing the selection state using the Space/Enter keys, announce the state first because that's the
            // most relevant information. This is how most screenreaders prioritise selection state on native elements
            // like a HTML tickbox.
            switch (source) {
                case 'keynav':
                    return withInstructions([datumText, dataSelectionStateText].join(', '));
                case 'selectionChange':
                    return withInstructions([dataSelectionStateText, datumText].join(', '));
                default:
                    return source satisfies never; // check for exhaustiveness
            }
        }
    }

    private getSelectedStateAriaText(datum: SeriesNodeDatum): string | undefined {
        const selectionState = datum.series.getDataSelectionState(datum.datumIndex);
        switch (selectionState) {
            case SelectionState.Item:
                return this.chart.ctx.localeManager.t('ariaAnnounceSelectedItem');

            case SelectionState.None:
            case SelectionState.OtherItem:
                return this.chart.ctx.localeManager.t('ariaAnnounceUnselectedItem');

            case SelectionState.OtherSeries:
            case undefined:
                return undefined;

            default:
                return selectionState satisfies never; // check for exhaustiveness
        }
    }

    private clearHighlight(delayed: boolean = false) {
        this.pickManager.maybeActivate(undefined, (): void => {
            this.highlight.pendingHoverEvent = undefined;
            this.highlight.appliedHoverEvent = undefined;
            this.chart.ctx.highlightManager.updateHighlight(this.id, undefined, delayed);
        });
    }

    private clearTooltip(delayed: boolean = false) {
        this.chart.ctx.tooltipManager.removeTooltip(this.id, undefined, delayed);
        this.tooltip.lastHover = undefined;
    }

    private clearAll(delayed: boolean = false) {
        if (this.isState(InteractionState.Frozen)) return;
        this.pickManager.onClearUI();
        this.clearHighlight(delayed);
        if (!this.pickManager.wasActivationPrevented()) {
            this.clearTooltip(delayed); // Pass through the delayed flag
        }
        this.focusIndicator?.clear();
    }

    private clearStaleHighlightTooltip(): void {
        // Clear tooltip/highlight state, but without broadcasting an AgActiveChangeEvent.
        if (this.getHoverDevice() === 'setState') {
            this.clearCachedEvents();
            this.chart.ctx.highlightManager.updateHighlight(this.id);
            this.chart.ctx.tooltipManager.removeTooltip(this.id);
        }
    }

    private clearUnpreventable(): void {
        this.activeState.lastActive = undefined;
        // FIXME: onClearUI() & clearHighlight() dispatch an 'activeChange' event which include a
        // preventDefault() method. Calling preventDefault() in this case would have no effect. Perhaps the
        // 'activeChange' event might need an additional property like `readonly preventable: boolean`.
        this.pickManager.onClearUI();
        this.clearHighlight(false);
        this.clearTooltip(false);
    }

    private clearCachedEvents(): void {
        this.tooltip.lastHover = undefined;
        this.highlight.appliedHoverEvent = undefined;
        this.highlight.pendingHoverEvent = undefined;
        this.highlight.stashedHoverEvent = undefined;
    }

    private createHoverScheduler() {
        return debouncedAnimationFrame(this.chart.ctx.domManager.getDocument(), () => {
            if (this.getHoverDevice() === 'setState') {
                return this.handleHoverFromState();
            }

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
    }

    private resetHoverScheduler() {
        this.hoverScheduler.cancel();
        this.hoverScheduler = this.createHoverScheduler();
    }

    private hoverScheduler: ReturnType<typeof debouncedAnimationFrame>;

    private handleHoverFromState(): void {
        const { active, paginationState } = this.pickManager.onPickedNodesAPIDebounced();
        if (active === undefined) return;

        this.pickManager.maybeActivate(active, (): void => {
            const refPoint = getDatumRefPoint(active.series, active, undefined);
            if (this.chart.tooltip.enabled) {
                if (!active.series.visible) {
                    this.clearStaleHighlightTooltip();
                } else if (refPoint) {
                    const { canvasX, canvasY } = refPoint;
                    const inViewport = this.activeState.highlightInViewport;
                    this.chart.ctx.highlightManager.updateHighlight(this.id, active, false, inViewport);
                    if (inViewport) {
                        this.showTooltip(active, canvasX, canvasY, paginationState);
                    } else {
                        this.clearTooltip();
                    }
                }
            }
        });
    }

    private handleHoverHighlight(redisplay: boolean, opts?: { active: PickedNode; defaultCb: () => void }) {
        this.highlight.appliedHoverEvent = this.highlight.pendingHoverEvent;
        this.highlight.pendingHoverEvent = undefined;

        const event = this.highlight.appliedHoverEvent;
        if (!event || !this.isState(InteractionState.Hoverable)) return;

        const { canvasX, canvasY } = this.toCanvasCoordinates(event);
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(canvasX, canvasY)) {
            this.clearHighlight();
            return;
        }

        const { range } = this.chart.highlight;
        const intent = range === 'tooltip' ? 'highlight-tooltip' : 'highlight';

        const active: PickedNode | undefined =
            opts?.active ??
            this.pickManager.onPickedNodesHighlight(this.pickNodes({ x: event.currentX, y: event.currentY }, intent));

        if (active === undefined) {
            this.pickManager.maybeActivate(undefined, () => {
                this.chart.ctx.highlightManager.updateHighlight(this.id, undefined, true); // true = delayed
                opts?.defaultCb();
            });
        } else {
            this.pickManager.maybeActivate(active, () => {
                this.chart.ctx.highlightManager.updateHighlight(this.id, active, false);
                opts?.defaultCb();
            });
        }
    }

    private handleHoverTooltip(event: HoverLikeEvent, redisplay: boolean) {
        if (!this.isState(InteractionState.Hoverable)) return;

        const { canvasX, canvasY } = this.toCanvasCoordinates(event);
        const targetElement = event.sourceEvent.target as HTMLElement;
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(canvasX, canvasY)) {
            if (this.getHoverDevice() == 'pointer') this.clearTooltip();
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

        const { active, paginationState } = this.pickManager.onPickedNodesTooltip(pick);
        // If the developer has called `preventDefault()` on the activeChange test (i.e. highlight update), then don't
        // touch the tooltip at all, leave it as-is until we get a new event that's not default-prevented.
        if (!this.pickManager.wasActivationPrevented()) {
            if (active === undefined) {
                if (this.getHoverDevice() == 'pointer') {
                    this.clearTooltip(true); // true = delayed
                }
            } else {
                this.showTooltip(active, canvasX, canvasY, paginationState);
            }
        }
    }

    private showTooltip(datum: PickedNode, canvasX: number, canvasY: number, pagination?: TooltipPaginationState) {
        const tooltipContent = this.getTooltipContent(datum, 'tooltip');
        const shouldUpdateTooltip = tooltipContent != null && tooltipContent.length > 0;
        if (shouldUpdateTooltip) {
            const { series } = datum;
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
            this.pickManager.maybeActivate(undefined, (): void => {
                this.tooltip.lastHover = undefined;
                this.chart.ctx.tooltipManager.removeTooltip(this.id, undefined, true); // true = delayed
                this.chart.ctx.highlightManager.updateHighlight(this.id, undefined, true); // true = delayed
            });
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

        // Skip SERIES_UPDATE when neither series has visual highlight effects
        const lastHighlightEnabled = lastSeries?.isHighlightEnabled() ?? false;
        if (event.highlightSuppressed && !lastHighlightEnabled) return;

        // When transitioning between highlight-enabled and highlight-disabled series,
        // all series need updating since their visual highlight state changes.
        const suppressionChanged = event.highlightSuppressed !== !lastHighlightEnabled;

        // NOTE: There's a rendering bug with on `seriesToUpdate` branch when calling `setState`; All series that
        // aren't included in the `seriesToUpdate` property get reset to an unhighlighted style. The root cause for
        // this is unknown, further investigation may be required.
        if (this.getHoverDevice() === 'setState' || newSeries == null || lastSeries == null || suppressionChanged) {
            this.update(ChartUpdateType.SERIES_UPDATE, { clearCallbackCache: true });
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, {
                seriesToUpdate: new Set([lastSeries, newSeries].filter(Boolean)),
                clearCallbackCache: true,
            });
        }
    }

    private onHighlightSelectionUpdate(event: HighlightSelectionUpdatedEvent): void {
        // When the chart is frozen, we want the chart to automatically remove the crosshair & tooltip when the frozen
        // active datum leaves the viewport (e.g. if user zoom/pans the view). Checking whether the highlighted node
        // intersects with the viewport is an expensive computation, but we only need to do this on frozen charts.
        if (!this.isState(InteractionState.Frozen) || !this.seriesRect) {
            this.activeState.highlightInViewport = true;
            return;
        }
        if (event.highlightSelection.length === 0) {
            return;
        }

        const highlightInViewport: boolean = computeHighlightInViewport(event.highlightSelection, this.seriesRect);
        this.activeState.highlightInViewport = highlightInViewport;
    }

    private pickNodes(point: Point, intent: SeriesNodePickIntent, exactMatchOnly?: boolean): PickedNodes | undefined {
        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();

        const clickIntent = intent === 'event' || intent === 'context-menu';
        const tooltipIntent = intent === 'tooltip' || intent === 'highlight-tooltip';
        const getIntentRange = (series: UnknownSeries) => {
            if (clickIntent) return series.properties.nodeClickRange;
            if (tooltipIntent) return series.properties.tooltip.range;
            return undefined;
        };

        // Check if any series with 'area' range (for the current intent) contains the point.
        const { x, y } = point;
        const seriesContainingPoint = new Set<UnknownSeries>();
        for (const series of reverseSeries) {
            if (series.visible && series.contentGroup.visible && getIntentRange(series) === 'area') {
                if (series.isPointInArea?.(x, y)) {
                    seriesContainingPoint.add(series);
                }
            }
        }

        const hasSeriesContainingPoint = seriesContainingPoint.size > 0;

        let result: PickedNodes | undefined;
        for (const series of reverseSeries) {
            if (!series.visible || !series.contentGroup.visible) continue;

            // If we found series with 'area' range containing the point, prefer those series.
            if (hasSeriesContainingPoint) {
                const hasAreaHit = getIntentRange(series) === 'area' && seriesContainingPoint.has(series);
                if (!hasAreaHit) continue;
            }

            const pick = series.pickNodes(point, intent, exactMatchOnly);
            if (pick == null || pick.picks.length === 0) continue;

            const { picks } = pick;
            const distance = picks[0].distance;
            // The topmost (last-rendered) hit; for org-charts this is the expander when it
            // overlaps the card, so the click resolves to the control the user sees.
            const target = picks.at(-1)?.target;

            if (distance === 0) {
                // Accumulate multiple series when the nodes are under the cursor
                // I.e. the distance is 0
                if (result?.distance !== 0) {
                    result = { matches: [], distance: 0, target };
                }

                for (const { datum } of picks) {
                    result.matches.push(datum);
                }
            } else if (result == null || result.distance > distance) {
                // Don't accumulate multiple datums when matching by nearest distance
                result = { matches: picks.map((p) => p.datum), distance, target };
            }
        }

        return result;
    }

    private isTooltipEnabled(series: PickedNode['series']): boolean {
        return series.tooltipEnabled ?? this.chart.tooltip.enabled;
    }

    // Do not return undefined tooltip content if we're obtaining it to update the series-area aria-label.
    // (CRT-869, CRT-901, CRT-871, CRT-909).
    private getTooltipContent(datum: SeriesNodeDatum, purpose: 'aria-label'): TooltipContent[];
    private getTooltipContent(datum: SeriesNodeDatum, purpose: 'tooltip'): TooltipContent[] | undefined;
    private getTooltipContent(datum: SeriesNodeDatum, purpose: 'aria-label' | 'tooltip'): TooltipContent[] | undefined {
        const { series, datumIndex } = datum;
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

    private onLegendHover(_event: null): void {
        if (!this.isState(InteractionState.Hoverable)) return;
        this.setHoverDevice('pointer');
        this.clearCachedEvents();
        this.chart.ctx.highlightManager.updateHighlight(this.id);
        this.chart.ctx.tooltipManager.removeTooltip(this.id);
    }

    private onActiveLoadMemento(event: ActiveLoadMementoEvent) {
        switch (event.activeItem?.type) {
            case undefined:
            case 'legend':
                return this.onActiveClear();
            case 'series-node':
                return this.onActiveDatum(event.activeItem, event);
            default:
                return event.activeItem?.type satisfies undefined;
        }
    }

    public onActiveClear() {
        this.pickManager.onClearAPI();
        this.setHoverDevice('setState');
        this.activeState.lastActive = undefined;
        this.clearHighlight();
        this.clearTooltip();
    }

    private refreshSetState(): void {
        if (this.activeState.lastActive === undefined) {
            this.pickManager.onClearUI();
            this.clearHighlight(false);
            this.clearTooltip(false);
        } else if (this.activeState.lastActive !== 'legend') {
            const { seriesId, itemId } = this.activeState.lastActive;
            const desiredPickedNodes: FindPickedNodesResult = this.findPickedNodes(seriesId, itemId);
            if (desiredPickedNodes === undefined) {
                // Active datum was removed (e.g. by a transaction); clear the active state.
                this.clearUnpreventable();
            } else if (desiredPickedNodes === 'series-hidden') {
                if (this.isState(InteractionState.Frozen)) {
                    this.clearStaleHighlightTooltip();
                } else {
                    this.pickManager.maybeActivate(undefined, () => {
                        this.activeState.lastActive = undefined;
                        this.clearCachedEvents();
                        this.chart.ctx.highlightManager.updateHighlight(this.id);
                        this.chart.ctx.tooltipManager.removeTooltip(this.id);
                    });
                }
            } else {
                this.pickManager.onPickedNodesAPI(desiredPickedNodes);
                this.hoverScheduler.schedule();
            }
        }
    }

    private onActiveDatum(activeItem: AgActiveItemState, event: ActiveLoadMementoEvent) {
        const { seriesId, itemId } = activeItem;
        const desiredPickedNodes: FindPickedNodesResult = this.findPickedNodes(seriesId, itemId);
        if (desiredPickedNodes === undefined) {
            event.reject();
            this.onActiveClear();
        } else {
            if (desiredPickedNodes !== 'series-hidden') {
                const picked = this.pickManager.onPickedNodesAPI(desiredPickedNodes);
                event.setDatum(picked);
            }
            this.setHoverDevice('setState');
            this.activeState.lastActive = { seriesId, itemId };
            if (event.initialState) {
                // Tooltip positioning relies on call `getBoundingClientRect()` on the `<canvas>`, whose size is not
                // yet initialised when applying `initialState`:
                this.chart.ctx.scene.applyPendingResize();
                this.handleHoverFromState();
            } else {
                this.clearCachedEvents();
                this.hoverScheduler.schedule();
            }
        }
    }

    private findPickedNodes(desiredSeriesId: string, desiredItemId: string | number): FindPickedNodesResult {
        const desiredSeries: PickedNode['series'] | undefined = this.series.find((s) => s.id === desiredSeriesId);
        if (desiredSeries == undefined) {
            this.chart.ctx.logger.warn(`Cannot find seriesId: "${desiredSeriesId}"`);
            return undefined;
        }

        if (!desiredSeries.visible) {
            return 'series-hidden';
        }

        const desiredDatum: PickedNode | undefined = desiredSeries.findNodeDatum(desiredItemId);
        if (desiredDatum == undefined) {
            this.chart.ctx.logger.warn(`Cannot find itemId: ${JSON.stringify(desiredItemId)}`);
            return undefined;
        }

        return { matches: [desiredDatum], distance: 0, target: undefined };
    }
}
