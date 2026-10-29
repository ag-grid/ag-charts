import { type BoxBounds, CleanupRegistry, debouncedCallback, objectsEqual } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';
import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import type { ErrorBoundSeriesNodeDatum, ISeries, SeriesNodeDatum } from '../series/seriesTypes';
import { getDatumRefPoint } from '../series/util';
import type {
    Tooltip,
    TooltipContent,
    TooltipMeta,
    TooltipPaginationState,
    TooltipPointerEvent,
} from '../tooltip/tooltip';

interface TooltipState {
    content: TooltipContent[] | undefined;
    meta: TooltipMeta | undefined;
    pagination: TooltipPaginationState | undefined;
}

/**
 * Manages the tooltip HTML element. The most recent tooltip request wins.
 */
export class TooltipManager {
    private activeState?: TooltipState;
    private readonly suppressedBy = new Set<string>();
    private appliedState: TooltipState | null = null;
    private pendingRemoval?: ReturnType<typeof debouncedCallback>;

    // Configurable delay (match highlights at 100ms)
    public removeDelay: number = 100; // milliseconds

    private readonly cleanup = new CleanupRegistry();

    public constructor(
        eventsHub: EventsHub,
        localeManager: LocaleManager,
        private readonly domManager: DOMManager,
        private readonly tooltip: Tooltip
    ) {
        this.cleanup.register(
            tooltip.setup(localeManager, domManager),
            eventsHub.on('dom:hidden', () => this.tooltip.hide())
        );
    }

    public destroy() {
        this.cancelPendingRemoval();
        this.cleanup.flush();
    }

    public updateTooltip(meta?: TooltipMeta, content?: TooltipContent[], pagination?: TooltipPaginationState) {
        this.cancelPendingRemoval();
        this.activeState = { meta, content, pagination };
        this.applyStates();
    }

    public removeTooltip(delayed: boolean = false): void {
        if (delayed && this.removeDelay > 0) {
            // A repeat call must not restart the countdown.
            if (this.pendingRemoval) return;

            this.pendingRemoval = debouncedCallback(() => {
                this.pendingRemoval = undefined;
                this.activeState = undefined;
                this.applyStates();
            });
            this.pendingRemoval.schedule(this.removeDelay);
            return;
        }

        this.cancelPendingRemoval();
        this.activeState = undefined;
        this.applyStates();
    }

    /** Whether the tooltip is shown, or will be once its show delay elapses. */
    public isTooltipActive(): boolean {
        const state = this.activeState;
        return (
            state?.meta != null && state.content != null && this.pendingRemoval == null && this.suppressedBy.size === 0
        );
    }

    public suppressTooltip(callerId: string) {
        this.suppressedBy.add(callerId);
    }

    public unsuppressTooltip(callerId: string) {
        this.suppressedBy.delete(callerId);
    }

    private cancelPendingRemoval(): void {
        this.pendingRemoval?.cancel();
        this.pendingRemoval = undefined;
    }

    private applyStates() {
        const state = this.activeState;

        if (this.suppressedBy.size > 0 || state?.meta == null || state?.content == null) {
            this.appliedState = null;
            this.tooltip.hide();
            return;
        }

        const canvasRect = this.domManager.getBoundingClientRect();
        const boundingRect = this.tooltip.bounds === 'extended' ? this.domManager.getOverlayClientRect() : canvasRect;

        if (
            objectsEqual(this.appliedState?.content, state?.content) &&
            objectsEqual(this.appliedState?.pagination, state?.pagination)
        ) {
            const renderInstantly = this.tooltip.isVisible();
            this.tooltip.show(boundingRect, canvasRect, state?.meta, null, undefined, renderInstantly);
        } else {
            this.tooltip.show(boundingRect, canvasRect, state?.meta, state?.content, state?.pagination);
        }

        this.appliedState = state;
    }

    public static makeTooltipMeta(
        event: TooltipPointerEvent,
        series: ISeries<any, any, any>,
        datum: SeriesNodeDatum & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>,
        movedBounds: BoxBounds | undefined
    ): TooltipMeta {
        const { canvasX, canvasY } = event;
        const { tooltip } = series.options;
        const { placement, anchorTo, xOffset, yOffset, offset } = tooltip.position;
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
                anchorTo,
                xOffset,
                yOffset,
                offset,
            },
        };

        return meta;
    }
}
