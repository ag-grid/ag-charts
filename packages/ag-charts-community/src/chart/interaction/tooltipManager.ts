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
 * Manages the tooltip HTML element. The most recent tooltip request wins, and only the caller that
 * made it can remove it.
 */
export class TooltipManager {
    private activeCallerId?: string;
    private activeState?: TooltipState;
    private readonly suppressedBy = new Set<string>();
    private appliedState: TooltipState | null = null;

    // Track pending removals per caller
    private readonly pendingRemovals = new Map<
        string,
        {
            scheduler: ReturnType<typeof debouncedCallback>;
            lastMeta: TooltipMeta | undefined;
        }
    >();

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
        // Cancel all pending delayed removals
        for (const { scheduler } of this.pendingRemovals.values()) {
            scheduler.cancel();
        }
        this.pendingRemovals.clear();

        this.cleanup.flush();
    }

    public updateTooltip(
        callerId: string,
        meta?: TooltipMeta,
        content?: TooltipContent[],
        pagination?: TooltipPaginationState
    ) {
        // Cancel any pending delayed removal - we're showing a new tooltip
        const pending = this.pendingRemovals.get(callerId);
        if (pending) {
            pending.scheduler.cancel();
            this.pendingRemovals.delete(callerId);
        }

        if (callerId === this.activeCallerId) {
            content ??= this.activeState?.content;
        }
        this.activeCallerId = callerId;
        this.activeState = { meta, content, pagination };
        this.applyStates();
    }

    public removeTooltip(callerId: string, meta?: TooltipMeta, delayed: boolean = false): void {
        if (delayed && this.removeDelay > 0) {
            // A repeat call must not restart the countdown, only refresh the position.
            const existingPending = this.pendingRemovals.get(callerId);
            if (existingPending) {
                if (meta) {
                    existingPending.lastMeta = meta;
                }
                return;
            }

            const scheduler = debouncedCallback(() => {
                this.applyPendingRemoval(callerId);
            });

            this.pendingRemovals.set(callerId, { scheduler, lastMeta: meta });
            scheduler.schedule(this.removeDelay);
            return;
        }

        // Cancel any pending delayed removal for this caller
        const pending = this.pendingRemovals.get(callerId);
        if (pending) {
            pending.scheduler.cancel();
            this.pendingRemovals.delete(callerId);
        }

        // Remove immediately
        this.clearState(callerId);
        this.applyStates();
    }

    /** Whether the caller's tooltip is shown, or will be once its show delay elapses. */
    public isTooltipActive(callerId: string): boolean {
        const state = this.activeState;
        return (
            callerId === this.activeCallerId &&
            state?.meta != null &&
            state.content != null &&
            !this.pendingRemovals.has(callerId) &&
            this.suppressedBy.size === 0
        );
    }

    public suppressTooltip(callerId: string) {
        this.suppressedBy.add(callerId);
    }

    public unsuppressTooltip(callerId: string) {
        this.suppressedBy.delete(callerId);
    }

    /** A no-op unless `callerId` owns the tooltip, so one caller cannot remove another's. */
    private clearState(callerId: string): void {
        if (callerId !== this.activeCallerId) return;
        this.activeCallerId = undefined;
        this.activeState = undefined;
    }

    private applyPendingRemoval(callerId: string): void {
        // Safety check: Make sure there's actually a pending removal
        if (!this.pendingRemovals.has(callerId)) {
            return; // No pending removal for this caller
        }

        // Remove from pending map before clearing state
        this.pendingRemovals.delete(callerId);

        // Actually remove the tooltip
        this.clearState(callerId);
        this.applyStates();
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
