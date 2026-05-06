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
    type SelectionChanges,
    asNumericDatumIndex,
    clearAllSelections,
    getAllDataSets,
    hasAddToSelectionModifier,
    isAgSelectionItem,
    isUnknownIterable,
    rollbackChanges,
    setSelected,
    setSelectedRange,
    toBBox,
    toggleSelection,
} from './dataSelectionUtil';
import { IntervalSet } from './intervalSet';

type Series = NonNullable<NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>['series']>;

export class DataSelection extends AbstractModuleInstance implements _ModuleSupport.SelectionModuleFns {
    private dragStartEvent?: _Widget.DragWidgetEvent<'drag-start'>;
    private readonly dragRect: _ModuleSupport.Rect;
    private readonly state: _ModuleSupport.DataSelectionState;

    private get opts(): NormalisedSelectionOptions {
        return this.ctx.chartState.getValue('options', 'selection');
    }

    private supportsSelection(): boolean {
        return (
            this.ctx.chartService.getChartType() !== 'standalone' &&
            this.ctx.chartService.series.at(0)?.type !== 'histogram'
        );
    }

    private supportsSelectionDrag(): boolean {
        return this.supportsSelection() && this.ctx.chartService.getChartType() !== 'topology';
    }

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.state = { selectedCount: 0 };
        ctx.chartState.setValue('selectionState', this.state);

        this.dragRect = new _ModuleSupport.Rect();
        this.dragRect.fill = SELECTION_FILL_VALID;
        this.dragRect.fillOpacity = SELECTION_FILLOPACITY;
        this.dragRect.stroke = SELECTION_STROKE;
        this.dragRect.strokeWidth = SELECTION_STROKEWIDTH;
        this.dragRect.strokeOpacity = SELECTION_STROKEOPACITY;
        this.dragRect.lineDash = SELECTION_LINEDASH;
        this.dragRect.visible = false;

        ctx.chartService.selectionRoot.appendChild(this.dragRect);
        this.cleanup.register(
            () => ctx.chartService.selectionRoot.removeChild(this.dragRect),
            ctx.eventsHub.on('series-area:click', (ev) => this.onSeriesAreaClick(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-start', (ev) => this.onSeriesAreaDragStart(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-move', (ev) => this.onSeriesAreaDragMove(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-end', (ev) => this.onSeriesAreaDragEnd(ev)),
            ctx.widgets.seriesWidget.addListener('keydown', (ev) => this.onKeyDown(ev)),
            () => ctx.chartState.setValue('selectionState', undefined)
        );
    }

    getSelection(): Iterable<AgSelectionItem<unknown>> {
        if (!this.supportsSelection()) return [];

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
        if (!this.supportsSelection()) return;

        const { chartService } = this.ctx;

        const changes = this.allocSelectionChanges();
        clearAllSelections(changes, this.state, chartService.series);

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

            setSelected(changes, series, data, datumIndex);
        }

        this.dispatchInternalSelectionChange(chartService.series, changes);
        this.dispatchExternalSelectionChange('api-call', changes);
        this.redraw(ChartUpdateType.PERFORM_LAYOUT);
    }

    clearSelection(): void {
        if (!this.supportsSelection()) return;

        const { chartService } = this.ctx;

        const changes = this.allocSelectionChanges();
        clearAllSelections(changes, this.state, chartService.series);

        this.dispatchInternalSelectionChange(chartService.series, changes);
        this.dispatchExternalSelectionChange('api-call', changes);
        this.redraw(ChartUpdateType.PERFORM_LAYOUT);
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent): void {
        if (!this.supportsSelection()) return;

        const { enabled, enableClick, enableClickAwayToClear, clickMode } = this.opts;
        if (!enabled || !enableClick) return;

        const { type, clickedNode, distance } = event;
        if (type !== 'click') return;

        const modifierPressed = hasAddToSelectionModifier(event);
        const clickMiss =
            clickedNode === undefined ||
            distance !== 0 ||
            !(clickedNode.series.properties.selection.enabled satisfies boolean);

        if (clickMiss && (modifierPressed || !enableClickAwayToClear)) {
            // Ctrl+Click only toggles selection; it shouldn't clear the selection.
            // Click-missing with enableClickAwayToClear:false should also do nothing.
            return;
        }

        const changes = this.allocSelectionChanges();
        if (clickMiss) {
            clearAllSelections(changes, this.state, this.ctx.chartService.series);
            this.dispatchInternalSelectionChange(this.ctx.chartService.series, changes);
        } else {
            const { data } = clickedNode.series;
            if (data === undefined) return;

            const { series, datumIndex } = clickedNode;
            if (typeof datumIndex !== 'number') {
                Logger.errorOnce(`Not Yet Implemented: datumIndex of type ${typeof datumIndex}`);
                return;
            }

            if (clickMode === 'multiple' || modifierPressed) {
                toggleSelection(changes, series, data, datumIndex);
            } else {
                clickMode satisfies 'single';
                clearAllSelections(changes, this.state, this.ctx.chartService.series);
                setSelected(changes, series, data, datumIndex);
            }
            this.dispatchInternalSelectionChange([series], changes);
        }
        this.dispatchExternalSelectionChange('user-interaction', changes);
        this.redraw(ChartUpdateType.PERFORM_LAYOUT);
    }

    private onSeriesAreaDragStart(dragStartEvent: _Widget.DragWidgetEvent<'drag-start'>) {
        if (!this.supportsSelectionDrag()) return;

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
        if (!this.supportsSelectionDrag()) return;

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
        if (!this.supportsSelectionDrag()) return;

        const { enabled, enableDrag } = this.opts;
        const { dragStartEvent } = this;

        if (!enabled || !enableDrag || !dragStartEvent) {
            this.dragRect.visible = false;
            return;
        }

        const changes = this.allocSelectionChanges();
        const shouldClearSelections: boolean = !hasAddToSelectionModifier(dragEndEvent);
        if (shouldClearSelections) {
            clearAllSelections(changes, this.state, this.ctx.chartService.series);
        }

        const bbox = toBBox(dragStartEvent, dragEndEvent);
        const changedSeries: Series[] = [];
        const intervalSet = new IntervalSet();

        for (const series of this.ctx.chartService.series) {
            if (!series.properties.selection.enabled) continue;

            const { data } = series;
            if (data === undefined) continue;

            let changed = false;
            intervalSet.clear();

            const getRangeOfAggregateIndex = series.getAggregateRangeReader();

            for (const datum of series.pickNodesInBBox(bbox)) {
                if (asNumericDatumIndex(datum.datumIndex)) {
                    if (getRangeOfAggregateIndex) {
                        const range = getRangeOfAggregateIndex(datum.datumIndex);
                        if (!intervalSet.has(datum.datumIndex)) {
                            const [start, end] = range;
                            if (asNumericDatumIndex(start) && asNumericDatumIndex(end)) {
                                changed = true;
                                intervalSet.add(start, end);
                            }
                        }
                    } else {
                        changed = true;
                        setSelected(changes, series, data, datum.datumIndex);
                    }
                }
            }

            for (const interval of intervalSet.values()) {
                // NOTE: `end` is inclusive in IntervalSet but exclusive in DataSetSelection
                setSelectedRange(changes, series, data, shouldClearSelections, interval.start, interval.end + 1);
            }

            if (changed) {
                changedSeries.push(series);
            }
        }

        this.dispatchInternalSelectionChange(changedSeries, changes);
        this.dispatchExternalSelectionChange('user-interaction', changes);
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
        this.redraw(ChartUpdateType.PERFORM_LAYOUT);
    }

    private redraw(type: ChartUpdateType): void {
        this.ctx.eventsHub.emit('chart:request-update', { type, opts: { skipAnimations: true } });
    }

    private dispatchInternalSelectionChange(changedSeries: Series[], changes: SelectionChanges): void {
        this.state.selectedCount += changes.countDelta;
        for (const series of changedSeries) {
            series.events.emit('data-selection-change', null);
        }
    }

    private dispatchExternalSelectionChange(source: AgSelectionChangeEventSource, changes: SelectionChanges): void {
        if (changes.added === undefined) return;

        const { added, removed } = changes;

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
            rollbackChanges(changes, this.ctx.chartService.series);
            this.state.selectedCount -= changes.countDelta;
        }
    }

    private allocSelectionChanges(): SelectionChanges {
        if (!this.ctx.chartService.hasListener('selectionChange')) return { countDelta: 0 };
        return { countDelta: 0, added: [], removed: [] };
    }
}
