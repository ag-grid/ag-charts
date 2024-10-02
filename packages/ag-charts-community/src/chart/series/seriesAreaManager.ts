import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { Transformable } from '../../scene/transformable';
import { setAttribute } from '../../util/attributeUtil';
import { createId } from '../../util/id';
import { clamp } from '../../util/number';
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

export interface SeriesAreaChartDependencies {
    fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
    getUpdateType(): ChartUpdateType;
    chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'gauge';
    seriesRoot: TranslatableGroup;
    ctx: ChartContext;
    tooltip: Tooltip;
    highlight: ChartHighlight;
    overlays: ChartOverlays;
}

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
    private hoverRect?: BBox;
    private readonly ariaLabel: SeriesAreaAriaLabel;

    private readonly highlight = {
        /** Last received event that still needs to be applied. */
        pendingHoverEvent: undefined as RegionEvent<'hover' | 'drag'> | undefined,
        /** Last applied event. */
        appliedHoverEvent: undefined as RegionEvent<'hover' | 'drag'> | undefined,
        /** Last applied event, which has been temporarily stashed during the main chart update cycle. */
        stashedHoverEvent: undefined as RegionEvent<'hover' | 'drag'> | undefined,
    };

    private readonly tooltip = {
        lastHover: undefined as RegionEvent<'hover'> | undefined,
    };

    private readonly focus = {
        sortedSeries: [] as Series<SeriesNodeDatum, SeriesProperties<object>>[],
        series: undefined as Series<any, any> | undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined as SeriesNodeDatum | undefined,
    };

    public constructor(private readonly chart: SeriesAreaChartDependencies) {
        super();

        const seriesRegion = chart.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = chart.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = chart.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);
        const mouseMoveStates = InteractionState.Default | InteractionState.Annotations;

        const labelEl = chart.ctx.domManager.addChild('series-area', 'series-area-aria-label');
        this.ariaLabel = new SeriesAreaAriaLabel(labelEl, `${this.id}-aria-label`);

        this.destroyFns.push(
            () => chart.ctx.domManager.removeChild('series-area', 'series-area-aria-label'),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            seriesRegion.addListener('drag', (event) => this.onHoverOrDrag(event), mouseMoveStates),
            seriesRegion.addListener('hover', (event) => this.onHover(event), mouseMoveStates),
            seriesRegion.addListener('leave', () => this.onLeave()),
            horizontalAxesRegion.addListener('hover', (event) => this.onHover(event), mouseMoveStates),
            horizontalAxesRegion.addListener('leave', () => this.onLeave()),
            verticalAxesRegion.addListener('hover', (event) => this.onHover(event), mouseMoveStates),
            verticalAxesRegion.addListener('leave', () => this.onLeave()),
            chart.ctx.animationManager.addListener('animation-start', () => this.clearAll()),
            chart.ctx.domManager.addListener('resize', () => this.clearAll()),
            chart.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            chart.ctx.keyNavManager.addListener('blur', () => this.clearAll()),
            chart.ctx.keyNavManager.addListener('focus', (event) => this.onFocus(event)),
            chart.ctx.keyNavManager.addListener('nav-hori', (event) => this.onNavHori(event)),
            chart.ctx.keyNavManager.addListener('nav-vert', (event) => this.onNavVert(event)),
            chart.ctx.keyNavManager.addListener('submit', (event) => this.onSubmit(event)),
            chart.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            chart.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            chart.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            chart.ctx.updateService.addListener('pre-scene-render', () => this.preSceneRender()),
            chart.ctx.zoomManager.addListener('zoom-change', () => this.clearAll()),
            chart.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearAll())
        );
    }

    public dataChanged() {
        this.highlight.stashedHoverEvent ??= this.highlight.appliedHoverEvent;
        this.chart.ctx.tooltipManager.removeTooltip(this.id);
        this.chart.ctx.focusIndicator.updateBounds(undefined);
        this.clearHighlight();
    }

    private preSceneRender() {
        this.refreshFocus();

        if (this.highlight.stashedHoverEvent != null) {
            this.highlight.pendingHoverEvent = this.highlight.stashedHoverEvent;
            this.highlight.stashedHoverEvent = undefined;
            this.handleHoverHighlight(true);
        }

        if (this.tooltip.lastHover != null) {
            this.handleHoverTooltip(this.tooltip.lastHover, true);
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
        this.ariaLabel.layoutComplete(event);
    }

    private onContextMenu(event: RegionEvent<'contextmenu'>): void {
        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        let position: { x: number; y: number } | undefined;
        if (this.chart.ctx.focusIndicator.isFocusVisible()) {
            pickedNode = this.chart.ctx.highlightManager.getActiveHighlight();
            if (pickedNode && this.seriesRect && pickedNode.midPoint) {
                position = {
                    x: this.seriesRect.x + pickedNode.midPoint.x,
                    y: this.seriesRect.y + pickedNode.midPoint.y,
                };
            }
        } else if (this.chart.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            const match = pickNode(this.series, { x: event.regionOffsetX, y: event.regionOffsetY }, 'context-menu');
            if (match) {
                this.chart.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        this.clearAll();
        this.chart.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode }, position);
    }

    private onLeave(): void {
        this.chart.ctx.cursorManager.updateCursor(this.id);
        if (!this.chart.ctx.focusIndicator.isFocusVisible()) this.clearAll();
    }

    private onHover(event: RegionEvent<'hover'>): void {
        this.tooltip.lastHover = event;
        this.onHoverOrDrag(event);
    }
    private onHoverOrDrag(event: RegionEvent<'hover' | 'drag'>): void {
        this.highlight.pendingHoverEvent = event;
        this.hoverScheduler.schedule();

        if (this.chart.ctx.interactionManager.getState() === InteractionState.Default) {
            const { regionOffsetX, regionOffsetY } = event;
            const found = pickNode(this.series, { x: regionOffsetX, y: regionOffsetY }, 'event');
            if (found?.series.hasEventListener('nodeClick') || found?.series.hasEventListener('nodeDoubleClick')) {
                this.chart.ctx.cursorManager.updateCursor(this.id, 'pointer');
            } else {
                this.chart.ctx.cursorManager.updateCursor(this.id);
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
        if (this.chart.ctx.focusIndicator.isFocusVisible()) {
            this.handleSeriesFocus(0, 0);
        }
    }

    private handleFocus(seriesIndexDelta: number, datumIndexDelta: number) {
        const overlayFocus = this.chart.overlays.getFocusInfo(this.chart.ctx.localeManager);
        if (overlayFocus == null) {
            this.handleSeriesFocus(seriesIndexDelta, datumIndexDelta);
        } else {
            this.chart.ctx.focusIndicator.updateBounds(overlayFocus.rect);
        }
    }

    private handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        if (this.chart.chartType === 'hierarchy') {
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
        if (!this.chart.ctx.focusIndicator.isFocusVisible()) return;

        // Update user interaction/interface:
        const keyboardEvent = makeKeyboardPointerEvent(this.chart.ctx.focusIndicator, pick);
        if (keyboardEvent !== undefined) {
            const html = focus.series.getTooltipHtml(datum);
            const meta = TooltipManager.makeTooltipMeta(keyboardEvent, datum);
            this.chart.ctx.highlightManager.updateHighlight(this.id, datum);
            this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, html);
            this.ariaLabel.text = this.getDatumAriaText(datum, html);
        }
    }

    private getDatumAriaText(datum: SeriesNodeDatum, html: TooltipContent): string {
        const description = html.ariaLabel;
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
        this.chart.ctx.focusIndicator.updateBounds(undefined);
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
        if (!event) return;

        const state = this.chart.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { offsetX, offsetY } = event;
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            this.clearHighlight();
            return;
        }

        let pickCoords = { x: event.regionOffsetX, y: event.regionOffsetY };
        if (event.region !== 'series') {
            pickCoords = Transformable.fromCanvasPoint(this.chart.seriesRoot, offsetX, offsetY);
        }

        const { range } = this.chart.highlight;
        const intent = range === 'tooltip' ? 'highlight-tooltip' : 'highlight';
        const found = pickNode(this.series, pickCoords, intent);
        if (found) {
            this.chart.ctx.highlightManager.updateHighlight(this.id, found.datum);
            return;
        }

        this.chart.ctx.highlightManager.updateHighlight(this.id); // FIXME: clearHighlight?
    }

    private handleHoverTooltip(event: RegionEvent<'hover'>, redisplay: boolean) {
        if (this.chart.ctx.focusIndicator.isFocusVisible()) return;

        const state = this.chart.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { offsetX, offsetY, targetElement, regionOffsetX, regionOffsetY } = event;
        if (redisplay ? this.chart.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            this.clearTooltip();
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

        let pickCoords = { x: regionOffsetX, y: regionOffsetY };
        if (event.region !== 'series') {
            pickCoords = Transformable.fromCanvasPoint(this.chart.seriesRoot, offsetX, offsetY);
        }

        const pick = pickNode(this.series, pickCoords, 'tooltip');
        if (!pick) {
            this.clearTooltip();
            return;
        }

        const html = pick.series.getTooltipHtml(pick.datum);
        const tooltipEnabled = this.chart.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && html != null;
        if (shouldUpdateTooltip) {
            const meta = TooltipManager.makeTooltipMeta(event, pick.datum);
            this.chart.ctx.tooltipManager.updateTooltip(this.id, meta, html);
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
