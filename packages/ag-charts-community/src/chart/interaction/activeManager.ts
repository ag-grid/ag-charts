import { validate } from 'ag-charts-core';
import type { MementoOriginator } from 'ag-charts-core';
import type { AgActiveItemState, AgActiveState } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import { commonChartOptions } from '../chartOptionsDefs';

type ActiveItem = AgActiveItemState | undefined;

/**
 * This class implements the (de-)serialisation of `AgChartState['active']`.
 */
export class ActiveManager implements MementoOriginator<AgActiveState> {
    mementoOriginatorKey: string = 'active';

    private currentItem?: ActiveItem;

    constructor(private readonly eventsHub: EventsHub) {}

    public update(newItemState: ActiveItem): void {
        this.currentItem = newItemState;
        this.eventsHub.emit('active:update', newItemState);
    }

    public createMemento(): AgActiveState {
        const frozen = false;
        switch (this.currentItem?.type) {
            case 'series-area':
            case 'legend': {
                const { type, seriesId, itemId } = this.currentItem;
                return { frozen, activeItem: { type, seriesId, itemId } };
            }
            default:
                this.currentItem?.type satisfies undefined;
                return { frozen };
        }
    }

    public guardMemento(blob: unknown, messages: string[]): blob is AgActiveState | undefined {
        if (blob == undefined) return true;

        const validationResult = validate(blob, commonChartOptions.initialState.active);
        messages.push(...validationResult.invalid.map((err) => err.toString()));
        return validationResult.invalid.length === 0;
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: AgActiveState | undefined): void {
        this.update(this.performRestoration(memento?.activeItem));
    }

    private performRestoration(activeItem: ActiveItem): ActiveItem {
        let rejection = false;
        const reject = () => (rejection = true);
        this.eventsHub.emit('active:load-memento', { activeItem, reject });
        return rejection ? undefined : activeItem;
    }
}
