import { BBox } from '../../scene/bbox';
import type { TranslatableGroup } from '../../scene/group';
import { Transformable } from '../../scene/transformable';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import { ChartUpdateType } from '../chartUpdateType';
import { InteractionState } from '../interaction/interactionManager';
import type { RegionEvent } from '../interaction/regionManager';
import { REGIONS } from '../interaction/regions';
import { TooltipManager } from '../interaction/tooltipManager';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import { DEFAULT_TOOLTIP_CLASS, Tooltip } from '../tooltip/tooltip';
import { type Series } from './series';
import { pickNode } from './util';

/** Manager that handles all top-down series-area tooltip related concerns and state. */
export class SeriesAreaTooltipManager extends BaseManager {
    private series: Series<any, any>[] = [];
    private hoverRect = BBox.zero;
    private lastHover?: RegionEvent<'hover'>;

    public constructor(
        private readonly id: string,
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
            seriesRoot: TranslatableGroup;
        },
        private readonly ctx: ChartContext,
        private readonly tooltip: Tooltip
    ) {
        super();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            this.ctx.layoutManager.addListener('layout:complete', (event) => this.layoutComplete(event)),
            seriesRegion.addListener(
                'hover',
                (event) => this.onHover(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            horizontalAxesRegion.addListener('hover', (event) => this.onHover(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onHover(event)),

            // Events that clear tooltip.
            seriesRegion.addListener('leave', () => this.clearTooltip()),
            seriesRegion.addListener('contextmenu', () => this.clearTooltip(), InteractionState.All),
            horizontalAxesRegion.addListener('leave', () => this.clearTooltip()),
            verticalAxesRegion.addListener('leave', () => this.clearTooltip()),
            this.ctx.keyNavManager.addListener('blur', () => this.clearTooltip()),
            this.ctx.animationManager.addListener('animation-start', () => this.clearTooltip()),
            this.ctx.domManager.addListener('resize', () => this.clearTooltip()),
            this.ctx.zoomManager.addListener('zoom-pan-start', () => this.clearTooltip()),
            this.ctx.zoomManager.addListener('zoom-change', () => this.clearTooltip())
        );
    }

    public seriesChanged(series: Series<any, any>[]) {
        this.series = series;
    }

    public dataChanged() {
        this.ctx.tooltipManager.removeTooltip(this.id);
    }

    public preSceneRender() {
        if (this.lastHover != null) {
            this.handleHover(this.lastHover, true);
        }
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.hoverRect = event.series.paddedRect;
    }

    private onHover(event: RegionEvent<'hover'>): void {
        this.lastHover = event;
        this.hoverScheduler.schedule();
    }

    private clearTooltip() {
        this.ctx.tooltipManager.removeTooltip(this.id);
        this.lastHover = undefined;
    }

    private readonly hoverScheduler = debouncedAnimationFrame(() => {
        if (!this.lastHover) return;

        if (this.chart.performUpdateType <= ChartUpdateType.SERIES_UPDATE) {
            // Reschedule until the current update processing is complete, if we try to
            // perform a highlight mid-update then we may not have fresh node data to work with.
            this.hoverScheduler.schedule();
            return;
        }

        this.handleHover(this.lastHover, false);
    });

    private handleHover(event: RegionEvent<'hover'>, redisplay: boolean) {
        if (this.ctx.focusIndicator.isFocusVisible()) return;

        const state = this.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { offsetX, offsetY, targetElement, regionOffsetX, regionOffsetY } = event;
        if (redisplay ? this.ctx.animationManager.isActive() : !this.hoverRect?.containsPoint(offsetX, offsetY)) {
            this.clearTooltip();
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
        const tooltipEnabled = this.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && html != null;
        if (shouldUpdateTooltip) {
            const meta = TooltipManager.makeTooltipMeta(event, pick.datum);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }
}
