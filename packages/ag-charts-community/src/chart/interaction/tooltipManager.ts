import type { DOMManager } from '../../dom/domManager';
import type { BBoxValues } from '../../util/bboxinterface';
import { StateTracker } from '../../util/stateTracker';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { SeriesTooltip } from '../series/seriesTooltip';
import type { ErrorBoundSeriesNodeDatum, ISeries, SeriesNodeDatum } from '../series/seriesTypes';
import { getDatumRefPoint } from '../series/util';
import type { Tooltip, TooltipContent, TooltipMeta, TooltipPointerEvent } from '../tooltip/tooltip';

interface TooltipState {
    content?: TooltipContent[];
    meta?: TooltipMeta;
}

/**
 * Manages the tooltip HTML an element. Tracks the requested HTML from distinct dependents and
 * handles conflicting tooltip requests.
 */
export class TooltipManager {
    private readonly stateTracker = new StateTracker<TooltipState>();
    private readonly suppressState = new StateTracker(false);
    private appliedState: TooltipState | null = null;

    public constructor(
        private readonly domManager: DOMManager,
        private readonly tooltip: Tooltip
    ) {
        tooltip.setup(domManager);

        domManager.addListener('hidden', () => this.tooltip.hide());
    }

    public updateTooltip(callerId: string, meta?: TooltipMeta, content?: TooltipContent[]) {
        if (!this.tooltip.enabled) return;
        content ??= this.stateTracker.get(callerId)?.content;
        this.stateTracker.set(callerId, { content, meta });
        this.applyStates();
    }

    public removeTooltip(callerId: string) {
        if (!this.tooltip.enabled) return;
        this.stateTracker.delete(callerId);
        this.applyStates();
    }

    public suppressTooltip(callerId: string) {
        this.suppressState.set(callerId, true);
    }

    public unsuppressTooltip(callerId: string) {
        this.suppressState.delete(callerId);
    }

    public destroy() {
        this.domManager.removeStyles('tooltip');
    }

    private applyStates() {
        const id = this.stateTracker.stateId();
        const state = id ? this.stateTracker.get(id) : null;

        if (this.suppressState.stateValue() || state?.meta == null || state?.content == null) {
            this.appliedState = null;
            this.tooltip.hide();
            return;
        }

        const canvasRect = this.domManager.getBoundingClientRect();
        const boundingRect = this.tooltip.bounds === 'extended' ? this.domManager.getOverlayClientRect() : canvasRect;

        if (this.appliedState?.content === state?.content) {
            const renderInstantly = this.tooltip.isVisible();
            this.tooltip.show(boundingRect, canvasRect, state?.meta, null, renderInstantly);
        } else {
            this.tooltip.show(boundingRect, canvasRect, state?.meta, state?.content);
        }

        this.appliedState = state;
    }

    public static makeTooltipMeta(
        event: TooltipPointerEvent,
        series: ISeries<any, any, any>,
        datum: SeriesNodeDatum<unknown> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>,
        movedBounds: BBoxValues | undefined
    ): TooltipMeta {
        const { canvasX, canvasY } = event;
        const tooltip = series.properties.tooltip as SeriesTooltip<any>;
        const { placement, defaultPlacement, anchorTo, defaultAnchorTo, xOffset, yOffset } = tooltip.position;
        const refPoint = getDatumRefPoint(series, datum, movedBounds);
        const meta: TooltipMeta = {
            canvasX,
            canvasY,
            nodeCanvasX: refPoint?.canvasX ?? canvasX,
            nodeCanvasY: refPoint?.canvasY ?? canvasY,
            enableInteraction: tooltip.interaction?.enabled ?? false,
            showArrow: tooltip.showArrow,
            position: {
                placement,
                defaultPlacement,
                anchorTo,
                defaultAnchorTo,
                xOffset,
                yOffset,
            },
        };

        return meta;
    }

    public isEnteringInteractiveTooltip(event: MouseWidgetEvent<'mouseleave'>): boolean {
        const { tooltip } = this;
        const relatedTarget = event.sourceEvent.relatedTarget as Node | null;
        return tooltip.interactive && tooltip.enabled && tooltip.isVisible() && tooltip.contains(relatedTarget);
    }
}
