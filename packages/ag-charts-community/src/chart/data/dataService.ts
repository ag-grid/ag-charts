import { Debug } from '../../util/debug';
import { throttle } from '../../util/function';
import { Listeners } from '../../util/listeners';
import type { AnimationManager } from '../interaction/animationManager';

const DEBUG_SELECTORS = [true, 'data-model', 'data-lazy'];

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
    private loading = false;
    private throttleTime = 100;

    private readonly debug = Debug.create(...DEBUG_SELECTORS);

    private throttledFetch = throttle((axes?: Array<AxisDomain>) => this.fetch(axes), this.throttleTime, {
        leading: false,
        trailing: true,
    });

    constructor(private readonly animationManager: AnimationManager) {
        super();
    }

    public init(loadOrData: LoadCallback | any): any {
        if (typeof loadOrData !== 'function') return loadOrData;
        this.loadCb = loadOrData;
        this.loading = true;

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
        return this.isLazy() && this.loading;
    }

    private async fetch(axes?: Array<AxisDomain>) {
        this.debug('DataLazyLoader.fetch() - start');
        const start = performance.now();

        this.loading = true;

        if (!this.loadCb) {
            throw new Error('lazy data loading callback not initialised');
        }

        try {
            const response = await this.loadCb({ axes });
            this.debug(`DataLazyLoader.fetch() - end: ${performance.now() - start}ms`);

            this.loading = false;

            if (!Array.isArray(response)) {
                throw new Error(`lazy data was bad: ${response}`);
            }

            this.dispatch('data-load', { type: 'data-load', data: response });
        } catch (error) {
            throw new Error(`lazy data errored: ${error}`);
        }
    }
}
