import type { _Widget } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    type AreExact,
    ChartUpdateType,
    Logger,
    type NormalisedSelectionOptions,
} from 'ag-charts-core';

import {
    type BufferMap,
    copySelectionBuffers,
    diffSelectionBuffers,
    hasAddToSelectionModifier,
    restoreSelectionBuffers,
    setSelected,
    toBBox,
    toggleSelection,
} from './dataSelectionUtil';

export class DataSelection extends AbstractModuleInstance {
    private dragStartEvent?: _Widget.DragWidgetEvent<'drag-start'>;
    private readonly dragRect: _ModuleSupport.Rect;

    private get opts(): NormalisedSelectionOptions {
        return this.ctx.chartState.getValue('options', 'selection');
    }

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.dragRect = new _ModuleSupport.Rect();
        this.dragRect.fill = 'rgba(140,140,255)';
        this.dragRect.opacity = 0.2;
        this.dragRect.stroke = '#3b82f6';
        this.dragRect.strokeWidth = 2;
        this.dragRect.strokeOpacity = 1;
        this.dragRect.visible = false;

        this.cleanup.register(
            ctx.scene.attachNode(this.dragRect),
            ctx.eventsHub.on('series-area:click', (ev) => this.onSeriesAreaClick(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-start', (ev) => this.onSeriesAreaDragStart(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-move', (ev) => this.onSeriesAreaDragMove(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-end', (ev) => this.onSeriesAreaDragEnd(ev)),
            ctx.widgets.seriesWidget.addListener('keydown', (ev) => this.onKeyDown(ev))
        );
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent): void {
        const { enabled, enableClick, clickMode } = this.opts;
        if (!enabled || !enableClick) return;

        const { type, clickedNode } = event;
        if (type !== 'click') return;

        const bufferMap: BufferMap | undefined = copySelectionBuffers(this.ctx.chartService);
        if (clickedNode === undefined) {
            return this.clearAllSelections();
        } else {
            const { data } = clickedNode.series;
            if (data === undefined) return;

            const { series, datumIndex } = clickedNode;
            if (typeof datumIndex !== 'number') {
                Logger.errorOnce(`Not Yet Implemented: datumIndex of type ${typeof datumIndex}`);
                return;
            }

            if (clickMode === 'multiple' || hasAddToSelectionModifier(event)) {
                toggleSelection(series, data, datumIndex);
            } else {
                clickMode satisfies 'single';
                this.clearAllSelections();
                setSelected(series, data, datumIndex);
            }
        }
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.FULL });
        this.dispatchSelectionChange(bufferMap);
    }

    private onSeriesAreaDragStart(dragStartEvent: _Widget.DragWidgetEvent<'drag-start'>) {
        const { enabled, enableDrag } = this.opts;
        if (!enabled || !enableDrag) return;

        this.dragStartEvent = dragStartEvent;
        this.dragRect.x = dragStartEvent.currentX;
        this.dragRect.y = dragStartEvent.currentY;
        this.dragRect.width = 0;
        this.dragRect.height = 0;
        this.dragRect.visible = true;
    }

    private onSeriesAreaDragMove(dragMoveEvent: _Widget.DragWidgetEvent<'drag-move'>) {
        const { enabled, enableDrag } = this.opts;
        const { dragStartEvent } = this;

        if (!enabled || !enableDrag || !dragStartEvent) {
            this.dragRect.visible = false;
            return;
        }

        const seriesBounds = toBBox(dragStartEvent, dragMoveEvent);
        const canvasBounds = _ModuleSupport.Transformable.toCanvas(this.ctx.chartService.seriesRoot, seriesBounds);

        this.dragRect.x = canvasBounds.x;
        this.dragRect.y = canvasBounds.y;
        this.dragRect.width = canvasBounds.width;
        this.dragRect.height = canvasBounds.height;
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PRE_SERIES_UPDATE });
    }

    private onSeriesAreaDragEnd(dragEndEvent: _Widget.DragWidgetEvent<'drag-end'>) {
        const { enabled, enableDrag } = this.opts;
        const { dragStartEvent } = this;

        if (!enabled || !enableDrag || !dragStartEvent) {
            this.dragRect.visible = false;
            return;
        }

        const shouldClearSelections: boolean = !hasAddToSelectionModifier(dragEndEvent);
        const bbox = toBBox(dragStartEvent, dragEndEvent);
        const bufferMap: BufferMap | undefined = copySelectionBuffers(this.ctx.chartService);

        for (const series of this.ctx.chartService.series) {
            const { data } = series;
            if (data === undefined) continue;

            if (shouldClearSelections) {
                data.selections.clear();
            }

            for (const unsafeDatum of series.pickNodesInBBox(bbox)) {
                // TODO:
                // The value this.ctx.chartService.series uses `TDatum = any`, therefore `pickNodesInBBox`
                // is not type-safe. These runtime checks become irrelevant if `pickNodesInBBox` were type-safe;
                // Therefore verify that unsafeDatum is of type `any`.
                true satisfies AreExact<typeof unsafeDatum, any>;
                const unknownDatum: unknown = unsafeDatum;
                if (unknownDatum != null && typeof unknownDatum === 'object' && 'datumIndex' in unknownDatum) {
                    const datumIndex: unknown = unknownDatum.datumIndex;
                    if (typeof datumIndex === 'number') {
                        setSelected(series, data, datumIndex);
                    } else {
                        Logger.errorOnce(`unsupported datumIndex type: ${typeof datumIndex}`);
                    }
                }
            }
        }

        this.dispatchSelectionChange(bufferMap);
        this.endDrag();
    }

    private onKeyDown(widgetEvent: _ModuleSupport.KeyboardWidgetEvent<'keydown'>): void {
        if (widgetEvent.sourceEvent.code === 'Escape') {
            this.endDrag();
        }
    }

    private endDrag(): void {
        this.dragStartEvent = undefined;
        this.dragRect.visible = false;
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.FULL });
    }

    private dispatchSelectionChange(bufferMap: BufferMap | undefined): void {
        if (bufferMap === undefined) return;

        const { chartService } = this.ctx;
        const { added, removed } = diffSelectionBuffers(chartService, bufferMap);

        if (added.length === 0 && removed.length === 0) {
            // No selection changes to emit.
            return;
        }

        let defaultPrevented = false;
        const preventDefault = (): void => {
            defaultPrevented = true;
        };

        this.ctx.chartService.callListener({
            type: 'selectionChange',
            source: 'user-interaction',
            preventDefault,
            added,
            removed,
        });

        if (defaultPrevented) {
            restoreSelectionBuffers(chartService, bufferMap);
        }
    }

    private clearAllSelections(): void {
        const dataSets: Set<_ModuleSupport.DataSet<unknown>> = new Set();
        for (const series of this.ctx.chartService.series) {
            if (series.data) {
                dataSets.add(series.data);
            }
        }
        for (const data of dataSets) {
            data.selections.clear();
        }
    }
}
