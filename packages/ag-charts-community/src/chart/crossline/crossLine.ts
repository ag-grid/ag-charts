import type { Forbid, RequireOptional } from 'ag-charts-core';
import { callWithContext } from 'ag-charts-core';
import type {
    AgCrossLineClickEvent,
    AgCrossLineClickParams,
    AgCrossLineDoubleClickEvent,
    AgMatchedParams,
} from 'ag-charts-types';

import type { SeriesAreaClickClaim } from '../../core/eventsHub';

type Caller = { context?: unknown };
export type CrossLineValuePick = RequireOptional<AgCrossLineClickParams>;

interface PendingCallback {
    callers: Caller[];
    fn: (params: any) => void;
    params: PendingCrossLineCallbackParam;
    frontParams?: PendingCrossLineCallbackParam;
}

export type PendingCrossLineCallbackParam =
    Forbid<AgCrossLineClickEvent, 'allMatchedParams'> | Forbid<AgCrossLineDoubleClickEvent, 'allMatchedParams'>;

/** The cross-line listeners a click reaches, shared by the cross lines of every axis. */
export class PendingCrossLineCallbacks implements SeriesAreaClickClaim {
    readonly matchedParams: AgCrossLineClickParams[] = [];
    chart?: PendingCallback;
    readonly axes = new Map<string, PendingCallback>();
    readonly crossLines = new Map<string, PendingCallback>();
    /** Set when a matched `'front'` cross line reaches a listener, as it draws over the series beneath it. */
    hasHandledFront = false;
    /** The chart callback of the first axis with a handled `'front'` match. */
    frontChart?: PendingCallback;

    constructor(readonly hasChartListener: boolean) {}

    isHandled(): boolean {
        return (
            this.matchedParams.length > 0 && (this.axes.size > 0 || this.crossLines.size > 0 || this.hasChartListener)
        );
    }

    beatsHandledNode(): boolean {
        return this.hasHandledFront;
    }

    fire(allMatchedParams: AgMatchedParams<unknown>[], beatHandledNode = false): void {
        for (const crossLine of this.crossLines.values()) {
            firePendingCrossLineCallback(allMatchedParams, crossLine, false);
        }
        for (const axis of this.axes.values()) {
            firePendingCrossLineCallback(allMatchedParams, axis, beatHandledNode);
        }
        const chart = beatHandledNode ? (this.frontChart ?? this.chart) : this.chart;
        if (chart) {
            firePendingCrossLineCallback(allMatchedParams, chart, beatHandledNode);
        }
    }
}

function firePendingCrossLineCallback(
    allMatchedParams: AgMatchedParams<unknown>[],
    callback: PendingCallback,
    front: boolean
): void {
    const { callers, fn, params, frontParams } = callback;
    callWithContext(callers, fn, { ...((front ? frontParams : undefined) ?? params), allMatchedParams });
}
