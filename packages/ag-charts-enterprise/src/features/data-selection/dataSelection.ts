import type { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, Logger, Property } from 'ag-charts-core';

export class DataSelection extends AbstractModuleInstance {
    @Property
    enabled: boolean = false;

    @Property
    enableClick: boolean = true;

    constructor(ctx: _ModuleSupport.ModuleContext) {
        super();

        this.cleanup.register(ctx.eventsHub.on('series-area:click', (ev) => this.onSeriesAreaClick(ev)));
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent): void {
        if (!this.enabled || !this.enableClick) return;

        const { type, clickedNode } = event;
        if (type !== 'click' || clickedNode === undefined) return;

        const { data } = clickedNode.series;
        if (data === undefined) return;

        const { datumIndex } = clickedNode;
        if (typeof datumIndex !== 'number') {
            Logger.errorOnce(`Not Yet Implemented: datumIndex of type ${typeof datumIndex}`);
            return;
        }

        const selections = data.enableSelection(clickedNode.series.id);
        selections.toggle(datumIndex);
    }
}
