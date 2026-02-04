import { objectsEqual, validate } from 'ag-charts-core';
import type { MementoOriginator } from 'ag-charts-core';
import type { AgActiveChangeEvent, AgActiveChangeEventSource, AgActiveItemState, AgActiveState } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import { commonChartOptions } from '../chartOptionsDefs';
import type { DatumIndexType, SeriesNodeDatum } from '../series/seriesTypes';
import type { UpdateService } from '../updateService';
import type { InteractionManager } from './interactionManager';
import { InteractionState } from './interactionManager';

type ActiveItem = AgActiveItemState | undefined;
type ActiveChangeEvent = Omit<AgActiveChangeEvent<unknown, unknown>, 'context'>;
type DatumArg = Readonly<SeriesNodeDatum<DatumIndexType>> | undefined;

/**
 * This class implements the (de-)serialisation of `AgChartState['active']`.
 */
export class ActiveManager implements MementoOriginator<AgActiveState> {
    mementoOriginatorKey: string = 'active';

    private currentItem?: ActiveItem;
    private updateable: boolean = true;

    // FIXME: same pattern as `ZoomManager`. Perhaps an architectural rewrite is warranted.
    private didLayout = false;
    private pendingMemento:
        | {
              version: string;
              mementoVersion: string;
              memento: AgActiveState | undefined;
          }
        | undefined = undefined;

    constructor(
        private readonly chartService: { readonly id: string },
        private readonly eventsHub: EventsHub,
        updateService: UpdateService,
        private readonly interactionManager: InteractionManager,
        private readonly fireEvent: (event: ActiveChangeEvent) => void
    ) {
        const removeListener: () => void = updateService.addListener('pre-scene-render', () => {
            this.didLayout = true;
            const { pendingMemento } = this;
            if (pendingMemento) {
                this.restoreMemento(pendingMemento.version, pendingMemento.mementoVersion, pendingMemento.memento);
            }
            removeListener();
        });
    }

    private isFrozen(): boolean {
        return this.interactionManager.isState(InteractionState.Frozen);
    }

    public clear(): void {
        this.update(undefined, undefined);
    }

    public update(newItemState: ActiveItem, nodeDatum: DatumArg): void {
        this.performUpdate('user-interaction', newItemState, nodeDatum, false);
    }

    private performUpdate(
        source: AgActiveChangeEventSource,
        newItemState: ActiveItem,
        nodeDatum: DatumArg,
        frozenChanged: boolean
    ): void {
        if (!this.updateable) return;
        const oldItemState = this.currentItem;

        // Internal dispatch:
        this.currentItem = newItemState;
        this.eventsHub.emit('active:update', newItemState);

        // External (API) dispatch:
        if (frozenChanged || !objectsEqual(oldItemState, newItemState)) {
            const { frozen, activeItem } = this.createMemento();
            const { datum } = nodeDatum ?? {};
            this.fireEvent({ type: 'activeChange', source, frozen, activeItem, datum });
        }
    }

    public createMemento(): AgActiveState {
        const frozen = this.isFrozen();
        switch (this.currentItem?.type) {
            case 'series-node':
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

    public restoreMemento(version: string, mementoVersion: string, memento: AgActiveState | undefined): void {
        if (!this.didLayout) {
            this.pendingMemento = { version, mementoVersion, memento };
            return;
        }

        this.updateable = false;
        const [activeItem, nodeDatum]: [ActiveItem, DatumArg] = this.performRestoration(memento?.activeItem);
        this.updateable = true;

        const oldFrozen = this.isFrozen();
        const newFrozen = memento?.frozen;
        const frozenChanged: boolean =
            newFrozen === undefined ? false : (oldFrozen satisfies boolean) !== (newFrozen satisfies boolean);

        if (newFrozen === true) {
            this.interactionManager.pushState(InteractionState.Frozen);
        } else if (newFrozen === false) {
            this.interactionManager.popState(InteractionState.Frozen);
        } else {
            newFrozen satisfies undefined;
        }

        this.performUpdate('state-change', activeItem, nodeDatum, frozenChanged);
    }

    private performRestoration(activeItem: ActiveItem): [ActiveItem, DatumArg] {
        let rejection = false;
        const reject = () => (rejection = true);

        let nodeDatum: DatumArg = undefined;
        const setDatum = (d: SeriesNodeDatum<DatumIndexType> | undefined) => (nodeDatum = d);

        const chartId = this.chartService.id;
        this.eventsHub.emit('active:load-memento', { chartId, activeItem, reject, setDatum });
        return rejection ? [undefined, undefined] : [activeItem, nodeDatum];
    }
}
