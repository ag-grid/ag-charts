import { type DynamicContext, type Point, debouncedCallback, objectsEqual } from 'ag-charts-core';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import type { ErrorBoundSeriesNodeDatum } from '../series/seriesTypes';

/**
 * Manages the actively highlighted series/datum for a chart. The most recent highlight request wins.
 */
export class HighlightManager {
    private activeHighlight?: HighlightNodeDatum;

    /**
     * Part of the highlighted node under the pointer (see `Series.getHighlightPart`). Kept beside the
     * highlight rather than on it: the highlighted datum rolls up unchanged, so consumers that don't
     * care about parts are unaffected, and only a caller supplying a part makes the highlight
     * sensitive to it.
     */
    private activeHighlightPart?: string;

    private pendingUnhighlight?: ReturnType<typeof debouncedCallback>;

    // Configurable delay (hardcoded for POC, will be user-configurable later)
    public unhighlightDelay: number = 100; // milliseconds

    private static readonly HIGHLIGHT_CHANGE_EVENT = 'highlight:change';

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

    private highlightInViewport: boolean = true;

    /** `synced` marks a highlight mirrored from another chart, so sync does not echo it back. */
    public updateHighlight(
        highlightedDatum?: HighlightNodeDatum,
        delayed: boolean = false,
        inViewport?: boolean,
        highlightPart?: string,
        synced: boolean = false
    ): void {
        if (highlightedDatum == null && delayed && this.unhighlightDelay > 0) {
            // A repeat call must not restart the countdown during continuous mouse movement.
            if (this.pendingUnhighlight) return;

            this.pendingUnhighlight = debouncedCallback(() => {
                this.pendingUnhighlight = undefined;
                this.setHighlight(undefined, true, undefined, synced);
            });
            this.pendingUnhighlight.schedule(this.unhighlightDelay);
            return;
        }

        this.cancelPendingUnhighlight();
        this.setHighlight(highlightedDatum, inViewport, highlightPart, synced);
    }

    private setHighlight(
        highlightedDatum: HighlightNodeDatum | undefined,
        inViewport: boolean | undefined,
        highlightPart: string | undefined,
        highlightSynced: boolean
    ): void {
        const previousHighlight = this.activeHighlight;
        const previousHighlightPart = this.activeHighlightPart;
        this.activeHighlight = highlightedDatum;
        this.activeHighlightPart = highlightedDatum ? highlightPart : undefined;

        const currentHighlight = this.activeHighlight;
        const currentHighlightPart = this.activeHighlightPart;
        const highlightChanged =
            !this.isEqual(currentHighlight, previousHighlight) || currentHighlightPart !== previousHighlightPart;
        // Callers that don't know the viewport state omit `inViewport`; resetting the flag to `true`
        // there would re-show crosshairs for a datum since panned off-screen.
        const highlightInViewport: boolean = inViewport ?? (highlightChanged ? true : this.highlightInViewport);

        if (highlightChanged || this.highlightInViewport !== highlightInViewport) {
            const highlightSuppressed = currentHighlight?.series?.isHighlightEnabled() === false;
            this.highlightInViewport = highlightInViewport;
            this.ctx.chartState.setValue('highlight', currentHighlight);
            this.ctx.eventsHub.emit(HighlightManager.HIGHLIGHT_CHANGE_EVENT, {
                currentHighlight,
                previousHighlight,
                currentHighlightPart,
                previousHighlightPart,
                highlightSuppressed,
                highlightInViewport,
                highlightSynced,
            });
        }
    }

    private cancelPendingUnhighlight(): void {
        this.pendingUnhighlight?.cancel();
        this.pendingUnhighlight = undefined;
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.activeHighlight;
    }

    /** Part of the active highlight, as reported by the caller that set it. */
    public getActiveHighlightPart(): string | undefined {
        return this.activeHighlightPart;
    }

    public destroy(): void {
        this.cancelPendingUnhighlight();
    }

    private isEqual(a?: HighlightNodeDatum, b?: HighlightNodeDatum): boolean {
        if (a === b) return true;

        return (
            a != null && a.series === b?.series && this.idsMatch(a, b) && this.pointsMatch(a, b) && a.datum === b.datum
        );
    }

    private idsMatch(a: HighlightNodeDatum, b: HighlightNodeDatum): boolean {
        return (
            (a.itemId != null && b.itemId != null && a.itemId === b.itemId) ||
            (a.datumIndex != null && b.datumIndex != null && objectsEqual(a.datumIndex, b.datumIndex))
        );
    }

    private pointsMatch(
        a: HighlightNodeDatum & Partial<ErrorBoundSeriesNodeDatum>,
        b: HighlightNodeDatum & Partial<ErrorBoundSeriesNodeDatum>
    ): boolean {
        return (
            this.pointsAreEqual(a.point, b.point) &&
            this.pointsAreEqual(a.midPoint, b.midPoint) &&
            this.pointsAreEqual(a.xBar?.lowerPoint, b.xBar?.lowerPoint) &&
            this.pointsAreEqual(a.xBar?.upperPoint, b.xBar?.upperPoint) &&
            this.pointsAreEqual(a.yBar?.lowerPoint, b.yBar?.lowerPoint) &&
            this.pointsAreEqual(a.yBar?.upperPoint, b.yBar?.upperPoint)
        );
    }

    private pointsAreEqual(a: Point | undefined, b: Point | undefined): boolean {
        return a === b || (a !== undefined && a.x === b?.x && a.y === b.y);
    }
}
