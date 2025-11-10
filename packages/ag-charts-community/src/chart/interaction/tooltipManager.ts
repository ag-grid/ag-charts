import { type BoxBounds, CleanupRegistry, objectsEqual } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';
import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import { debouncedCallback } from '../../util/render';
import { StateTracker } from '../../util/stateTracker';
import type { SeriesTooltip } from '../series/seriesTooltip';
import type { DatumIndexType, ErrorBoundSeriesNodeDatum, ISeries, SeriesNodeDatum } from '../series/seriesTypes';
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
 * Manages the tooltip HTML an element. Tracks the requested HTML from distinct dependents and
 * handles conflicting tooltip requests.
 */
export class TooltipManager {
    private readonly stateTracker = new StateTracker<TooltipState>();
    private readonly suppressState = new StateTracker(false);
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
    private readonly removeDelay: number = 100; // milliseconds

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

        content ??= this.stateTracker.get(callerId)?.content;
        this.stateTracker.set(callerId, { meta, content, pagination });
        this.applyStates();
    }

    public removeTooltip(callerId: string, meta?: TooltipMeta, delayed: boolean = false): void {
        // Case 1: Immediate removal (default behavior - backward compatible)
        if (delayed && this.removeDelay > 0) {
            // Case 2: Delayed removal
            // Check if we already have a pending removal for this caller
            // This prevents resetting the countdown (same fix as highlights)
            const existingPending = this.pendingRemovals.get(callerId);
            if (existingPending) {
                // Already pending - optionally update position if meta provided
                // This allows tooltip position to update during delay (future enhancement)
                if (meta) {
                    existingPending.lastMeta = meta;
                }
                // Don't reset countdown - let it continue
                return;
            }

            // First delayed removal call - start the countdown
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
        this.stateTracker.delete(callerId);
        this.applyStates();
    }

    public suppressTooltip(callerId: string) {
        this.suppressState.set(callerId, true);
    }

    public unsuppressTooltip(callerId: string) {
        this.suppressState.delete(callerId);
    }

    private applyPendingRemoval(callerId: string): void {
        // Safety check: Make sure there's actually a pending removal
        if (!this.pendingRemovals.has(callerId)) {
            return; // No pending removal for this caller
        }

        // Remove from pending map before clearing state
        this.pendingRemovals.delete(callerId);

        // Actually remove the tooltip
        this.stateTracker.delete(callerId);
        this.applyStates();
    }

    private applyStates() {
        const id = this.stateTracker.stateId();
        const state = id ? this.stateTracker.get(id) : undefined;

        if (this.suppressState.stateValue() || state?.meta == null || state?.content == null) {
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
        datum: SeriesNodeDatum<DatumIndexType> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>,
        movedBounds: BoxBounds | undefined
    ): TooltipMeta {
        const { canvasX, canvasY } = event;
        const tooltip = series.properties.tooltip as SeriesTooltip<any>;
        const { placement, anchorTo, xOffset, yOffset } = tooltip.position;
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
            },
        };

        return meta;
    }
}
