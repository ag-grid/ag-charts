import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';
import type { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { createId } from '../../util/id';
import type { TypedEvent } from '../../util/observable';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import { InteractionState } from '../interaction/interactionManager';
import type { RegionEvent } from '../interaction/regionManager';
import { REGIONS } from '../interaction/regions';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { Tooltip } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type Series } from './series';
import { SeriesAreaFocusManager } from './seriesAreaFocusManager';
import { SeriesAreaHighlightManager } from './seriesAreaHighlightManager';
import { SeriesAreaTooltipManager } from './seriesAreaTooltipManager';
import type { SeriesNodeDatum } from './seriesTypes';
import { pickNode } from './util';
import { Transformable } from '../../integrated-charts-scene';
import type { SeriesProperties } from './seriesProperties';

interface SeriesAreaSubManager {
    seriesChanged(series: Series<any, any>[]): void;
    dataChanged?: () => void;
    preSceneRender?: () => void;

    destroy(): void;
}

/** Manager that handles all top-down series-area related concerns and state. */
export class SeriesAreaManager extends BaseManager {
    readonly id = createId(this);

    private series: Series<any, any>[] = [];
    private seriesRect?: BBox;

    private readonly subManagers: SeriesAreaSubManager[];

    public constructor(
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
            seriesRoot: TranslatableGroup;
        },
        private readonly ctx: ChartContext,
        chartType: 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'gauge',
        tooltip: Tooltip,
        highlight: ChartHighlight,
        overlays: ChartOverlays
    ) {
        super();

        this.subManagers = [
            new SeriesAreaFocusManager(this.id, chart, ctx, chartType, overlays),
            new SeriesAreaHighlightManager(this.id, chart, ctx, highlight),
            new SeriesAreaTooltipManager(this.id, chart, ctx, tooltip),
        ];

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            () => this.subManagers.forEach((s) => s.destroy()),
            this.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            this.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            seriesRegion.addListener('hover', (event) => this.onHover(event)),
            seriesRegion.addListener('leave', () => this.onLeave()),
            horizontalAxesRegion.addListener('leave', () => this.onLeave()),
            verticalAxesRegion.addListener('leave', () => this.onLeave()),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), InteractionState.All),
            this.ctx.updateService.addListener('pre-scene-render', () => this.preSceneRender()),
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event))
        );
    }

    public dataChanged() {
        for (const manager of this.subManagers) {
            manager.dataChanged?.();
        }
    }

    private preSceneRender() {
        for (const manager of this.subManagers) {
            manager.preSceneRender?.();
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    public seriesChanged(series: Series<SeriesNodeDatum, SeriesProperties<object>>[]) {
        this.series = series;

        for (const manager of this.subManagers) {
            manager.seriesChanged([...this.series]);
        }
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.seriesRect = event.series.rect;
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

        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode }, position);
    }

    private onLeave(): void {
        this.ctx.cursorManager.updateCursor(this.id);
    }

    private onHover({ regionOffsetX, regionOffsetY }: RegionEvent) {
        const found = pickNode(this.series, { x: regionOffsetX, y: regionOffsetY }, 'event');
        if (found?.series.hasEventListener('nodeClick') || found?.series.hasEventListener('nodeDoubleClick')) {
            this.ctx.cursorManager.updateCursor(this.id, 'pointer');
        } else {
            this.ctx.cursorManager.updateCursor(this.id);
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
}
