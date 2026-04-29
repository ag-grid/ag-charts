import type { AgSelectionChangeEventSource, AgSelectionItem, _Widget } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartUpdateType,
    type DynamicContext,
    Logger,
    type NormalisedSelectionOptions,
} from 'ag-charts-core';

import {
    SELECTION_FILLOPACITY,
    SELECTION_FILL_VALID,
    SELECTION_LINEDASH,
    SELECTION_STROKE,
    SELECTION_STROKEOPACITY,
    SELECTION_STROKEWIDTH,
} from './dataSelectionConstants';
import {
    type BufferMap,
    clearAllSelections,
    copySelectionBuffers,
    diffSelectionBuffers,
    getAllDataSets,
    hasAddToSelectionModifier,
    isAgSelectionItem,
    isUnknownIterable,
    restoreSelectionBuffers,
    setSelected,
    toBBox,
    toggleSelection,
} from './dataSelectionUtil';

type Series = NonNullable<NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>['series']>;

export class DataSelection extends AbstractModuleInstance implements _ModuleSupport.SelectionModuleFns {
    private dragStartEvent?: _Widget.DragWidgetEvent<'drag-start'>;
    private readonly dragRect: _ModuleSupport.Rect;

    private get opts(): NormalisedSelectionOptions {
        return this.ctx.chartState.getValue('options', 'selection');
    }

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.dragRect = new _ModuleSupport.Rect();
        this.dragRect.fill = SELECTION_FILL_VALID;
        this.dragRect.fillOpacity = SELECTION_FILLOPACITY;
        this.dragRect.stroke = SELECTION_STROKE;
        this.dragRect.strokeWidth = SELECTION_STROKEWIDTH;
        this.dragRect.strokeOpacity = SELECTION_STROKEOPACITY;
        this.dragRect.lineDash = SELECTION_LINEDASH;
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

    getSelection(): Iterable<AgSelectionItem<unknown>> {
        return function* getSelectionIterator(this: DataSelection) {
            for (const dataSet of getAllDataSets(this.ctx.chartService.series)) {
                for (const [seriesId, selection] of dataSet.selections) {
                    for (let datumIndex = 0; datumIndex < selection.getLength(); datumIndex++) {
                        if (selection.isSelected(datumIndex)) {
                            const itemId = dataSet.getItemIdFromIndex(datumIndex);
                            const datum = dataSet.data[datumIndex];
                            yield { seriesId, itemId, datum };
                        }
                    }
                }
            }
        }.bind(this)();
    }

    setSelection(items: unknown): void {
        const { chartService } = this.ctx;

        const bufferMap: BufferMap | undefined = copySelectionBuffers(chartService);
        clearAllSelections(chartService.series);

        if (!isUnknownIterable(items)) {
            Logger.warn('Selection items is not iterable');
            return;
        }

        for (const item of items) {
            if (!isAgSelectionItem(item)) {
                Logger.warn('Skipping invalid AgSelectionItemIds object: ', item);
                continue;
            }

            const series = this.ctx.chartService.series.find((s) => s.id == item.seriesId);
            if (series === undefined) {
                Logger.warn('Skipping seriesId (series not found)', item.seriesId);
                continue;
            }

            const data = series.data;
            if (data === undefined) {
                Logger.warn('Skipping seriesId (data not found):', item.seriesId);
                continue;
            }

            const datumIndex = data.getIndexFromItemId(item.itemId);
            if (datumIndex === undefined) {
                Logger.warn('Skipping itemId (datum not found):', item.itemId);
                continue;
            }

            const selection = data.enableSelection(item.seriesId);
            selection.select(datumIndex);
        }

        this.dispatchInternalSelectionChange(chartService.series);
        this.dispatchExternalSelectionChange('api-call', bufferMap);
        this.redraw(ChartUpdateType.FULL);
    }

    clearSelection(): void {
        const { chartService } = this.ctx;

        const bufferMap: BufferMap | undefined = copySelectionBuffers(this.ctx.chartService);
        clearAllSelections(chartService.series);

        this.dispatchInternalSelectionChange(chartService.series);
        this.dispatchExternalSelectionChange('api-call', bufferMap);
        this.redraw(ChartUpdateType.FULL);
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent): void {
        const { enabled, enableClick, clickMode } = this.opts;
        if (!enabled || !enableClick) return;

        const { type, clickedNode } = event;
        if (type !== 'click') return;

        const modifierPressed = hasAddToSelectionModifier(event);
        const clickMiss =
            clickedNode === undefined || !(clickedNode.series.properties.selection.enabled satisfies boolean);

        if (clickMiss && modifierPressed) {
            // Ctrl+Click only toggles selection; it shouldn't clear the selection.
            return;
        }

        const bufferMap: BufferMap | undefined = copySelectionBuffers(this.ctx.chartService);
        if (clickMiss) {
            clearAllSelections(this.ctx.chartService.series);
            this.dispatchInternalSelectionChange(this.ctx.chartService.series);
        } else {
            const { data } = clickedNode.series;
            if (data === undefined) return;

            const { series, datumIndex } = clickedNode;
            if (typeof datumIndex !== 'number') {
                Logger.errorOnce(`Not Yet Implemented: datumIndex of type ${typeof datumIndex}`);
                return;
            }

            if (clickMode === 'multiple' || modifierPressed) {
                toggleSelection(series, data, datumIndex);
            } else {
                clickMode satisfies 'single';
                clearAllSelections(this.ctx.chartService.series);
                setSelected(series, data, datumIndex);
            }
            this.dispatchInternalSelectionChange([series]);
        }
        this.dispatchExternalSelectionChange('user-interaction', bufferMap);
        this.redraw(ChartUpdateType.FULL);
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
        this.redraw(ChartUpdateType.PRE_SERIES_UPDATE);
    }

    private onSeriesAreaDragEnd(dragEndEvent: _Widget.DragWidgetEvent<'drag-end'>) {
        const { enabled, enableDrag } = this.opts;
        const { dragStartEvent } = this;

        if (!enabled || !enableDrag || !dragStartEvent) {
            this.dragRect.visible = false;
            return;
        }

        const shouldClearSelections: boolean = !hasAddToSelectionModifier(dragEndEvent);
        if (shouldClearSelections) {
            clearAllSelections(this.ctx.chartService.series);
        }

        const bbox = toBBox(dragStartEvent, dragEndEvent);
        const bufferMap: BufferMap | undefined = copySelectionBuffers(this.ctx.chartService);
        const changedSeries: Series[] = [];

        for (const series of this.ctx.chartService.series) {
            if (!series.properties.selection.enabled) continue;

            const { data } = series;
            if (data === undefined) continue;

            let changed = false;
            for (const datum of series.pickNodesInBBox(bbox)) {
                const datumIndex: unknown = datum.datumIndex;
                if (typeof datumIndex === 'number') {
                    changed = true;
                    setSelected(series, data, datumIndex);
                } else {
                    Logger.errorOnce(`unsupported datumIndex type: ${typeof datumIndex}`);
                }
            }

            if (changed) {
                changedSeries.push(series);
            }
        }

        this.dispatchInternalSelectionChange(changedSeries);
        this.dispatchExternalSelectionChange('user-interaction', bufferMap);
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
        this.redraw(ChartUpdateType.FULL);
    }

    private redraw(type: ChartUpdateType): void {
        this.ctx.eventsHub.emit('chart:request-update', { type, opts: { skipAnimations: true } });
    }

    private dispatchInternalSelectionChange(changedSeries: Series[]): void {
        for (const series of changedSeries) {
            series.events.emit('data-selection-change', null);
        }
    }

    private dispatchExternalSelectionChange(
        source: AgSelectionChangeEventSource,
        bufferMap: BufferMap | undefined
    ): void {
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
            source,
            preventDefault,
            added,
            removed,
        });

        if (defaultPrevented) {
            restoreSelectionBuffers(chartService, bufferMap);
        }
    }
}
