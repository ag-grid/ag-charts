import { ActionOnSet, ChartUpdateType, Debug, Logger, stringifyValue, throttle } from 'ag-charts-core';
import type { AgDataSourceCallbackParams, AgDataSourceRequestSource } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import type { AnimationManager } from '../interaction/animationManager';

type DataSourceCallback = (params: AgDataSourceCallbackParams<unknown>) => Promise<unknown>;

function isNonEmptyArray(response: unknown): response is unknown[] {
    return Array.isArray(response) && response.length > 0;
}

/**
 * Orders the in-flight requests of one data stream so that only un-superseded data is applied.
 *
 * Streams are tracked separately because they answer different questions — a primary request covers
 * the current window, a secondary loader the whole domain — and a request for one is not a
 * replacement for the other.
 */
class RequestQueue {
    private requests: Promise<unknown>[] = [];

    public add(request: Promise<unknown>) {
        this.requests.push(request);
    }

    /**
     * Claims the right to apply a request's data, retiring it and every request it supersedes.
     *
     * Must be called once all of the data to be applied has settled, with no `await` between the
     * claim and applying it: a newer request can supersede this one across any suspension point.
     */
    public claim(request: Promise<unknown>, onlyLatest: boolean) {
        const requestIndex = this.requests.indexOf(request);

        if (requestIndex === -1 || (onlyLatest && requestIndex !== this.requests.length - 1)) {
            this.requests = this.requests.filter((pending) => pending !== request);
            return false;
        }

        this.requests = this.requests.slice(requestIndex + 1);
        return true;
    }
}

interface SecondaryLoader {
    source: AgDataSourceRequestSource;
    triggers: AgDataSourceRequestSource[];
    callback: (data: unknown[]) => void;
    requests: RequestQueue;
}

interface Response {
    id: number;
    response: unknown;
    threw: boolean;
}

interface SecondaryResponse {
    secondary: SecondaryLoader;
    request: Promise<unknown>;
    response: unknown;
}

export interface DataServiceRestoredData {
    params: AgDataSourceCallbackParams;
    data: unknown;
}

export class DataService<D extends object> {
    public dispatchOnlyLatest = true;

    @ActionOnSet<DataService<D>>({
        newValue(dispatchThrottle) {
            this.throttledDispatch = this.createThrottledDispatch(dispatchThrottle);
        },
    })
    public dispatchThrottle = 0;

    @ActionOnSet<DataService<D>>({
        newValue(requestThrottle) {
            this.throttledFetch = this.createThrottledFetch(requestThrottle);
        },
    })
    public requestThrottle = 300;

    private dataSourceCallback?: DataSourceCallback;
    private isLoadingInitialData = false;

    private fetchPending = false;
    private inFlightCount = 0;
    private isForcedLoadingData: boolean | undefined = undefined;
    private latestRequest?: { params: AgDataSourceCallbackParams; fetchRequest: Promise<unknown> };
    private readonly primaryRequests = new RequestQueue();
    private requestCounter = 0;

    private pendingData: DataServiceRestoredData | undefined = undefined;
    private lastDispatchedData: DataServiceRestoredData | undefined = undefined;

    private readonly debug = Debug.create(true, 'data-model', 'data-source');

    private throttledFetch = this.createThrottledFetch(this.requestThrottle);
    private throttledDispatch = this.createThrottledDispatch(this.dispatchThrottle);

    private _secondaryLoaders: SecondaryLoader[] = [];

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly caller: { readonly context?: unknown },
        private readonly animationManager: AnimationManager,
        private readonly logger: Logger
    ) {}

    public updateCallback(dataSourceCallback: DataSourceCallback) {
        if (typeof dataSourceCallback !== 'function') return;
        this.debug('DataService - updated data source callback');
        this.dataSourceCallback = dataSourceCallback;

        this.isLoadingInitialData = true;

        // Disable animations when using lazy loading due to conflicts
        this.animationManager.skip();

        this.eventsHub.emit('data:source-change', null);
    }

    public clearCallback() {
        this.dataSourceCallback = undefined;
    }

    public load(params: AgDataSourceCallbackParams, requestId?: number) {
        const { pendingData } = this;

        if (
            pendingData != null &&
            ((pendingData.params.windowStart == null && pendingData.params.windowEnd == null) ||
                (pendingData.params.windowStart?.valueOf() === params.windowStart?.valueOf() &&
                    pendingData.params.windowEnd?.valueOf() === params.windowEnd?.valueOf()))
        ) {
            const id = this.requestCounter++;

            this.isLoadingInitialData = false;

            this.dispatch(id, pendingData.data as D[], requestId);
            return;
        }

        this.fetchPending = true;

        // Update to show the loading spinner.
        this.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });

        this.throttledFetch(params, requestId);
    }

    public registerSecondaryLoader(
        source: AgDataSourceRequestSource,
        triggers: AgDataSourceRequestSource[],
        callback: (data: unknown[]) => void
    ) {
        this._secondaryLoaders.push({ source, triggers, callback, requests: new RequestQueue() });
        return () => {
            this._secondaryLoaders = this._secondaryLoaders.filter((secondary) => secondary.callback !== callback);
        };
    }

    public isLazy() {
        return this.dataSourceCallback != null;
    }

    public isLoading() {
        if (this.isForcedLoadingData != null) {
            return this.isForcedLoadingData;
        }

        return this.isLazy() && (this.isLoadingInitialData || this.fetchPending || this.inFlightCount > 0);
    }

    public setForcedLoading(forcedLoading: boolean | undefined) {
        this.isForcedLoadingData = forcedLoading;
    }

    public async getData(): Promise<DataServiceRestoredData | undefined> {
        const { latestRequest } = this;
        if (!latestRequest) return;

        // The last dispatched data-set, not the last response: after an invalid/empty response the
        // chart retains the older data, and a clone or image export must match what is rendered.
        await latestRequest.fetchRequest;
        return this.lastDispatchedData;
    }

    public restoreData(data: DataServiceRestoredData) {
        this.pendingData = data;
    }

    private createThrottledFetch(requestThrottle: number) {
        return throttle(
            (params: AgDataSourceCallbackParams, requestId?: number) =>
                this.fetch(params, requestId).catch((e) => this.logger.error('callback failed', e)),
            requestThrottle,
            { leading: false, trailing: true }
        );
    }

    private createThrottledDispatch(dispatchThrottle: number) {
        return throttle(
            (id: number, data: D[], requestId?: number) => this.dispatch(id, data, requestId),
            dispatchThrottle,
            {
                leading: true,
                trailing: true,
            }
        );
    }

    private dispatch(id: number, data: D[], requestId?: number) {
        this.debug(`DataService - dispatching 'data-load' | ${id}`);
        this.eventsHub.emit('data:load', { data, requestId });
    }

    private async fetch(params: AgDataSourceCallbackParams, requestId?: number) {
        // The in-flight count must be held until primary, secondaries and dispatch all settle, and
        // always released in `finally`, or a failed fetch wedges the spinner on permanently.
        this.fetchPending = false;
        this.inFlightCount++;
        try {
            await this.fetchAndDispatch(params, requestId);
        } finally {
            this.inFlightCount--;
        }
    }

    private async fetchAndDispatch(params: AgDataSourceCallbackParams, requestId?: number) {
        if ('context' in this.caller) {
            params.context = this.caller.context;
        }

        const fetchRequest = Promise.resolve().then(async (): Promise<Response> => {
            if (!this.dataSourceCallback) {
                throw new Error('DataService - [dataSource.getData] callback not initialised');
            }

            const id = this.requestCounter++;
            this.debug(`DataService - requesting | ${id}`);

            const { response, threw } = await this.performFetch(params, id);

            this.isLoadingInitialData = false;

            return { id, response, threw };
        });

        const secondaryFetchRequests: Promise<SecondaryResponse>[] = [];
        if (params.source != null && this.dataSourceCallback) {
            for (const secondary of this._secondaryLoaders) {
                if (!secondary.triggers.includes(params.source)) continue;
                const request = this.performFetch({ ...params, source: secondary.source }, secondary.source);
                secondary.requests.add(request);
                secondaryFetchRequests.push(request.then(({ response }) => ({ secondary, request, response })));
            }
        }

        this.latestRequest = { params, fetchRequest };
        this.primaryRequests.add(fetchRequest);

        // Ensure secondary requests have finished before dispatching the update.
        const secondaryResponses = await Promise.all(secondaryFetchRequests);

        for (const { secondary, request, response: secondaryResponse } of secondaryResponses) {
            // A loader answers for the whole domain, so neither a superseded window nor a primary
            // that never settles may suppress its data: only a newer request to the same loader.
            if (!secondary.requests.claim(request, this.dispatchOnlyLatest)) continue;

            // Skip non-array and empty responses so the loader retains its last valid display
            // instead of blanking on an invalid lazy response.
            if (isNonEmptyArray(secondaryResponse)) {
                secondary.callback(secondaryResponse);
            }
        }

        const { id, response, threw } = await fetchRequest;

        if (!this.primaryRequests.claim(fetchRequest, this.dispatchOnlyLatest)) {
            this.debug(`DataService - discarding stale request | ${id}`);
            return;
        }

        if (isNonEmptyArray(response)) {
            this.lastDispatchedData = { params, data: response };
            this.throttledDispatch(id, response as D[], requestId);
        } else {
            if (!threw && !Array.isArray(response)) {
                this.logger.warnOnce(
                    `DataService - [dataSource.getData] returned an invalid value \`${stringifyValue(response, 50)}\`; expecting an array, ignoring.`
                );
            }
            this.eventsHub.emit('data:error', { requestId });
        }
    }

    private async performFetch(params: AgDataSourceCallbackParams, id: string | number) {
        if (!this.dataSourceCallback) return { response: undefined, threw: false };

        let response;
        let threw = false;
        try {
            const start = performance.now();
            response = await this.dataSourceCallback(params);
            this.debug(`DataService - response | ${performance.now() - start}ms | ${id}`);
        } catch (error: any) {
            threw = true;
            this.debug(`DataService - request failed | ${id}`);
            this.logger.warnOnce(`DataService - request failed | [${error}]`);
            // Ignore errors in callback and keep chart alive
        }

        return { response, threw };
    }
}
