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
}

export type PendingCrossLineCallbackParam =
    Forbid<AgCrossLineClickEvent, 'allMatchedParams'> | Forbid<AgCrossLineDoubleClickEvent, 'allMatchedParams'>;

/** The cross-line listeners a click reaches, shared by the cross lines of every axis. */
export class PendingCrossLineCallbacks implements SeriesAreaClickClaim {
    readonly matchedParams: AgCrossLineClickParams[] = [];
    chart?: PendingCallback;
    readonly axes = new Map<string, PendingCallback>();
    readonly crossLines = new Map<string, PendingCallback>();

    constructor(private readonly hasChartListener: boolean) {}

    isHandled(): boolean {
        return (
            this.matchedParams.length > 0 && (this.axes.size > 0 || this.crossLines.size > 0 || this.hasChartListener)
        );
    }

    fire(allMatchedParams: AgMatchedParams<unknown>[]): void {
        for (const crossLine of this.crossLines.values()) {
            firePendingCrossLineCallback(allMatchedParams, crossLine);
        }
        for (const axis of this.axes.values()) {
            firePendingCrossLineCallback(allMatchedParams, axis);
        }
        if (this.chart) {
            firePendingCrossLineCallback(allMatchedParams, this.chart);
        }
    }
}

function firePendingCrossLineCallback(allMatchedParams: AgMatchedParams<unknown>[], callback: PendingCallback): void {
    const { callers, fn, params } = callback;
    callWithContext(callers, fn, { ...params, allMatchedParams });
}
