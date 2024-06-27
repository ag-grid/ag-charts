import { StateTracker } from '../../util/stateTracker';
import type { DOMManager } from '../dom/domManager';
import type { ErrorBoundSeriesNodeDatum, SeriesNodeDatum } from '../series/seriesTypes';
import type { Tooltip, TooltipContent, TooltipMeta } from '../tooltip/tooltip';
import { type TooltipPointerEvent } from '../tooltip/tooltip';
import defaultTooltipCss from './tooltipManager.css';

interface TooltipState {
    content?: TooltipContent;
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

        domManager.addListener('hidden', () => this.tooltip.toggle(false));
        domManager.addStyles('tooltip', defaultTooltipCss);
    }

    public updateTooltip(callerId: string, meta?: TooltipMeta, content?: TooltipContent) {
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

    public getTooltipMeta(callerId: string): TooltipMeta | undefined {
        return this.stateTracker.get(callerId)?.meta;
    }

    public destroy() {
        this.domManager.removeStyles('tooltip');
    }

    private applyStates() {
        const id = this.stateTracker.stateId();
        const state = id ? this.stateTracker.get(id) : null;

        if (this.suppressState.stateValue() || state?.meta == null || state?.content == null) {
            this.appliedState = null;
            this.tooltip.toggle(false);
            return;
        }

        const canvasRect = this.domManager.getBoundingClientRect();

        if (this.appliedState?.content === state?.content) {
            const renderInstantly = this.tooltip.isVisible();
            this.tooltip.show(canvasRect, state?.meta, null, renderInstantly);
        } else {
            this.tooltip.show(canvasRect, state?.meta, state?.content);
        }

        this.appliedState = state;
    }

    public static makeTooltipMeta(
        event: TooltipPointerEvent<'hover' | 'drag' | 'keyboard'>,
        datum: SeriesNodeDatum & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>
    ): TooltipMeta {
        const { offsetX, offsetY } = event;
        const { tooltip } = datum.series.properties;
        const meta: TooltipMeta = {
            offsetX,
            offsetY,
            enableInteraction: tooltip.interaction?.enabled ?? false,
            lastPointerEvent: { type: event.type, offsetX, offsetY },
            showArrow: tooltip.showArrow,
            position: {
                type: tooltip.position.type,
                xOffset: tooltip.position.xOffset,
                yOffset: tooltip.position.yOffset,
            },
        };

        // On `line` and `scatter` series, the tooltip covers the top of error-bars when using datum.midPoint.
        // Using datum.yBar.upperPoint renders the tooltip higher up.
        const refPoint = datum.yBar?.upperPoint ?? datum.midPoint ?? datum.series.datumMidPoint?.(datum);

        if (tooltip.position.type === 'node' && refPoint) {
            const { x, y } = refPoint;
            const point = datum.series.contentGroup.inverseTransformPoint(x, y);
            return {
                ...meta,
                offsetX: Math.round(point.x),
                offsetY: Math.round(point.y),
            };
        }

        return meta;
    }
}
