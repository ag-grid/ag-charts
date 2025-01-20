import { Listeners } from '../util/listeners';
import { ChartUpdateType } from './chartUpdateType';
import type { ISeries } from './series/seriesTypes';

export type UpdateCallback = (type: ChartUpdateType, opts?: UpdateOpts) => void;

export interface UpdateCompleteEvent {
    readonly type: 'update-complete';
}

export interface PreDomUpdateEvent {
    readonly type: 'pre-dom-update';
}

export interface PreSceneRenderEvent {
    readonly type: 'pre-scene-render';
}

export type UpdateOpts = {
    forceNodeDataRefresh?: boolean;
    skipAnimations?: boolean;
    newAnimationBatch?: boolean;
    seriesToUpdate?: Iterable<ISeries<any, any>>;
    backOffMs?: number;
    skipSync?: boolean;
};

type UpdateEventTypes = 'update-complete' | 'pre-dom-update' | 'pre-scene-render';

type UpdateEvents = UpdateCompleteEvent | PreDomUpdateEvent | PreSceneRenderEvent;

export class UpdateService extends Listeners<UpdateEventTypes, (event: UpdateEvents) => void> {
    constructor(private readonly updateCallback: UpdateCallback) {
        super();
    }

    public update(type = ChartUpdateType.FULL, options?: UpdateOpts) {
        this.updateCallback(type, options);
    }

    public dispatchUpdateComplete() {
        this.dispatch('update-complete', { type: 'update-complete' });
    }

    public dispatchPreDomUpdate() {
        this.dispatch('pre-dom-update', { type: 'pre-dom-update' });
    }

    public dispatchPreSceneRender() {
        this.dispatch('pre-scene-render', { type: 'pre-scene-render' });
    }
}
