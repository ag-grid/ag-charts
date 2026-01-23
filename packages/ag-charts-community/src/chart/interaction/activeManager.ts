import { validate } from 'ag-charts-core';
import type { MementoOriginator } from 'ag-charts-core';
import type { AgActiveChangeEvent, AgActiveChangeEventSource, AgActiveItemState, AgActiveState } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import { commonChartOptions } from '../chartOptionsDefs';
import type { InteractionManager } from './interactionManager';
import { InteractionState } from './interactionManager';

type ActiveItem = AgActiveItemState | undefined;
type ActiveChangeEvent = Omit<AgActiveChangeEvent<unknown>, 'context'>;

/**
 * This class implements the (de-)serialisation of `AgChartState['active']`.
 */
export class ActiveManager implements MementoOriginator<AgActiveState> {
    mementoOriginatorKey: string = 'active';

    private currentItem?: ActiveItem;
    private updateable: boolean = true;

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly interactionManager: InteractionManager,
        private readonly fireEvent: (event: ActiveChangeEvent) => void
    ) {}

    public update(newItemState: ActiveItem): void {
        this.performUpdate('user-interaction', newItemState);
    }

    private performUpdate(source: AgActiveChangeEventSource, newItemState: ActiveItem): void {
        if (!this.updateable) return;
        this.currentItem = newItemState;
        this.eventsHub.emit('active:update', newItemState);
        const { frozen, activeItem } = this.createMemento();
        this.fireEvent({ type: 'activeChange', source, frozen, activeItem });
    }

    public createMemento(): AgActiveState {
        const frozen = this.interactionManager.isState(InteractionState.Frozen);
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
        this.updateable = false;
        const activeItem: ActiveItem = this.performRestoration(memento?.activeItem);
        this.updateable = true;

        if (memento?.frozen) {
            this.interactionManager.pushState(InteractionState.Frozen);
        } else {
            this.interactionManager.popState(InteractionState.Frozen);
        }
        this.performUpdate('state-change', activeItem);
    }

    private performRestoration(activeItem: ActiveItem): ActiveItem {
        let rejection = false;
        const reject = () => (rejection = true);
        this.eventsHub.emit('active:load-memento', { activeItem, reject });
        return rejection ? undefined : activeItem;
    }
}
