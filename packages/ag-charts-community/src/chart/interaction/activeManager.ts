import { objectsEqual, validate } from 'ag-charts-core';
import type { DynamicContext, MementoOriginator } from 'ag-charts-core';
import type { AgActiveChangeEventSource, AgActiveItemState, AgActiveState } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { commonChartOptions } from '../chartOptionsDefs';
import type { SeriesNodeDatum } from '../series/seriesTypes';
import { InteractionState } from './interactionManager';

type ActiveItem = AgActiveItemState | undefined;
type DatumArg = Readonly<SeriesNodeDatum> | undefined;

/**
 * This class implements the (de-)serialisation of `AgChartState['active']`.
 */
export class ActiveManager implements MementoOriginator<AgActiveState> {
    mementoOriginatorKey: string = 'active';

    private readonly ctx: DynamicContext<ChartRegistry>;
    private currentItem: ActiveItem;
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

    constructor(ctx: DynamicContext<ChartRegistry>) {
        this.ctx = ctx;

        const removeListener: () => void = ctx.eventsHub.on('update:pre-scene-render', () => {
            this.didLayout = true;
            const { pendingMemento } = this;
            if (pendingMemento) {
                this.restoreMemento(pendingMemento.version, pendingMemento.mementoVersion, pendingMemento.memento);
                this.pendingMemento = undefined;
                // Flush immediately so other pre-scene-render listeners see the restored active item.
                ctx.chartState.flushChanges('activeItem');
            }
            removeListener();
        });
    }

    private isFrozen(): boolean {
        return this.ctx.interactionManager.isState(InteractionState.Frozen);
    }

    public clear(): boolean {
        return this.update(undefined, undefined);
    }

    public update(newItemState: ActiveItem, nodeDatum: DatumArg): boolean {
        return this.performUpdate('user-interaction', newItemState, nodeDatum, false);
    }

    private performUpdate(
        source: AgActiveChangeEventSource,
        newItemState: ActiveItem,
        nodeDatum: DatumArg,
        frozenChanged: boolean
    ): boolean {
        if (!this.updateable) return false;
        const oldItemState = this.currentItem;
        let defaultPrevented = false;

        // External (API) dispatch:
        if (frozenChanged || !objectsEqual(oldItemState, newItemState)) {
            const { frozen, activeItem } = this.createMementoWithItem(newItemState);
            const { datum, datums, itemType, totalValue } = nodeDatum ?? {};

            this.ctx.fireEvent({
                type: 'activeChange',
                source,
                frozen,
                activeItem,
                datum,
                // Series-specific metadata is only attached when present, so events for series that
                // don't set it (most series) keep their original shape.
                ...(datums === undefined ? {} : { datums }),
                ...(itemType === undefined ? {} : { itemType }),
                ...(totalValue === undefined ? {} : { totalValue }),
                dataIdKey: nodeDatum?.series.data?.dataIdKey,
                preventDefault: () => {
                    defaultPrevented = true;
                },
            });
        }

        // Internal dispatch:
        if (!defaultPrevented) {
            this.currentItem = newItemState;
            this.ctx.chartState.setValue('activeItem', newItemState);
        }

        return defaultPrevented;
    }

    public createMemento(): AgActiveState {
        return this.createMementoWithItem(this.currentItem);
    }

    private createMementoWithItem(activeItem: ActiveItem | undefined): AgActiveState {
        const frozen = this.isFrozen();
        switch (activeItem?.type) {
            case 'series-node':
            case 'legend': {
                const { type, seriesId, itemId } = activeItem;
                return { frozen, activeItem: { type, seriesId, itemId } };
            }
            default:
                activeItem?.type satisfies undefined;
                return { frozen };
        }
    }

    public guardMemento(blob: unknown, messages: string[]): blob is AgActiveState | undefined {
        if (blob == undefined) return true;

        const validationResult = validate(blob, commonChartOptions.initialState.active, '', {
            logger: this.ctx.logger,
        });
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
            this.ctx.interactionManager.pushState(InteractionState.Frozen);
        } else if (newFrozen === false) {
            this.ctx.interactionManager.popState(InteractionState.Frozen);
        } else {
            newFrozen satisfies undefined;
        }

        this.performUpdate('state-change', activeItem, nodeDatum, frozenChanged);
    }

    private performRestoration(activeItem: ActiveItem): [ActiveItem, DatumArg] {
        let rejection = false;
        const reject = () => (rejection = true);

        let nodeDatum: DatumArg = undefined;
        const setDatum = (d: SeriesNodeDatum | undefined) => (nodeDatum = d);

        const initialState: boolean = this.pendingMemento !== undefined;
        const chartId = this.ctx.chartService.id;
        this.ctx.eventsHub.emit('active:load-memento', { initialState, chartId, activeItem, reject, setDatum });
        return rejection ? [undefined, undefined] : [activeItem, nodeDatum];
    }
}
