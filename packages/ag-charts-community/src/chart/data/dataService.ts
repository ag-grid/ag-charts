import { Debug } from '../../util/debug';
import { throttle } from '../../util/function';
import { Listeners } from '../../util/listeners';
import { Logger } from '../../util/logger';
import { ActionOnSet } from '../../util/proxy';
import type { AnimationManager } from '../interaction/animationManager';

interface DataSourceCallbackParams {
    windowStart?: Date;
    windowEnd?: Date;
}
type DataSourceCallback = (params: DataSourceCallbackParams) => Promise<unknown>;

type EventType = 'data-source-change' | 'data-load';
type EventHandler<D extends object> = (() => void) | ((event: DataLoadEvent<D>) => void);

export interface DataLoadEvent<D extends object> {
    type: 'data-load';
    data: D[];
}

export class DataService<D extends object> extends Listeners<EventType, EventHandler<D>> {
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
    private freshRequests: Array<number> = [];
    private requestCounter = 0;

    private readonly debug = Debug.create(true, 'data-model', 'data-source');

    private throttledFetch = this.createThrottledFetch(this.requestThrottle);
    private throttledDispatch = this.createThrottledDispatch(this.dispatchThrottle);

    constructor(private readonly animationManager: AnimationManager) {
        super();
    }

    public updateCallback(dataSourceCallback: DataSourceCallback) {
        if (typeof dataSourceCallback !== 'function') return;
        this.debug('DataService - updated data source callback');
        this.dataSourceCallback = dataSourceCallback;

        this.isLoadingInitialData = true;

        // Disable animations when using lazy loading due to conflicts
        this.animationManager.skip();

        this.dispatch('data-source-change');
    }

    public clearCallback() {
        this.dataSourceCallback = undefined;
    }

    public load(params: DataSourceCallbackParams) {
        this.throttledFetch(params);
    }

    public isLazy() {
        return this.dataSourceCallback != null;
    }

    public isLoading() {
        return this.isLazy() && (this.isLoadingInitialData || this.freshRequests.length > 0);
    }

    private createThrottledFetch(requestThrottle: number) {
        return throttle((params: DataSourceCallbackParams) => this.fetch(params), requestThrottle, {
            leading: false,
            trailing: true,
        });
    }

    private createThrottledDispatch(dispatchThrottle: number) {
        return throttle(
            (id: number, data: D[] | any) => {
                this.debug(`DataService - dispatching 'data-load' | ${id}`);
                this.dispatch('data-load', { type: 'data-load', data });
            },
            dispatchThrottle,
            {
                leading: true,
                trailing: true,
            }
        );
    }

    private async fetch(params: DataSourceCallbackParams) {
        if (!this.dataSourceCallback) {
            throw new Error('DataService - [dataSource.getData] callback not initialised');
        }

        const start = performance.now();

        const id = this.requestCounter++;
        this.debug(`DataService - requesting | ${id}`);

        this.freshRequests.push(id);

        let response;
        try {
            response = await this.dataSourceCallback(params);
            this.debug(`DataService - response | ${performance.now() - start}ms | ${id}`);
        } catch (error) {
            Logger.errorOnce(`DataService - request failed | ${id} - [${error}]`);
            // Ignore errors in callback and keep chart alive
        }

        this.isLoadingInitialData = false;

        const requestIndex = this.freshRequests.findIndex((rid) => rid === id);
        if (requestIndex === -1 || (this.dispatchOnlyLatest && requestIndex !== this.freshRequests.length - 1)) {
            this.debug(`DataService - discarding stale request | ${id}`);
            return;
        }

        this.freshRequests = this.freshRequests.slice(requestIndex + 1);

        this.throttledDispatch(id, response);
    }
}
