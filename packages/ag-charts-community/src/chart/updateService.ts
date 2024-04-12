import type { BBox } from '../scene/bbox';
import { Listeners } from '../util/listeners';
import { ChartUpdateType } from './chartUpdateType';
import type { ISeries } from './series/seriesTypes';

export type UpdateCallback = (type: ChartUpdateType, opts?: UpdateOpts) => void;

export interface UpdateCompleteEvent {
    type: 'update-complete';
    minRect?: BBox;
    minVisibleRect?: BBox;
}

export type UpdateOpts = {
    forceNodeDataRefresh?: boolean;
    skipAnimations?: boolean;
    newAnimationBatch?: boolean;
    seriesToUpdate?: Iterable<ISeries<any, any>>;
    backOffMs?: number;
    skipSync?: boolean;
};

export class UpdateService extends Listeners<'update-complete', (event: UpdateCompleteEvent) => void> {
    constructor(private readonly updateCallback: UpdateCallback) {
        super();
    }

    public update(type = ChartUpdateType.FULL, options?: UpdateOpts) {
        this.updateCallback(type, options);
    }

    public dispatchUpdateComplete(rects?: { minRect: BBox; minVisibleRect: BBox }) {
        this.dispatch('update-complete', {
            type: 'update-complete',
            minRect: rects?.minRect,
            minVisibleRect: rects?.minVisibleRect,
        });
    }
}
