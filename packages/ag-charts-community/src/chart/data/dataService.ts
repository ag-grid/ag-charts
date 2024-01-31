import { throttleAsyncTrailing } from '../../util/debounceThrottle';
import { Debug } from '../../util/debug';
import { Listeners } from '../../util/listeners';

const DEBUG_SELECTORS = [true, 'data-model', 'data-lazy'];

type UpdateCallback<D extends object> = (data: D[], options: {}) => void;
type LoadCallback = (params: { axes?: Array<AxisDomain> }) => Promise<unknown>;

export interface AxisDomain {
    id: string;
    type: string;
    min: any;
    max: any;
}

export class DataService<D extends object> extends Listeners<never, never> {
    private load?: LoadCallback;
    private throttleTime = 100;

    private readonly debug = Debug.create(...DEBUG_SELECTORS);

    private throttledFetch = throttleAsyncTrailing((axes?: Array<AxisDomain>) => this.fetch(axes), this.throttleTime);

    constructor(private readonly updateCallback: UpdateCallback<D>) {
        super();
    }

    public update(data: D[], options: {} = {}) {
        if (data == null) return;
        this.updateCallback(data, options);
    }

    public async fetchFull(load: LoadCallback | any): Promise<D[]> {
        if (typeof load !== 'function') return load;
        this.load = load;
        return this.throttledFetch();
    }

    public async fetchFullAndWindow(axes: Array<AxisDomain>): Promise<D[]> {
        return this.throttledFetch(axes);
    }

    public isLazy() {
        return this.load != null;
    }

    private async fetch(axes?: Array<AxisDomain>): Promise<D[]> {
        this.debug('DataLazyLoader.fetch() - start');
        const start = performance.now();

        if (!this.load) {
            throw new Error('lazy data loading callback not initialised');
        }

        try {
            const response = await this.load({ axes });
            this.debug(`DataLazyLoader.fetch() - end: ${performance.now() - start}ms`);

            if (Array.isArray(response)) {
                return response;
            }

            throw new Error(`lazy data was bad: ${response}`);
        } catch (error) {
            throw new Error(`lazy data errored: ${error}`);
        }
    }
}
