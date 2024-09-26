import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import { Transformable } from '../../integrated-charts-scene';
import type { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { clamp, setAttribute } from '../../sparklines-util';
import { createId } from '../../util/id';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import type { HighlightChangeEvent } from '../interaction/highlightManager';
import { InteractionState } from '../interaction/interactionManager';
import type { KeyNavEvent } from '../interaction/keyNavManager';
import type { RegionEvent } from '../interaction/regionManager';
import { REGIONS } from '../interaction/regions';
import { TooltipManager } from '../interaction/tooltipManager';
import { makeKeyboardPointerEvent } from '../keyboardUtil';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_TOOLTIP_CLASS, Tooltip, type TooltipContent } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type PickFocusOutputs, type Series } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { ISeries, SeriesNodeDatum } from './seriesTypes';
import { pickNode } from './util';

class SeriesAreaAriaLabel {
    constructor(
        private readonly element: HTMLElement,
        public readonly id: string
    ) {
        element.id = id;
        element.style.display = 'none';
        setAttribute(element.parentElement, 'aria-labelledby', id);
    }
    layoutComplete(event: LayoutCompleteEvent) {
        this.element.parentElement!.style.width = `${event.chart.width}px`;
        this.element.parentElement!.style.height = `${event.chart.height}px`;
    }
    set text(text: string) {
        this.element.textContent = text;
    }
}

export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private series: Series<any, any>[] = [];
    private seriesRect?: BBox;
    private readonly ariaLabel: SeriesAreaAriaLabel;

    /** Last received event that still needs to be applied. */
    private pendingHoverEvent?: RegionEvent<'hover' | 'drag'>;
    /** Last applied event. */
    private appliedHoverEvent?: RegionEvent<'hover' | 'drag'>;
    /** Last applied event, which has been temporarily stashed during the main chart update cycle. */
    private stashedHoverEvent?: RegionEvent<'hover' | 'drag'>;
    private hoverRect?: BBox;

    private readonly focus = {
        hasFocus: false,
        sortedSeries: [] as Series<SeriesNodeDatum, SeriesProperties<object>>[],
        series: undefined as Series<any, any> | undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined as SeriesNodeDatum | undefined,
    };

    public constructor(
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
            seriesRoot: TranslatableGroup;
        },
        private readonly ctx: ChartContext,
        private readonly chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'gauge',
        private readonly tooltip: Tooltip,
        private readonly highlight: ChartHighlight,
        private readonly overlays: ChartOverlays
    ) {
        super();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);
        const mouseMoveStates = InteractionState.Default | InteractionState.Annotations;

        const labelEl = this.ctx.domManager.addChild('series-area', 'series-area-aria-label');
        this.ariaLabel = new SeriesAreaAriaLabel(labelEl, `${this.id}-aria-label`);

        this.destroyFns.push(
            () => this.ctx.domManager.removeChild('series-area', 'series-area-aria-label'),
            this.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            this.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            seriesRegion.addListener('hover', (event) => this.onHover(event)),
            seriesRegion.addListener('leave', () => this.onLeave()),
            horizontalAxesRegion.addListener('leave', () => this.onLeave()),
            verticalAxesRegion.addListener('leave', () => this.onLeave()),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            seriesRegion.addListener('drag', (event) => this.onHover(event), mouseMoveStates),
            seriesRegion.addListener('hover', (event) => this.onHover(event), mouseMoveStates),
            seriesRegion.addListener('leave', () => this.onLeave()),
            horizontalAxesRegion.addListener('hover', (event) => this.onHover(event), mouseMoveStates),
            horizontalAxesRegion.addListener('leave', () => this.onLeave()),
            verticalAxesRegion.addListener('hover', (event) => this.onHover(event), mouseMoveStates),
            verticalAxesRegion.addListener('leave', () => this.onLeave()),
            this.ctx.animationManager.addListener('animation-start', () => this.clearAll()),
            this.ctx.domManager.addListener('resize', () => this.clearAll()),
            this.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            this.ctx.keyNavManager.addListener('blur', () => this.onBlur()),
            this.ctx.keyNavManager.addListener('focus', (event) => this.onFocus(event)),
            this.ctx.keyNavManager.addListener('nav-hori', (event) => this.onNavHori(event)),
            this.ctx.keyNavManager.addListener('nav-vert', (event) => this.onNavVert(event)),
            this.ctx.keyNavManager.addListener('submit', (event) => this.onSubmit(event)),
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            this.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            this.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            this.ctx.updateService.addListener('pre-scene-render', () => this.preSceneRender()),
            this.ctx.zoomManager.addListener('zoom-change', () => this.clearAll()),
            this.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearAll())
        );
    }

    public dataChanged() {
        this.stashedHoverEvent ??= this.appliedHoverEvent;
        this.clearAll();
    }

    private preSceneRender() {
        this.refreshFocus();

        if (this.stashedHoverEvent != null) {
            this.pendingHoverEvent = this.stashedHoverEvent;
            this.stashedHoverEvent = undefined;
            this.handleHover(true);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
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
        this.onBlur();
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.seriesRect = event.series.rect;
        this.hoverRect = event.series.paddedRect;
        this.ariaLabel.layoutComplete(event);
    }

    private onContextMenu(event: RegionEvent<'contextmenu'>): void {
        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        let position: { x: number; y: number } | undefined;
        if (this.ctx.focusIndicator.isFocusVisible()) {
            pickedNode = this.ctx.highlightManager.getActiveHighlight();
            if (pickedNode && this.seriesRect && pickedNode.midPoint) {
                position = {
                    x: this.seriesRect.x + pickedNode.midPoint.x,
                    y: this.seriesRect.y + pickedNode.midPoint.y,
                };
            }
        } else if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            const match = pickNode(this.series, { x: event.regionOffsetX, y: event.regionOffsetY }, 'context-menu');
            if (match) {
                this.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        this.clearAll();
        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode }, position);
    }

    private onLeave(): void {
        this.ctx.cursorManager.updateCursor(this.id);
        if (!this.ctx.focusIndicator.isFocusVisible()) this.clearAll();
    }

    private onHover(event: RegionEvent<'hover' | 'drag'>): void {
        this.pendingHoverEvent = event;
        this.hoverScheduler.schedule();

        if (this.ctx.interactionManager.getState() === InteractionState.Default) {
            const { regionOffsetX, regionOffsetY } = event;
            const found = pickNode(this.series, { x: regionOffsetX, y: regionOffsetY }, 'event');
            if (found?.series.hasEventListener('nodeClick') || found?.series.hasEventListener('nodeDoubleClick')) {
                this.ctx.cursorManager.updateCursor(this.id, 'pointer');
            } else {
                this.ctx.cursorManager.updateCursor(this.id);
            }
        }
    }

    private onClick(event: RegionEvent<'click' | 'dblclick'>) {
        if (this.seriesRect?.containsPoint(event.offsetX, event.offsetY) && this.checkSeriesNodeClick(event)) {
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

    private onFocus(event: KeyNavEvent<'focus'>): void {
        this.handleFocus(0, 0);
        event.preventDefault();
        this.focus.hasFocus = true;
    }

    private onNavVert(event: KeyNavEvent<'nav-vert'>): void {
        this.focus.seriesIndex += event.delta;
        this.handleFocus(event.delta, 0);
        event.preventDefault();
    }

    private onNavHori(event: KeyNavEvent<'nav-hori'>): void {
        this.focus.datumIndex += event.delta;
        this.handleFocus(0, event.delta);
        event.preventDefault();
    }

    private onBlur(): void {
        this.focus.hasFocus = false;
        this.clearAll();
    }

    private onSubmit(event: KeyNavEvent<'submit'>): void {
        const { series, datum } = this.focus;
        const sourceEvent = event.sourceEvent.sourceEvent;
        if (series !== undefined && datum !== undefined) {
            series.fireNodeClickEvent(sourceEvent, datum);
        } else {
            this.chart.fireEvent<AgChartClickEvent>({
                type: 'click',
                event: sourceEvent,
            });
        }
        event.preventDefault();
    }

    private checkSeriesNodeClick(event: RegionEvent<'click' | 'dblclick'> & { preventZoomDblClick?: boolean }) {
        let point = { x: event.regionOffsetX, y: event.regionOffsetY };
        if (event.region !== 'series') {
            point = Transformable.fromCanvasPoint(this.chart.seriesRoot, event.offsetX, event.offsetY);
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

    private refreshFocus() {
        if (this.focus.hasFocus) {
            this.handleSeriesFocus(0, 0);
        }
    }

    private handleFocus(seriesIndexDelta: number, datumIndexDelta: number) {
        this.focus.hasFocus = true;
        const overlayFocus = this.overlays.getFocusInfo(this.ctx.localeManager);
        if (overlayFocus == null) {
            this.handleSeriesFocus(seriesIndexDelta, datumIndexDelta);
        } else {
            this.ctx.focusIndicator.updateBounds(overlayFocus.rect);
        }
    }

    private handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        if (this.chartType === 'hierarchy') {
            this.handleHierarchySeriesFocus(otherIndexDelta, datumIndexDelta);
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
        this.updatePickedFocus(pick);
    }

    private handleHierarchySeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        // Hierarchial charts (treemap, sunburst) can only have 1 series. So we'll repurpose the focus.seriesIndex
        // value to control the focused depth. This allows the hierarchial charts to piggy-back on the base keyboard
        // handling implementation.
        this.focus.series = this.focus.sortedSeries[0];
        const {
            focus: { series, seriesIndex: otherIndex, datumIndex },
            seriesRect,
        } = this;
        if (series === undefined) return;
        const pick = series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick);
    }

    private updatePickedFocus(pick: PickFocusOutputs | undefined) {
        const { focus } = this;
        if (pick === undefined || focus.series === undefined) return;

        const { datum, datumIndex } = pick;
        focus.datumIndex = datumIndex;
        focus.datum = datum;

        // Only update the highlight/tooltip/status if this is a keyboard user.
        if (!this.ctx.focusIndicator.isFocusVisible()) return;

        // Update user interaction/interface:
        const keyboardEvent = makeKeyboardPointerEvent(this.ctx.focusIndicator, pick);
        if (keyboardEvent !== undefined) {
            const html = focus.series.getTooltipHtml(datum);
            const meta = TooltipManager.makeTooltipMeta(keyboardEvent, datum);
            this.ctx.highlightManager.updateHighlight(this.id, datum);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
            this.ariaLabel.text = this.getDatumAriaText(datum, html);
        }
    }

    private getDatumAriaText(datum: SeriesNodeDatum, html: TooltipContent): string {
        const description = html.ariaLabel;
        return this.ctx.localeManager.t('ariaAnnounceHoverDatum', {
            datum: datum.series.getDatumAriaText?.(datum, description) ?? description,
        });
    }

    private clearHighlight() {
        this.pendingHoverEvent = undefined;
        this.appliedHoverEvent = undefined;
        this.ctx.highlightManager.updateHighlight(this.id);
    }

    private clearTooltip() {
        this.ctx.tooltipManager.removeTooltip(this.id);
        this.pendingHoverEvent = undefined;
    }

    private clearAll() {
        this.clearHighlight();
        this.clearTooltip();
        this.ctx.focusIndicator.updateBounds(undefined);
    }

    private readonly hoverScheduler = debouncedAnimationFrame(() => {
        if (!this.pendingHoverEvent) return;

        if (this.chart.performUpdateType <= ChartUpdateType.SERIES_UPDATE) {
            // Reschedule until the current update processing is complete, if we try to
            // perform a highlight mid-update then we may not have fresh node data to work with.
            this.hoverScheduler.schedule();
            return;
        }

        this.handleHover(false);
    });

    private handleHover(redisplay: boolean) {
        if (this.ctx.focusIndicator.isFocusVisible()) return;

        this.appliedHoverEvent = this.pendingHoverEvent;
        this.pendingHoverEvent = undefined;

        const event = this.appliedHoverEvent;
        if (!event) return;

        const state = this.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { offsetX, offsetY, targetElement } = event;
        if (redisplay ? this.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            this.clearAll();
            return;
        }

        if (
            targetElement &&
            this.tooltip.interactive &&
            this.ctx.domManager.isManagedChildDOMElement(targetElement, 'canvas-overlay', DEFAULT_TOOLTIP_CLASS)
        ) {
            // Skip tooltip update if tooltip is interactive, and the source event was for a tooltip HTML element.
            return;
        }
        let pickCoords = { x: event.regionOffsetX, y: event.regionOffsetY };
        if (event.region !== 'series') {
            pickCoords = Transformable.fromCanvasPoint(this.chart.seriesRoot, offsetX, offsetY);
        }

        const tooltipPick = pickNode(this.series, pickCoords, 'tooltip');
        const highlightPick =
            this.highlight.range === 'tooltip'
                ? pickNode(this.series, pickCoords, 'highlight-tooltip')
                : pickNode(this.series, pickCoords, 'highlight');

        if (tooltipPick) {
            const html = tooltipPick.series.getTooltipHtml(tooltipPick.datum);
            const tooltipEnabled = this.tooltip.enabled && tooltipPick.series.tooltipEnabled;
            const shouldUpdateTooltip = tooltipEnabled && html != null;
            if (shouldUpdateTooltip) {
                const meta = TooltipManager.makeTooltipMeta(event, tooltipPick.datum);
                this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
            }
        } else {
            this.clearTooltip();
        }

        if (highlightPick) {
            this.ctx.highlightManager.updateHighlight(this.id, highlightPick.datum);
        } else {
            this.ctx.highlightManager.updateHighlight(this.id); // FIXME: clearHighlight?
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
            this.ctx.cursorManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.properties.cursor && newSeries?.properties.cursor !== 'default' && newDatum) {
            this.ctx.cursorManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }
}
