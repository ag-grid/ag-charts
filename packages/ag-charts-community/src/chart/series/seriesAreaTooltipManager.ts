import type { BBox } from '../../scene/bbox';
import type { TypedEvent } from '../../util/observable';
import { debouncedAnimationFrame } from '../../util/render';
import { BaseManager } from '../baseManager';
import type { ChartContext } from '../chartContext';
import { ChartUpdateType } from '../chartUpdateType';
import { InteractionState } from '../interaction/interactionManager';
import { REGIONS } from '../interaction/regions';
import { TooltipManager } from '../interaction/tooltipManager';
import type { LayoutCompleteEvent } from '../layout/layoutService';
import { DEFAULT_TOOLTIP_CLASS, Tooltip, type TooltipPointerEvent } from '../tooltip/tooltip';
import { type Series } from './series';
import { pickNode } from './util';

/** Manager that handles all top-down series-area tooltip related concerns and state. */
export class SeriesAreaTooltipManager extends BaseManager {
    private series: Series<any, any>[] = [];
    private hoverRect?: BBox;
    private lastHover?: TooltipPointerEvent<'hover'>;

    public constructor(
        private readonly id: string,
        private readonly chart: {
            performUpdateType: ChartUpdateType;
            fireEvent<TEvent extends TypedEvent>(event: TEvent): void;
        },
        private readonly ctx: ChartContext,
        private readonly tooltip: Tooltip
    ) {
        super();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.VERTICAL_AXES);

        this.destroyFns.push(
            this.ctx.layoutService.addListener('layout-complete', (event) => this.layoutComplete(event)),
            seriesRegion.addListener(
                'hover',
                (event) => this.onMouseMove(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            horizontalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),

            // Events that clear tooltip.
            seriesRegion.addListener('leave', () => this.clearTooltip()),
            seriesRegion.addListener('blur', () => this.clearTooltip()),
            seriesRegion.addListener('contextmenu', () => this.clearTooltip(), InteractionState.All),
            horizontalAxesRegion.addListener('leave', () => this.clearTooltip()),
            verticalAxesRegion.addListener('leave', () => this.clearTooltip()),
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
        this.clearState();
    }

    public seriesUpdated() {
        if (this.lastHover != null) {
            this.handleHover(this.lastHover, true);
        }
    }

    private layoutComplete(event: LayoutCompleteEvent): void {
        this.hoverRect = event.series.paddedRect;
    }

    private onMouseMove(event: TooltipPointerEvent<'hover'>): void {
        this.lastHover = event;
        this.hoverScheduler.schedule();
    }

    private clearTooltip() {
        this.ctx.tooltipManager.removeTooltip(this.id);
        this.lastHover = undefined;
    }

    private clearState() {
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
        this.lastHover = undefined;
    });

    private handleHover(event: TooltipPointerEvent<'hover'>, redisplay: boolean) {
        const state = this.ctx.interactionManager.getState();
        if (state !== InteractionState.Default && state !== InteractionState.Annotations) return;

        const { offsetX, offsetY, targetElement } = event;
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

        const pick = pickNode(this.series, { x: offsetX, y: offsetY }, 'tooltip');
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
