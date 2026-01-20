import { validate } from 'ag-charts-core';
import type { MementoOriginator } from 'ag-charts-core';
import type { AgActiveState } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import { commonChartOptions } from '../chartOptionsDefs';

type ActiveStateNone = { type: 'inactive'; seriesId?: never; itemId?: never };
type ActiveStateDatum = { type: 'datum'; seriesId: string; itemId: string };
type ActiveStateLegend = { type: 'legend'; seriesId: string; itemId?: never };
type ActiveState = ActiveStateNone | ActiveStateDatum | ActiveStateLegend;

/**
 * This class implements the (de-)serialisation of `AgChartState['active']`.
 */
export class ActiveManager implements MementoOriginator<AgActiveState> {
    mementoOriginatorKey: string = 'active';

    private currentState: ActiveState = { type: 'inactive' };

    constructor(private readonly eventsHub: EventsHub) {}

    public update(newState: ActiveState): void {
        this.currentState = newState;
    }

    public createMemento(): AgActiveState {
        const frozen = false;
        switch (this.currentState.type) {
            case 'inactive':
                return { frozen };
            case 'datum': {
                const { seriesId, itemId } = this.currentState;
                return { frozen, activeItem: { type: 'series-area', seriesId, itemId } };
            }
            case 'legend': {
                const { seriesId } = this.currentState;
                return { frozen, activeItem: { type: 'legend', seriesId } };
            }
            default:
                return this.currentState satisfies never;
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

    private performRestoration(activeItem: AgActiveState['activeItem']): ActiveState {
        const [rejection, newState] = this.emitRestoration(activeItem);
        return rejection ? { type: 'inactive' } : newState;
    }

    private emitRestoration(activeItem: AgActiveState['activeItem']): [boolean, ActiveState] {
        const { seriesId, itemId } = activeItem ?? {};
        let rejection = false;
        const reject = () => (rejection = true);

        if (seriesId === undefined) {
            this.eventsHub.emit('active:clear', null);
            return [rejection, { type: 'inactive' }];
        } else if (itemId === undefined) {
            this.eventsHub.emit('active:legend', { seriesId, reject });
            return [rejection, { type: 'legend', seriesId }];
        } else {
            this.eventsHub.emit('active:datum', { seriesId, itemId, reject });
            return [rejection, { type: 'datum', seriesId, itemId }];
        }
    }
}
