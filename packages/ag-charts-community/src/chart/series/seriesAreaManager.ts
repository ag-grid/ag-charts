import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import { createId } from '../../util/id';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import { InteractionState, type PointerInteractionEvent, type PointerOffsets } from '../interaction/interactionManager';
import { REGIONS } from '../interaction/regions';
import { TooltipManager } from '../interaction/tooltipManager';
import type { LayoutCompleteEvent } from '../layout/layoutService';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_TOOLTIP_CLASS, Tooltip, type TooltipPointerEvent } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type Series, type SeriesNodePickIntent } from './series';
import { SeriesAreaFocusManager } from './seriesAreaFocusManager';
import { SeriesAreaHighlightManager } from './seriesAreaHighlightManager';
import type { SeriesNodeDatum } from './seriesTypes';
import { pickNode } from './util';

type PointerOffsetsAndHistory = PointerOffsets & { pointerHistory?: PointerOffsets[] };

/** Manager that handles all top-down series-area related concerns and state. */
export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private _series: Series<any, any>[] = [];
    set series(series: Series<any, any>[]) {
        this._series = series;
        this.focusManager.series = series;
        this.highlightManager.series = series;
    }
    get series() {
        return this._series;
    }

    private hoverRect?: BBox;

    private readonly focusManager: SeriesAreaFocusManager;
    private readonly highlightManager: SeriesAreaHighlightManager;

    public constructor(
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion',
        private readonly tooltip: Tooltip,
        highlight: ChartHighlight,
        overlays: ChartOverlays
    ) {
        super();

        this.focusManager = new SeriesAreaFocusManager(this.id, chart, ctx, chartType, overlays);
        this.highlightManager = new SeriesAreaHighlightManager(this.id, chart, ctx, highlight);

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            () => this.focusManager.destroy(),
            () => this.highlightManager.destroy(),
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
            seriesRegion.addListener('leave', () => this.onLeave()),
            seriesRegion.addListener('blur', () => this.clearTooltip()),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            horizontalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            horizontalAxesRegion.addListener('leave', () => this.onLeave()),
            verticalAxesRegion.addListener('leave', () => this.onLeave()),
            this.ctx.animationManager.addListener('animation-start', () => this.clearTooltip()),
            this.ctx.domManager.addListener('resize', () => this.clearTooltip()),
            this.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearTooltip())
        );
    }

    public dataChanged() {
        this.clearState();
        this.highlightManager.dataChanged();
    }

    public seriesUpdated() {
        const tooltipMeta = this.ctx.tooltipManager.getTooltipMeta(this.id);
        if (tooltipMeta?.lastPointerEvent != null) {
            this.handlePointer(tooltipMeta.lastPointerEvent, true);
        }
        this.highlightManager.seriesUpdated();
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.hoverRect = event.series.paddedRect;
    }

    private lastPick?: SeriesNodeDatum;

    private onMouseMove(event: PointerInteractionEvent<'hover' | 'drag'>): void {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();
    }

    private onLeave(): void {
        this.clearTooltip();
        this.ctx.cursorManager.updateCursor('chart');
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

    private clearTooltip() {
        this.ctx.tooltipManager.removeTooltip(this.id);
        this.lastInteractionEvent = undefined;
    }

    private clearState() {
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

        const { offsetX, offsetY } = event;

        if (redisplay ? this.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            this.clearTooltip();
            return;
        }

        // Handle node highlighting and tooltip toggling when pointer within `tooltip.range`
        this.handlePointerTooltip(event);

        // Handle node highlighting and mouse cursor when pointer withing `series[].nodeClickRange`
        this.handlePointerNode(event, 'highlight');
    }

    private handlePointerTooltip(event: TooltipPointerEvent) {
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

        const pick = pickNode(this.series, { x: offsetX, y: offsetY }, 'tooltip');
        if (!pick) {
            this.clearTooltip();
            return;
        }

        const isNewDatum = !lastPick || lastPick !== pick.datum;
        let html;

        if (isNewDatum) {
            html = pick.series.getTooltipHtml(pick.datum);
        }

        const tooltipEnabled = this.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && (!isNewDatum || html !== undefined);

        const meta = TooltipManager.makeTooltipMeta(event, pick.datum);

        if (shouldUpdateTooltip) {
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    private handlePointerNode(event: PointerOffsetsAndHistory, intent: SeriesNodePickIntent) {
        const found = this.checkSeriesNodeRange(intent, event);
        if (found) {
            if (found.series.hasEventListener('nodeClick') || found.series.hasEventListener('nodeDoubleClick')) {
                this.ctx.cursorManager.updateCursor('chart', 'pointer');
            }
        }

        this.ctx.cursorManager.updateCursor('chart');
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
        const match = pickNode(this.series, { x: event.offsetX, y: event.offsetY }, intent);

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
}
