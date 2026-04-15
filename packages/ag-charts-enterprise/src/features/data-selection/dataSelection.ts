import type { _ModuleSupport, _Widget } from 'ag-charts-community';
import { AbstractModuleInstance, type BoxBounds, Logger, type NormalisedSelectionOptions, type AreExact, ChartUpdateType } from 'ag-charts-core';

type ClickedNode = NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>;
type Series = NonNullable<ClickedNode['series']>;
type DataSet = NonNullable<Series['data']>;

function toStartAndLength(start: number, end: number): [number, number] {
    if (start > end) {
        [start, end] = [end, start];
    }
    return [start, end - start];
}

export class DataSelection extends AbstractModuleInstance {
    private dragStartEvent?: _Widget.DragWidgetEvent<'drag-start'>;

    private get opts(): NormalisedSelectionOptions {
        return this.ctx.chartState.getValue('options', 'selection');
    }

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.cleanup.register(
            ctx.eventsHub.on('series-area:click', (ev) => this.onSeriesAreaClick(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-start', (ev) => this.onSeriesAreaDragStart(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-end', (ev) => this.onSeriesAreaDragEnd(ev))
        );
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent): void {
        const { enabled, enableClick, clickMode } = this.opts;
        if (!enabled || !enableClick) return;

        const { type, clickedNode } = event;
        if (type !== 'click' || clickedNode === undefined) return;

        const { data } = clickedNode.series;
        if (data === undefined) return;

        const { series, datumIndex } = clickedNode;
        if (typeof datumIndex !== 'number') {
            Logger.errorOnce(`Not Yet Implemented: datumIndex of type ${typeof datumIndex}`);
            return;
        }

        if (clickMode === 'multiple' || event.ctrlOrMeta) {
            this.toggleSelection(series, data, datumIndex);
        } else {
            clickMode satisfies 'single';
            this.setSingleSelection(series, data, datumIndex);
        }
    }

    private onSeriesAreaDragStart(event: _Widget.DragWidgetEvent<'drag-start'>) {
        this.dragStartEvent = event;
    }

    private onSeriesAreaDragEnd(dragEndEvent: _Widget.DragWidgetEvent<'drag-end'>) {
        const { dragStartEvent } = this;
        if (!dragStartEvent) return;

        const [x, width] = toStartAndLength(dragStartEvent.currentX, dragEndEvent.currentX);
        const [y, height] = toStartAndLength(dragStartEvent.currentY, dragEndEvent.currentY);
        const bbox: BoxBounds = { x, y, width, height };

        for (const series of this.ctx.chartService.series) {
            const { data } = series;
            if (data === undefined) continue;
            data.selections.clear();

            for (const unsafeDatum of series.pickNodesInBBox(bbox)) {
                // TODO:
                // The value this.ctx.chartService.series uses `TDatum = any`, therefore `pickNodesInBBox`
                // is not type-safe. These runtime-check become irrelevant if `pickNodesInBBox` were type-safe;
                // Therefore verify that unsafeDatum is of type `any`.
                true satisfies AreExact<typeof unsafeDatum, any>;
                const unknownDatum: unknown = unsafeDatum;
                if (unknownDatum != null && typeof unknownDatum === 'object' && 'datumIndex' in unknownDatum) {
                    const datumIndex: unknown = unknownDatum.datumIndex;
                    if (typeof datumIndex === 'number') {
                        this.setSelected(series, data, datumIndex);
                    } else {
                        Logger.errorOnce(`unsupported datumIndex type: ${typeof datumIndex}`);
                    }
                }
            }
        }
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SERIES_UPDATE });
    }

    private setSingleSelection(series: Series, data: DataSet, datumIndex: number): void {
        data.selections.clear();
        this.toggleSelection(series, data, datumIndex);
    }

    private toggleSelection(series: Series, data: DataSet, datumIndex: number): void {
        const selections = data.enableSelection(series.id);
        selections.toggle(datumIndex);
    }

    private setSelected(series: Series, data: DataSet, datumIndex: number): void {
        const selections = data.enableSelection(series.id);
        selections.select(datumIndex);
    }
}
