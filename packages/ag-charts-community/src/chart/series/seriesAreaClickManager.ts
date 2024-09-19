import type { AgChartClickEvent, AgChartDoubleClickEvent } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { Transformable } from '../../scene/transformable';
import type { TypedEvent } from '../../util/observable';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import { ChartUpdateType } from '../chartUpdateType';
import type { RegionEvent } from '../interaction/regionManager';
import { REGIONS } from '../interaction/regions';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { UpdateOpts } from '../updateService';
import { type Series } from './series';
import { pickNode } from './util';

/** Manager that handles all top-down series-area node-click related concerns and state. */
export class SeriesAreaClickManager extends BaseManager {
    private series: Series<any, any>[] = [];
    private seriesRect?: BBox;

    public constructor(
        private readonly id: string,
        private readonly chart: {
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
            seriesRoot: TranslatableGroup;
        },
        private readonly ctx: ChartContext
    ) {
        super();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            this.ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            this.ctx.regionManager.listenAll('dblclick', (event) => this.onClick(event)),
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            seriesRegion.addListener('hover', (event) => this.onHover(event)),
            seriesRegion.addListener('leave', () => this.onLeave()),
            horizontalAxesRegion.addListener('leave', () => this.onLeave()),
            verticalAxesRegion.addListener('leave', () => this.onLeave())
        );
    }

    protected override destructor() {}

    public seriesChanged(series: Series<any, any>[]) {
        this.series = series;
    }

    public dataChanged() {}

    public preSceneRender() {}

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.seriesRect = event.series.paddedRect;
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
