import type { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { Transformable } from '../../scene/transformable';
import { debouncedAnimationFrame } from '../../util/render';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import type { ChartHighlight } from '../chartHighlight';
import { ChartUpdateType } from '../chartUpdateType';
import type { HighlightChangeEvent } from '../interaction/highlightManager';
import { InteractionState } from '../interaction/interactionManager';
import type { RegionEvent } from '../interaction/regionManager';
import { REGIONS } from '../interaction/regions';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import type { UpdateOpts } from '../updateService';
import { type Series } from './series';
import type { ISeries } from './seriesTypes';
import { pickNode } from './util';

/** Manager that handles all top-down series-area highlight concerns and state. */
export class SeriesAreaHighlightManager extends BaseManager {
    private series: Series<any, any>[] = [];
    /** Last received event that still needs to be applied. */
    private pendingHoverEvent?: RegionEvent<'hover' | 'drag'>;
    /** Last applied event. */
    private appliedHoverEvent?: RegionEvent<'hover' | 'drag'>;
    /** Last applied event, which has been temporarily stashed during the main chart update cycle. */
    private stashedHoverEvent?: RegionEvent<'hover' | 'drag'>;
    private hoverRect?: BBox;

    public constructor(
        private readonly id: string,
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            seriesRoot: TranslatableGroup;
        },
        private readonly ctx: ChartContext,
        private readonly highlight: ChartHighlight
    ) {
        super();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);

        const mouseMoveStates = InteractionState.Default | InteractionState.Annotations;
        this.destroyFns.push(
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            this.ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            seriesRegion.addListener('hover', (event) => this.onHover(event), mouseMoveStates),
            seriesRegion.addListener('drag', (event) => this.onHover(event), mouseMoveStates),
            horizontalAxesRegion.addListener('hover', (event) => this.onHover(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onHover(event)),

            // Cases where highlight should be cleared.
            this.ctx.domManager.addListener('resize', () => this.clearHighlight()),
            seriesRegion.addListener('leave', () => this.clearHighlight(), mouseMoveStates),
            this.ctx.keyNavManager.addListener('blur', () => this.clearHighlight()),
            this.ctx.animationManager.addListener('animation-start', () => this.clearHighlight()),
            this.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearHighlight()),
            this.ctx.zoomManager.addListener('zoom-change', () => this.clearHighlight())
        );
    }

    protected override destructor() {}

    public seriesChanged(series: Series<any, any>[]) {
        this.series = series;
    }

    public dataChanged() {
        this.stashedHoverEvent ??= this.appliedHoverEvent;
        this.clearHighlight();
    }

    public preSceneRender() {
        if (this.stashedHoverEvent != null) {
            this.pendingHoverEvent = this.stashedHoverEvent;
            this.stashedHoverEvent = undefined;
            this.handleHover(true);
        }
    }

    private update(type?: ChartUpdateType, opts?: UpdateOpts) {
        this.ctx.updateService.update(type, opts);
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.hoverRect = event.series.paddedRect;
    }

    private clearHighlight() {
        this.pendingHoverEvent = undefined;
        this.appliedHoverEvent = undefined;
        this.ctx.highlightManager.updateHighlight(this.id);
    }

    private onHover(event: RegionEvent<'hover' | 'drag'>): void {
        this.pendingHoverEvent = event;
        this.hoverScheduler.schedule();
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
        this.appliedHoverEvent = this.pendingHoverEvent;
        this.pendingHoverEvent = undefined;

        const event = this.appliedHoverEvent;
        if (!event) return;

        const state = this.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { offsetX, offsetY } = event;
        if (redisplay ? this.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            this.clearHighlight();
            return;
        }

        let pickCoords = { x: event.regionOffsetX, y: event.regionOffsetY };
        if (event.region !== 'series') {
            pickCoords = Transformable.fromCanvasPoint(this.chart.seriesRoot, offsetX, offsetY);
        }

        const { range } = this.highlight;
        const intent = range === 'tooltip' ? 'highlight-tooltip' : 'highlight';
        const found = pickNode(this.series, pickCoords, intent);
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
