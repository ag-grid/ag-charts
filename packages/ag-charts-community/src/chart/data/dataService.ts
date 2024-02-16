import { Debug } from '../../util/debug';
import { throttle } from '../../util/function';
import { Listeners } from '../../util/listeners';
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
    private dataSourceCallback?: DataSourceCallback;
    private isLoadingInitialData = false;
    private requestThrottle = 100;
    private dispatchThrottle = 0;
    private dispatchOnlyLatest = true;
    private freshRequests: Array<number> = [];
    private requestCounter = 0;

    private debugExtraMap: Map<number, any> = new Map(); // TODO: remove before release

    private readonly debug = Debug.create(true, 'data-model', 'data-lazy');
    private readonly debugExtra = Debug.create('data-lazy-extra');

    private throttledFetch = throttle((params: DataSourceCallbackParams) => this.fetch(params), this.requestThrottle, {
        leading: false,
        trailing: true,
    });

    private throttledDispatchDataLoad = throttle(
        (id: number, data: D[]) => {
            this.debug(`DataService - dispatching 'data-load' | ${id}`);
            this.debugExtraValues(id, { redrawEnd: performance.now() });
            this.debugExtra(this.getDebugExtraString());
            this.dispatch('data-load', { type: 'data-load', data });
        },
        this.dispatchThrottle,
        {
            leading: true,
            trailing: true,
        }
    );

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

    private async fetch(params: DataSourceCallbackParams) {
        if (!this.dataSourceCallback) {
            throw new Error('lazy data loading callback not initialised');
        }

        const start = performance.now();

        const id = this.requestCounter++;
        this.debug(`DataService - requesting | ${id}`);

        this.freshRequests.push(id);
        this.debugExtraValues(id, { id, start });

        try {
            const response = await this.dataSourceCallback(params);
            this.debug(`DataService - response | ${performance.now() - start}ms | ${id}`);
            this.debugExtraValues(id, { end: performance.now() });

            this.isLoadingInitialData = false;

            const requestIndex = this.freshRequests.findIndex((rid) => rid === id);
            if (requestIndex === -1 || (this.dispatchOnlyLatest && requestIndex !== this.freshRequests.length - 1)) {
                this.debug(`DataService - discarding stale request | ${id}`);
                this.debugExtra(this.getDebugExtraString());
                return;
            }

            this.freshRequests = this.freshRequests.slice(requestIndex + 1);

            if (!Array.isArray(response)) {
                throw new Error(`lazy data was bad: ${response}`);
            }
            this.debugExtraValues(id, { redrawStart: performance.now() });
            this.throttledDispatchDataLoad(id, response);
        } catch (error) {
            throw new Error(`lazy data errored: ${error}`);
        }
    }

    private debugExtraValues(id: number, info: any) {
        if (!this.debugExtra.check()) return;
        this.debugExtraMap.set(id, {
            ...(this.debugExtraMap.get(id) ?? {}),
            ...info,
        });
    }

    private getDebugExtraString() {
        if (!this.debugExtra.check()) return;
        return JSON.stringify(Array.from(this.debugExtraMap.values()));
    }
}
