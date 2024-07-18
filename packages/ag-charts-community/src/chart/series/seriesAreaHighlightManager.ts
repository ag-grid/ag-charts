import type { BBox } from '../../scene/bbox';
import { debouncedAnimationFrame } from '../../util/render';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import type { HighlightChangeEvent } from '../interaction/highlightManager';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import { REGIONS } from '../interaction/regions';
import type { LayoutCompleteEvent } from '../layout/layoutService';
import { type TooltipPointerEvent } from '../tooltip/tooltip';
import type { UpdateOpts } from '../updateService';
import { type Series } from './series';
import type { ISeries } from './seriesTypes';
import { pickNode } from './util';

/** Manager that handles all top-down series-area highlight concerns and state. */
export class SeriesAreaHighlightManager extends BaseManager {
    private series: Series<any, any>[] = [];
    private lastHoverEvent?: PointerInteractionEvent<'hover'>;
    private hoverRect?: BBox;

    public constructor(
        private readonly id: string,
        private readonly chart: {
            performUpdateType: ChartUpdateType;
        },
        private readonly ctx: ChartContext,
        private readonly highlight: ChartHighlight
    ) {
        super();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            this.ctx.layoutService.addListener('layout-complete', (event) => this.layoutComplete(event)),
            this.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            seriesRegion.addListener(
                'hover',
                (event) => this.onHover(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            horizontalAxesRegion.addListener('hover', (event) => this.onHover(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onHover(event)),

            // Cases where highlight should be cleared.
            this.ctx.domManager.addListener('resize', () => this.clearHighlight()),
            seriesRegion.addListener('leave', () => this.clearHighlight()),
            seriesRegion.addListener('blur', () => this.clearHighlight()),
            this.ctx.animationManager.addListener('animation-start', () => this.clearHighlight()),
            this.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearHighlight()),
            this.ctx.zoomManager.addListener('zoom-change', () => this.clearHighlight())
        );
    }

    public seriesChanged(series: Series<any, any>[]) {
        this.series = series;
    }

    public dataChanged() {
        this.clearHighlight();
    }

    public seriesUpdated() {
        if (this.lastHoverEvent != null) {
            this.onHover(this.lastHoverEvent);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.hoverRect = event.series.paddedRect;
    }

    private clearHighlight() {
        this.ctx.highlightManager.updateHighlight(this.id);
        this.lastHoverEvent = undefined;
        this.update(ChartUpdateType.SCENE_RENDER);
    }

    private onHover(event: PointerInteractionEvent<'hover'>): void {
        this.lastHoverEvent = event;
        this.hoverScheduler.schedule();
    }

    private readonly hoverScheduler = debouncedAnimationFrame(() => {
        if (!this.lastHoverEvent) return;

        if (this.chart.performUpdateType <= ChartUpdateType.SERIES_UPDATE) {
            // Reschedule until the current update processing is complete, if we try to
            // perform a highlight mid-update then we may not have fresh node data to work with.
            this.hoverScheduler.schedule();
            return;
        }

        this.handleHover(this.lastHoverEvent, false);
        this.lastHoverEvent = undefined;
    });

    private handleHover(event: TooltipPointerEvent, redisplay: boolean) {
        const state = this.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { offsetX, offsetY } = event;
        if (redisplay ? this.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            this.clearHighlight();
            return;
        }

        const { range } = this.highlight;

        const intent = range === 'tooltip' ? 'highlight-tooltip' : 'highlight';
        const found = pickNode(this.series, { x: event.offsetX, y: event.offsetY }, intent);
        if (found) {
            this.ctx.highlightManager.updateHighlight(this.id, found.datum);
            return;
        }

        this.ctx.highlightManager.updateHighlight(this.id);
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

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }
}
