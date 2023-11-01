import type { BBox } from '../scene/bbox';
import { Listeners } from '../util/listeners';
import { ChartUpdateType } from './chartUpdateType';

type UpdateCallback = (
    type: ChartUpdateType,
    options: { forceNodeDataRefresh?: boolean; skipAnimations?: boolean }
) => void;

export interface UpdateCompleteEvent {
    type: 'update-complete';
    minRect?: BBox;
}

export class UpdateService extends Listeners<'update-complete', (event: UpdateCompleteEvent) => void> {
    private updateCallback: UpdateCallback;

    constructor(updateCallback: UpdateCallback) {
        super();
        this.updateCallback = updateCallback;
    }

    public update(type = ChartUpdateType.FULL, { forceNodeDataRefresh = false, skipAnimations = false } = {}) {
        this.updateCallback(type, { forceNodeDataRefresh, skipAnimations });
    }

    public dispatchUpdateComplete(minRect?: BBox) {
        const event: UpdateCompleteEvent = { type: 'update-complete', minRect };
        this.dispatch('update-complete', event);
    }
}
