import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import { createId } from '../../util/id';
import type { TypedEvent } from '../../util/observable';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import { InteractionState, type PointerInteractionEvent, type PointerOffsets } from '../interaction/interactionManager';
import { REGIONS } from '../interaction/regions';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { Tooltip } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type Series } from './series';
import { SeriesAreaFocusManager } from './seriesAreaFocusManager';
import { SeriesAreaHighlightManager } from './seriesAreaHighlightManager';
import { SeriesAreaTooltipManager } from './seriesAreaTooltipManager';
import type { SeriesNodeDatum } from './seriesTypes';
import { pickNode } from './util';

/** Manager that handles all top-down series-area related concerns and state. */
export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private _series: Series<any, any>[] = [];
    set series(series: Series<any, any>[]) {
        this._series = series;
        this.focusManager.series = series;
        this.highlightManager.series = series;
        this.tooltipManager.series = series;
    }
    get series() {
        return this._series;
    }

    private readonly focusManager: SeriesAreaFocusManager;
    private readonly highlightManager: SeriesAreaHighlightManager;
    private readonly tooltipManager: SeriesAreaTooltipManager;

    private lastHover?: PointerOffsets;

    public constructor(
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion',
        tooltip: Tooltip,
        highlight: ChartHighlight,
        overlays: ChartOverlays
    ) {
        super();

        this.focusManager = new SeriesAreaFocusManager(this.id, chart, ctx, chartType, overlays);
        this.highlightManager = new SeriesAreaHighlightManager(this.id, chart, ctx, highlight);
        this.tooltipManager = new SeriesAreaTooltipManager(this.id, chart, ctx, tooltip);

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            () => this.focusManager.destroy(),
            () => this.highlightManager.destroy(),
            this.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            this.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            seriesRegion.addListener('hover', (event) => this.onHover(event)),
            seriesRegion.addListener('leave', () => this.onLeave()),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            horizontalAxesRegion.addListener('leave', () => this.onLeave()),
            verticalAxesRegion.addListener('leave', () => this.onLeave())
        );
    }

    public dataChanged() {
        this.lastHover = undefined;
        this.highlightManager.dataChanged();
    }

    public seriesUpdated() {
        if (this.lastHover) {
            this.onHover(this.lastHover);
        }
        this.highlightManager.seriesUpdated();
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    private onLeave(): void {
        this.lastHover = undefined;
        this.ctx.cursorManager.updateCursor('chart');
    }

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'>): void {
        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            const match = pickNode(this.series, { x: event.offsetX, y: event.offsetY }, 'context-menu');
            if (match) {
                this.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = match.datum;
            }
        }

        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode });
    }

    private onHover({ offsetX, offsetY }: PointerOffsets) {
        const found = pickNode(this.series, { x: offsetX, y: offsetY }, 'event');
        if (found?.series.hasEventListener('nodeClick') || found?.series.hasEventListener('nodeDoubleClick')) {
            this.ctx.cursorManager.updateCursor('chart', 'pointer');
        } else {
            this.ctx.cursorManager.updateCursor('chart');
        }
    }

    private onClick(event: PointerInteractionEvent<'click' | 'dblclick'>) {
        if (this.checkSeriesNodeClick(event)) {
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

    private checkSeriesNodeClick(
        event: PointerInteractionEvent<'click' | 'dblclick'> & { preventZoomDblClick?: boolean }
    ) {
        const result = pickNode(this.series, { x: event.offsetX, y: event.offsetY }, 'event');
        if (result && event.type === 'click') {
            result.series.fireNodeClickEvent(event.sourceEvent, result);
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
            event.preventZoomDblClick = result == null || result.distance > 0;

            if (result != null) {
                result.series.fireNodeDoubleClickEvent(event.sourceEvent, result);
                return true;
            }
        }

        return false;
    }
}
