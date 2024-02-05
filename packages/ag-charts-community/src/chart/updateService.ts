import type { BBox } from '../scene/bbox';
import { Listeners } from '../util/listeners';
import type { Chart } from './chart';
import { ChartUpdateType } from './chartUpdateType';

type UpdateCallback = (...args: Parameters<Chart['update']>) => void;

export interface UpdateCompleteEvent {
    type: 'update-complete';
    minRect?: BBox;
}

export class UpdateService extends Listeners<'update-complete', (event: UpdateCompleteEvent) => void> {
    constructor(private readonly updateCallback: UpdateCallback) {
        super();
    }

    public update(type = ChartUpdateType.FULL, options?: Parameters<Chart['update']>[1]) {
        this.updateCallback(type, options);
    }

    public dispatchUpdateComplete(minRect?: BBox) {
        this.dispatch('update-complete', { type: 'update-complete', minRect });
    }
}
