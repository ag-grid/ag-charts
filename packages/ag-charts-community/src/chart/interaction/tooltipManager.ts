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
        // Apply and clear all pending removal state.
        this.clearPendingRemovals();

        // Cancel any pending delayed removal for THIS caller - we're showing a new tooltip
        this.pendingRemovals.get(callerId)?.scheduler.cancel();

        // AG-16398: When a user interaction creates a tooltip (not from sync),
        // clear any existing sync entries on this chart. This prevents stale sync entries
        // from persisting when focus returns to a chart that had received sync tooltips.
        if (!callerId.endsWith('-sync')) {
            this.clearSyncEntries();
        }

        content ??= this.stateTracker.get(callerId)?.content;
        this.stateTracker.set(callerId, { meta, content, pagination });
        this.applyStates();
    }

    public removeTooltip(callerId: string, meta?: TooltipMeta, delayed: boolean = false): void {
        // Apply and clear all pending removal state.
        const triggeringCallerIdToKeep = delayed ? callerId : undefined;
        this.clearPendingRemovals(triggeringCallerIdToKeep);

        if (delayed && this.removeDelay > 0) {
            // Delayed removal requested
            let pending = this.pendingRemovals.get(callerId);
            if (!pending) {
                const scheduler = debouncedCallback(() => {
                    this.applyPendingRemoval(callerId);
                });

                pending = { scheduler, lastMeta: meta };
                this.pendingRemovals.set(callerId, pending);
            } else if (meta) {
                pending.lastMeta = meta;
            }
            pending.scheduler.schedule(this.removeDelay);
            return;
        }

        // Immediate removal (default)
        // Cancel any pending delayed removal for this caller
        const pending = this.pendingRemovals.get(callerId);
        if (pending) {
            pending.scheduler.cancel();
            this.pendingRemovals.delete(callerId);
        }

        this.stateTracker.delete(callerId);
        this.applyStates();
    }

    private clearPendingRemovals(triggeringCallerIdToKeep?: string): void {
        for (const [callerId, pending] of this.pendingRemovals.entries()) {
            if (callerId === triggeringCallerIdToKeep) continue;
            if (!pending.scheduler.isPending()) continue;
            pending.scheduler.cancel();
            this.stateTracker.delete(callerId);
        }
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

    /**
     * Clear all sync entries from this chart's tooltip states.
     * This is called when a user interaction creates a new tooltip, making any existing
     * sync entries stale.
     */
    private clearSyncEntries(): void {
        for (const stateId of this.stateTracker.keys()) {
            if (typeof stateId === 'string' && stateId.endsWith('-sync')) {
                // Cancel any pending removal for this sync entry
                const pending = this.pendingRemovals.get(stateId);
                if (pending) {
                    pending.scheduler.cancel();
                    this.pendingRemovals.delete(stateId);
                }
                this.stateTracker.delete(stateId);
            }
        }
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
