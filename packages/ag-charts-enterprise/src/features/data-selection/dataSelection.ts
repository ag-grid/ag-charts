import type { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, Logger, type NormalisedSelectionOptions } from 'ag-charts-core';

type ClickedNode = NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>;
type Series = NonNullable<ClickedNode['series']>;
type DataSet = NonNullable<Series['data']>;

export class DataSelection extends AbstractModuleInstance {
    private get opts(): NormalisedSelectionOptions {
        return this.ctx.chartState.getValue('options', 'selection');
    }

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.cleanup.register(ctx.eventsHub.on('series-area:click', (ev) => this.onSeriesAreaClick(ev)));
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent): void {
        const { enabled, enableClick, clickMode } = this.opts;
        if (!enabled || !enableClick) return;

        const { type, clickedNode } = event;
        if (type !== 'click' || clickedNode === undefined) return;

        const { data } = clickedNode.series;
        if (data === undefined) return;

        const { datumIndex } = clickedNode;
        if (typeof datumIndex !== 'number') {
            Logger.errorOnce(`Not Yet Implemented: datumIndex of type ${typeof datumIndex}`);
            return;
        }

        if (clickMode === 'multiple' || event.ctrlOrMeta) {
            this.toggleSelection(clickedNode, data, datumIndex);
        } else {
            clickMode satisfies 'single';
            this.setSingleSelection(clickedNode, data, datumIndex);
        }
    }

    private setSingleSelection(clickedNode: ClickedNode, data: DataSet, datumIndex: number): void {
        data.selections.clear();
        this.toggleSelection(clickedNode, data, datumIndex);
    }

    private toggleSelection(clickedNode: ClickedNode, data: DataSet, datumIndex: number): void {
        const selections = data.enableSelection(clickedNode.series.id);
        selections.toggle(datumIndex);
    }
}
