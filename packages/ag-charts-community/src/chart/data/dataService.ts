import { Debug } from '../../util/debug';
import { throttle } from '../../util/function';
import { Listeners } from '../../util/listeners';
import type { AnimationManager } from '../interaction/animationManager';

type LoadCallback = (params: { axes?: Array<AxisDomain> }) => Promise<unknown>;

export interface AxisDomain {
    id: string;
    type: string;
    min: any;
    max: any;
}

type EventType = 'data-load';
type EventHandler<D extends object> = (event: DataLoadEvent<D>) => void;

export interface DataLoadEvent<D extends object> {
    type: 'data-load';
    data: D[];
}

export class DataService<D extends object> extends Listeners<EventType, EventHandler<D>> {
    private loadCb?: LoadCallback;
    private isLoadingInitialData = false;
    private requestThrottle = 100;
    private refreshThrottle = 100;
    private freshRequests: Array<number> = [];
    private requestCounter = 0;

    private debugExtraMap: Map<number, any> = new Map(); // TODO: remove before release

    private readonly debug = Debug.create(true, 'data-model', 'data-lazy');
    private readonly debugExtra = Debug.create('data-lazy-extra');

    private throttledFetch = throttle((axes?: Array<AxisDomain>) => this.fetch(axes), this.requestThrottle, {
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
        this.refreshThrottle,
        {
            leading: true,
            trailing: true,
        }
    );

    constructor(private readonly animationManager: AnimationManager) {
        super();
    }

    public init(loadOrData: LoadCallback | any): any {
        if (typeof loadOrData !== 'function') return loadOrData;
        this.loadCb = loadOrData;
        this.isLoadingInitialData = true;

        // Disable animations when using lazy loading due to conflicts
        this.animationManager.skip();

        // Return an empty array with the expectation that the load function will be called later
        return [];
    }

    public async load(axes: Array<AxisDomain>) {
        this.throttledFetch(axes);
    }

    public isLazy() {
        return this.loadCb != null;
    }

    public isLoading() {
        return this.isLazy() && (this.isLoadingInitialData || this.freshRequests.length > 0);
    }

    private async fetch(axes?: Array<AxisDomain>) {
        if (!this.loadCb) {
            throw new Error('lazy data loading callback not initialised');
        }

        const start = performance.now();

        const id = this.requestCounter++;
        this.debug(`DataService - requesting | ${id}`);

        this.freshRequests.push(id);
        this.debugExtraValues(id, { id, start });

        try {
            const response = await this.loadCb({ axes });
            this.debug(`DataService - response | ${performance.now() - start}ms | ${id}`);
            this.debugExtraValues(id, { end: performance.now() });

            this.isLoadingInitialData = false;

            const requestIndex = this.freshRequests.findIndex((rid) => rid === id);
            if (requestIndex === -1) {
                this.debug(`DataService - discarding stale request | ${id}`);
                this.debugExtra(this.getDebugExtraString());
                return;
            } else {
                this.freshRequests = this.freshRequests.slice(requestIndex + 1);
            }

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
