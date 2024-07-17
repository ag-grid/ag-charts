import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { createId } from '../../util/id';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import type { HighlightChangeEvent } from '../interaction/highlightManager';
import { InteractionState, type PointerInteractionEvent, type PointerOffsets } from '../interaction/interactionManager';
import { REGIONS } from '../interaction/regions';
import { TooltipManager } from '../interaction/tooltipManager';
import type { LayoutCompleteEvent } from '../layout/layoutService';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_TOOLTIP_CLASS, Tooltip, type TooltipPointerEvent } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type Series, type SeriesNodePickIntent } from './series';
import { SeriesAreaFocusManager } from './seriesAreaFocusManager';
import type { ISeries, SeriesNodeDatum } from './seriesTypes';

type PickedNode = {
    series: Series<any, any>;
    datum: SeriesNodeDatum;
    distance: number;
};

type PointerOffsetsAndHistory = PointerOffsets & { pointerHistory?: PointerOffsets[] };

/** Manager that handles all top-down series-area related concerns and state. */
export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private _series: Series<any, any>[] = [];
    set series(series: Series<any, any>[]) {
        this._series = series;
        this.focusManager.series = series;
    }
    get series() {
        return this._series;
    }

    private hoverRect?: BBox;

    private readonly focusManager: SeriesAreaFocusManager;

    public constructor(
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion',
        private readonly tooltip: Tooltip,
        private readonly highlight: ChartHighlight,
        overlays: ChartOverlays
    ) {
        super();

        this.focusManager = new SeriesAreaFocusManager(this.id, chart, ctx, chartType, overlays);

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            () => this.focusManager.destroy(),
            this.ctx.domManager.addListener('resize', () => this.resetPointer()),
            this.ctx.layoutService.addListener('layout-complete', (event) => this.layoutComplete(event)),
            this.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            this.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            seriesRegion.addListener(
                'hover',
                (event) => this.onMouseMove(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            seriesRegion.addListener(
                'drag',
                (event) => this.onMouseMove(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            seriesRegion.addListener('leave', (event) => this.onLeave(event)),
            seriesRegion.addListener('blur', () => this.onBlur()),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            horizontalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            horizontalAxesRegion.addListener('leave', (event) => this.onLeave(event)),
            verticalAxesRegion.addListener('leave', (event) => this.onLeave(event)),
            this.ctx.animationManager.addListener('animation-start', () => this.onAnimationStart()),
            this.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            this.ctx.zoomManager.addListener('zoom-pan-start', () => this.resetPointer()),
            this.ctx.zoomManager.addListener('zoom-change', () => {
                this.resetPointer();
                this.ctx.focusIndicator.updateBounds(undefined);
            })
        );
    }

    public dataChanged() {
        this.resetPointer(true);
    }

    public seriesUpdated() {
        const tooltipMeta = this.ctx.tooltipManager.getTooltipMeta(this.id);
        if (tooltipMeta?.lastPointerEvent != null) {
            this.handlePointer(tooltipMeta.lastPointerEvent, true);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.hoverRect = event.series.paddedRect;
    }

    // x/y are local canvas coordinates in CSS pixels, not actual pixels
    private pickNode(point: Point, intent: SeriesNodePickIntent, exactMatchOnly?: boolean): PickedNode | undefined {
        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();

        let result: { series: Series<any, any>; datum: SeriesNodeDatum; distance: number } | undefined;
        for (const series of reverseSeries) {
            if (!series.visible || !series.rootGroup.visible) {
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

    private lastPick?: SeriesNodeDatum;

    private onMouseMove(event: PointerInteractionEvent<'hover' | 'drag'>): void {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();

        this.update(ChartUpdateType.SCENE_RENDER);
    }

    private onLeave(event: PointerInteractionEvent<'leave'>): void {
        const el = event.relatedElement;
        if (el && this.ctx.domManager.isManagedDOMElement(el)) return;

        this.resetPointer();
        this.update(ChartUpdateType.SCENE_RENDER);
        this.ctx.cursorManager.updateCursor('chart');
    }

    private onAnimationStart() {
        if (this.focusManager.hasFocus()) {
            this.onBlur();
        }
    }

    private onBlur(): void {
        this.resetPointer();
        // Do not consume blur events to allow the browser-focus to leave the canvas element.
    }

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'>): void {
        this.ctx.tooltipManager.removeTooltip(this.id);

        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            const match = this.checkSeriesNodeRange('context-menu', event);
            if (match) {
                this.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode });
    }

    resetPointer(highlightOnly = false) {
        if (!highlightOnly) {
            this.ctx.tooltipManager.removeTooltip(this.id);
        }
        this.ctx.highlightManager.updateHighlight(this.id);
        this.lastInteractionEvent = undefined;
    }

    private lastInteractionEvent?: TooltipPointerEvent<'hover' | 'drag'>;
    private readonly pointerScheduler = debouncedAnimationFrame(() => {
        if (!this.lastInteractionEvent) return;

        if (this.chart.performUpdateType <= ChartUpdateType.SERIES_UPDATE) {
            // Reschedule until the current update processing is complete, if we try to
            // perform a highlight mid-update then we may not have fresh node data to work with.
            this.pointerScheduler.schedule();
            return;
        }

        this.handlePointer(this.lastInteractionEvent, false);
        this.lastInteractionEvent = undefined;
    });

    private handlePointer(event: TooltipPointerEvent, redisplay: boolean) {
        // Ignored "pointer event" that comes from a keyboard. We don't need to worry about finding out
        // which datum to use in the highlight & tooltip because the keyboard just navigates through the
        // data directly.
        if (event.type === 'keyboard') return;

        const state = this.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { lastPick } = this;
        const { offsetX, offsetY } = event;

        const disablePointer = (highlightOnly = false) => {
            if (lastPick) {
                this.resetPointer(highlightOnly);
            }
        };

        if (redisplay ? this.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            disablePointer();
            return;
        }

        // Handle node highlighting and tooltip toggling when pointer within `tooltip.range`
        this.handlePointerTooltip(event, disablePointer);

        // Handle node highlighting and mouse cursor when pointer withing `series[].nodeClickRange`
        this.handlePointerNode(event, 'highlight');
    }

    private handlePointerTooltip(event: TooltipPointerEvent, disablePointer: (highlightOnly?: boolean) => void) {
        const { lastPick } = this;
        const { offsetX, offsetY, targetElement } = event;

        if (
            targetElement &&
            this.tooltip.interactive &&
            this.ctx.domManager.isManagedChildDOMElement(targetElement, 'canvas-overlay', DEFAULT_TOOLTIP_CLASS)
        ) {
            // Skip tooltip update if tooltip is interactive, and the source event was for a tooltip HTML element.
            return;
        }

        const pick = this.pickNode({ x: offsetX, y: offsetY }, 'tooltip');
        if (!pick) {
            this.ctx.tooltipManager.removeTooltip(this.id);
            if (this.highlight.range === 'tooltip') {
                disablePointer(true);
            }
            return;
        }

        const isNewDatum = this.highlight.range === 'node' || !lastPick || lastPick !== pick.datum;
        let html;

        if (isNewDatum) {
            html = pick.series.getTooltipHtml(pick.datum);

            if (this.highlight.range === 'tooltip' && pick.series.properties.highlight.enabled) {
                this.ctx.highlightManager.updateHighlight(this.id, pick.datum);
            }
        }

        const tooltipEnabled = this.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && (!isNewDatum || html !== undefined);

        const meta = TooltipManager.makeTooltipMeta(event, pick.datum);

        if (shouldUpdateTooltip) {
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    private handlePointerNode(event: PointerOffsetsAndHistory, intent: SeriesNodePickIntent) {
        const { range } = this.highlight;

        const found = this.checkSeriesNodeRange(intent, event);
        if (found) {
            if (found.series.hasEventListener('nodeClick') || found.series.hasEventListener('nodeDoubleClick')) {
                this.ctx.cursorManager.updateCursor('chart', 'pointer');
            }

            if (range === 'tooltip' && found.series.properties.tooltip.enabled) return;
            this.ctx.highlightManager.updateHighlight(this.id, found);
        }

        this.ctx.cursorManager.updateCursor('chart');
        if (range !== 'node') return;
        this.ctx.highlightManager.updateHighlight(this.id);
    }

    private onClick(event: PointerInteractionEvent<'click' | 'dblclick'>) {
        if (this.checkSeriesNodeClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            event.preventDefault();
            return;
        }
        const newEvent = { type: event.type === 'click' ? 'click' : 'doubleClick', event: event.sourceEvent } satisfies
            | AgChartClickEvent
            | AgChartDoubleClickEvent;
        this.chart.fireEvent(newEvent);
    }

    private checkSeriesNodeClick(event: PointerInteractionEvent<'click' | 'dblclick'>) {
        const result = this.checkSeriesNodeRange('event', event);
        if (!result) return false;

        if (event.type === 'click') {
            result.series.fireNodeClickEvent(event.sourceEvent, result.datum);
        } else if (event.type === 'dblclick') {
            result.series.fireNodeDoubleClickEvent(event.sourceEvent, result.datum);
        }
        return true;
    }

    private checkSeriesNodeRange(
        intent: SeriesNodePickIntent,
        event: PointerOffsetsAndHistory & { preventZoomDblClick?: boolean }
    ) {
        const match = this.pickNode({ x: event.offsetX, y: event.offsetY }, intent);

        // Find the node if exactly matched and update the highlight picked node
        if (match == null || match.distance > 0) {
            // See: AG-11737#TC3, AG-11676
            //
            // The Zoom module's double-click handler resets the zoom, but only if there isn't an
            // exact match on a node. This is counter-intuitive, and there's no built-in mechanism
            // in the InteractionManager / RegionManager for the Zoom module to listen to non-exact
            // series-rect double-clicks. As a workaround, we'll set this boolean to tell the Zoom
            // double-click handler to ignore the event whenever we are double-clicking exactly on
            // a node.
            event.preventZoomDblClick = true;
        }

        // First check if we should trigger the callback based on nearest node
        return match?.datum;
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
        if (newSeries?.properties.cursor && newDatum) {
            this.ctx.cursorManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        this.lastPick = event.currentHighlight;

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }
}
