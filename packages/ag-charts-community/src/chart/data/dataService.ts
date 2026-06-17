import { ActionOnSet, ChartUpdateType, Debug, Logger, throttle } from 'ag-charts-core';
import type { AgDataSourceCallbackParams, AgDataSourceRequestSource } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import type { AnimationManager } from '../interaction/animationManager';

type DataSourceCallback = (params: AgDataSourceCallbackParams<unknown>) => Promise<unknown>;

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
    private isLoadingData = false;
    private isForcedLoadingData: boolean | undefined = undefined;
    private latestRequest?: { params: AgDataSourceCallbackParams; fetchRequest: Promise<unknown> };
    private freshRequests: Promise<unknown>[] = [];
    private requestCounter = 0;

    private pendingData: DataServiceRestoredData | undefined = undefined;

    private readonly debug = Debug.create(true, 'data-model', 'data-source');

    private throttledFetch = this.createThrottledFetch(this.requestThrottle);
    private throttledDispatch = this.createThrottledDispatch(this.dispatchThrottle);

    private _secondaryLoaders: {
        source: AgDataSourceRequestSource;
        triggers: AgDataSourceRequestSource[];
        callback: (data: unknown[]) => void;
    }[] = [];

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly caller: { readonly context?: unknown },
        private readonly animationManager: AnimationManager
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

    public load(params: AgDataSourceCallbackParams) {
        const { pendingData } = this;

        if (
            pendingData != null &&
            ((pendingData.params.windowStart == null && pendingData.params.windowEnd == null) ||
                (pendingData.params.windowStart?.valueOf() === params.windowStart?.valueOf() &&
                    pendingData.params.windowEnd?.valueOf() === params.windowEnd?.valueOf()))
        ) {
            const id = this.requestCounter++;

            this.isLoadingInitialData = false;

            this.dispatch(id, pendingData.data as D[]);
            return;
        }

        this.isLoadingData = true;

        // Update to show the loading spinner.
        this.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });

        this.throttledFetch(params);
    }

    public registerSecondaryLoader(
        source: AgDataSourceRequestSource,
        triggers: AgDataSourceRequestSource[],
        callback: (data: unknown[]) => void
    ) {
        this._secondaryLoaders.push({ source, triggers, callback });
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

        return this.isLazy() && (this.isLoadingInitialData || this.isLoadingData);
    }

    public setForcedLoading(forcedLoading: boolean | undefined) {
        this.isForcedLoadingData = forcedLoading;
    }

    public async getData(): Promise<DataServiceRestoredData | undefined> {
        const { latestRequest } = this;
        if (!latestRequest) return;

        const { params, fetchRequest } = latestRequest;
        const data = await fetchRequest;
        return { params, data };
    }

    public restoreData(data: DataServiceRestoredData) {
        this.pendingData = data;
    }

    private createThrottledFetch(requestThrottle: number) {
        return throttle(
            (params: AgDataSourceCallbackParams) => this.fetch(params).catch((e) => Logger.error('callback failed', e)),
            requestThrottle,
            { leading: false, trailing: true }
        );
    }

    private createThrottledDispatch(dispatchThrottle: number) {
        return throttle((id: number, data: D[]) => this.dispatch(id, data), dispatchThrottle, {
            leading: true,
            trailing: true,
        });
    }

    private dispatch(id: number, data: D[]) {
        this.debug(`DataService - dispatching 'data-load' | ${id}`);
        this.eventsHub.emit('data:load', { data });
    }

    private async fetch(params: AgDataSourceCallbackParams) {
        if ('context' in this.caller) {
            params.context = this.caller.context;
        }

        const fetchRequest = Promise.resolve().then(async () => {
            if (!this.dataSourceCallback) {
                throw new Error('DataService - [dataSource.getData] callback not initialised');
            }

            const id = this.requestCounter++;
            this.debug(`DataService - requesting | ${id}`);

            const response = await this.performFetch(params, id);

            this.isLoadingInitialData = false;

            const requestIndex = this.freshRequests.indexOf(fetchRequest);
            if (requestIndex === -1 || (this.dispatchOnlyLatest && requestIndex !== this.freshRequests.length - 1)) {
                this.debug(`DataService - discarding stale request | ${id}`);
                return response;
            }

            this.freshRequests = this.freshRequests.slice(requestIndex + 1);

            if (this.freshRequests.length === 0) {
                this.isLoadingData = false;
            }

            // Dispatch response if no failure.
            if (Array.isArray(response)) {
                this.throttledDispatch(id, response);
            } else {
                this.eventsHub.emit('data:error', null);
            }

            return response;
        });

        const secondaryFetchRequests = [];
        if (params.source != null && this.dataSourceCallback) {
            for (const secondary of this._secondaryLoaders) {
                if (!secondary.triggers.includes(params.source)) continue;
                secondaryFetchRequests.push(
                    this.performFetch({ ...params, source: secondary.source }, secondary.source).then((response) => {
                        if (Array.isArray(response)) {
                            secondary.callback(response);
                        }
                    })
                );
            }
        }

        this.latestRequest = { params, fetchRequest };
        this.freshRequests.push(fetchRequest);

        await Promise.all([fetchRequest, ...secondaryFetchRequests]);
    }

    private async performFetch(params: AgDataSourceCallbackParams, id: string | number) {
        if (!this.dataSourceCallback) return;

        let response;
        try {
            const start = performance.now();
            response = await this.dataSourceCallback(params);
            this.debug(`DataService - response | ${performance.now() - start}ms | ${id}`);
        } catch (error: any) {
            this.debug(`DataService - request failed | ${id}`);
            Logger.warnOnce(`DataService - request failed | [${error}]`);
            // Ignore errors in callback and keep chart alive
        }

        return response;
    }
}
