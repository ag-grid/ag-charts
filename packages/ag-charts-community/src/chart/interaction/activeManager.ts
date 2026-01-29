import { objectsEqual, validate } from 'ag-charts-core';
import type { MementoOriginator } from 'ag-charts-core';
import type { AgActiveChangeEvent, AgActiveChangeEventSource, AgActiveItemState, AgActiveState } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import { commonChartOptions } from '../chartOptionsDefs';
import type { InteractionManager } from './interactionManager';
import { InteractionState } from './interactionManager';

type ActiveItem = AgActiveItemState | undefined;
type ActiveChangeEvent = Omit<AgActiveChangeEvent<unknown, unknown>, 'context'>;

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

    private isFrozen(): boolean {
        return this.interactionManager.isState(InteractionState.Frozen);
    }

    public update(newItemState: ActiveItem): void {
        this.performUpdate('user-interaction', newItemState, false);
    }

    private performUpdate(source: AgActiveChangeEventSource, newItemState: ActiveItem, frozenChanged: boolean): void {
        if (!this.updateable) return;
        const oldItemState = this.currentItem;

        // Internal dispatch:
        this.currentItem = newItemState;
        this.eventsHub.emit('active:update', newItemState);

        // External (API) dispatch:
        if (frozenChanged || !objectsEqual(oldItemState, newItemState)) {
            const { frozen, activeItem } = this.createMemento();
            this.fireEvent({ type: 'activeChange', source, frozen, activeItem });
        }
    }

    public createMemento(): AgActiveState {
        const frozen = this.isFrozen();
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

        const oldFrozen = this.isFrozen();
        const newFrozen = memento?.frozen;
        const frozenChanged: boolean =
            newFrozen === undefined ? false : (oldFrozen satisfies boolean) === (newFrozen satisfies boolean);

        if (newFrozen === true) {
            this.interactionManager.pushState(InteractionState.Frozen);
        } else if (newFrozen === false) {
            this.interactionManager.popState(InteractionState.Frozen);
        } else {
            newFrozen satisfies undefined;
        }

        this.performUpdate('state-change', activeItem, frozenChanged);
    }

    private performRestoration(activeItem: ActiveItem): ActiveItem {
        let rejection = false;
        const reject = () => (rejection = true);
        this.eventsHub.emit('active:load-memento', { activeItem, reject });
        return rejection ? undefined : activeItem;
    }
}
