import type {
    AgChartOptions,
    AgSelectionChangeEventSource,
    AgSelectionItem,
    AgTreemapSeriesGroupOptions,
    _Widget,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    type AreMutuallyExclusive,
    ChartUpdateType,
    type DynamicContext,
    type NormalisedSelectionOptions,
} from 'ag-charts-core';

import { DataSelectionChangeMap } from './dataSelectionChangeMap';
import {
    SELECTION_FILLOPACITY,
    SELECTION_FILL_VALID,
    SELECTION_LINEDASH,
    SELECTION_STROKE,
    SELECTION_STROKEOPACITY,
    SELECTION_STROKEWIDTH,
} from './dataSelectionConstants';
import { DataSelectionService } from './dataSelectionService';
import {
    type SelectionChanges,
    clearAllSelections,
    hasAddToSelectionModifier,
    isAgSelectionItem,
    isUnknownIterable,
    rollbackChanges,
    setSelected,
    setSelectedRange,
    toCanvasBBox,
    toggleSelection,
} from './dataSelectionUtil';
import { IntervalSet } from './intervalSet';

type Series = NonNullable<NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>['series']>;
type IDataSelectionService = _ModuleSupport.IDataSelectionService;
type SeriesType = NonNullable<AgChartOptions['series']>[number]['type'];

function initSet(types: SeriesType[]): Set<unknown> {
    return new Set(types);
}
const UNSUPPORTED_SERIES = initSet(['histogram', 'waterfall', 'funnel', 'cone-funnel']);
const UNSUPPORTED_DRAGGING = initSet([
    'map-line',
    'map-line-background',
    'map-marker',
    'map-shape',
    'map-shape-background',
    'nightingale',
    'radar-area',
    'radar-line',
    'radial-column',
]);

function upcastDataSelectionService(service: IDataSelectionService | undefined): DataSelectionService {
    if (service && service instanceof DataSelectionService) return service;
    throw new Error('FATAL ERROR - cannot upcast DataSelectionService');
}

export class DataSelection extends AbstractModuleInstance implements _ModuleSupport.SelectionModuleFns {
    private dragStartEvent?: _Widget.DragWidgetEvent<'drag-start'>;
    private readonly dragRect: _ModuleSupport.Rect;
    private readonly service: DataSelectionService;

    private get opts(): NormalisedSelectionOptions {
        return this.ctx.chartState.getValue('options', 'selection')!;
    }

    private enabled(): boolean {
        return this.service.isEnabled();
    }

    private supportsSelection(): boolean {
        const type0 = this.ctx.chartService.series.at(0)?.type;
        return !UNSUPPORTED_SERIES.has(type0);
    }

    private supportsSelectionDrag(): boolean {
        if (!this.supportsSelection()) return false;
        const type0 = this.ctx.chartService.series.at(0)?.type;
        return !UNSUPPORTED_DRAGGING.has(type0);
    }

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.service = upcastDataSelectionService(ctx.dataSelectionService);
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
            () => this.dragRect.remove(),
            ctx.chartState.observe((get) => {
                // AG-17570 The `chart.selection.enabled` option is not definitive, series can all enable the selection
                // module through options like `series[].selection.enabled`, `series[].tile.selection.enabled` or
                // `series[].group.selection.enabled`.
                type EnabledMixin = { enabled?: boolean };
                type SeriesOptionsMixins =
                    | { type: string; selection?: EnabledMixin; tile?: never; group?: never } // most series-types
                    | { type: 'treemap'; selection?: never; tile?: { selection?: EnabledMixin } }; // special-case
                // static-assertion that option `series[type="treemap"].group.selection` does not exist.
                // if this option gets added then the moduleEnabled condition would be incomplete.
                true satisfies AreMutuallyExclusive<keyof AgTreemapSeriesGroupOptions<unknown, unknown>, 'selection'>;

                const selection: EnabledMixin = get('options', 'selection') ?? {};
                const series: SeriesOptionsMixins[] = get('options', 'series') ?? [];
                this.service.setEnabled(
                    selection.enabled === true ||
                        series.some((s) => s.selection?.enabled === true || s.tile?.selection?.enabled === true)
                );
            }),
            ctx.eventsHub.on('series-area:click', (ev) => this.onSeriesAreaClick(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-start', (ev) => this.onSeriesAreaDragStart(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-move', (ev) => this.onSeriesAreaDragMove(ev)),
            ctx.widgets.seriesDragInterpreter?.events.on('drag-end', (ev) => this.onSeriesAreaDragEnd(ev)),
            ctx.widgets.seriesWidget.addListener('keydown', (ev) => this.onKeyDown(ev)),
            ctx.widgets.seriesWidget.addListener('keyup', (ev) => this.onKeyUp(ev))
        );
    }

    getSelection(): Iterable<AgSelectionItem<unknown>> {
        if (!this.enabled() || !this.supportsSelection()) return [];

        return function* getSelectionIterator(this: DataSelection) {
            for (const it of this.service.iterateDataSetSelections()) {
                for (let datumIndex = 0; datumIndex < it.selection.getLength(); datumIndex++) {
                    if (it.selection.isSelected(datumIndex)) {
                        const itemId = it.dataSet.getItemIdFromIndex(datumIndex);
                        const datum = it.dataSet.getDatumAt(datumIndex);
                        const seriesId = it.seriesId;
                        yield { seriesId, itemId, datum };
                    }
                }
            }
        }.bind(this)();
    }

    setSelection(items: unknown): void {
        if (!this.enabled() || !this.supportsSelection()) return;

        const { chartService } = this.ctx;

        const changes = this.allocSelectionChanges();
        clearAllSelections(changes, this.service);

        if (!isUnknownIterable(items)) {
            this.ctx.logger.warn('Selection items is not iterable');
            return;
        }

        for (const item of items) {
            if (!isAgSelectionItem(item)) {
                this.ctx.logger.warn('Skipping invalid AgSelectionItemIds object: ', item);
                continue;
            }

            const series = this.ctx.chartService.series.find((s) => s.id == item.seriesId);
            if (series === undefined) {
                this.ctx.logger.warn('Skipping seriesId (series not found)', item.seriesId);
                continue;
            }

            const data = series.data;
            if (data === undefined) {
                this.ctx.logger.warn('Skipping seriesId (data not found):', item.seriesId);
                continue;
            }

            const datumIndex = data.getIndexFromItemId(item.itemId);
            if (datumIndex === undefined) {
                this.ctx.logger.warn('Skipping itemId (datum not found):', item.itemId);
                continue;
            }

            setSelected(changes, series, this.service, datumIndex);
        }

        this.dispatchExternalSelectionChange('api-call', changes);
        this.dispatchInternalSelectionChange(chartService.series, changes);
        this.redraw(ChartUpdateType.PERFORM_LAYOUT);
    }

    clearSelection(): void {
        if (!this.enabled() || !this.supportsSelection()) return;

        const { chartService } = this.ctx;

        const changes = this.allocSelectionChanges();
        clearAllSelections(changes, this.service);

        this.dispatchExternalSelectionChange('api-call', changes);
        this.dispatchInternalSelectionChange(chartService.series, changes);
        this.redraw(ChartUpdateType.PERFORM_LAYOUT);
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent): void {
        if (!this.supportsSelection()) return;

        const { enableClick, enableClickAwayToClear, clickMode } = this.opts;
        if (!this.enabled() || !enableClick) return;

        const { type, clickedNode, target } = event;
        if (type !== 'click') return;

        // Dedicated controls (e.g. the org-chart expander pill) own their clicks outright and must
        // not disturb selection. Must precede `clickMiss`, which would clear via click-away.
        if (clickedNode !== undefined && !clickedNode.series.firesUserClickListeners(target)) return;

        const modifierPressed = hasAddToSelectionModifier(event);
        const clickMiss = clickedNode === undefined || (!clickedNode.series.isSelectionEnabled() satisfies boolean);

        if (clickMiss && (modifierPressed || !enableClickAwayToClear)) {
            // Ctrl+Click only toggles selection; it shouldn't clear the selection.
            // Click-missing with enableClickAwayToClear:false should also do nothing.
            return;
        }

        const changes = this.allocSelectionChanges();
        let internalRefreshTargets: Iterable<Series>;
        if (clickMiss) {
            clearAllSelections(changes, this.service);
            internalRefreshTargets = this.ctx.chartService.series;
        } else {
            const { series, datumIndex } = clickedNode;
            if (clickMode === 'multiple' || modifierPressed) {
                toggleSelection(changes, series, this.service, datumIndex);
                internalRefreshTargets = [series];
            } else {
                clickMode satisfies 'single';
                clearAllSelections(changes, this.service);
                setSelected(changes, series, this.service, datumIndex);
                internalRefreshTargets = this.ctx.chartService.series;
            }
        }
        // AG-17445 Use `finally` to cleanup if the `selectionChange` user-callback throws an error
        try {
            this.dispatchExternalSelectionChange('user-interaction', changes);
        } finally {
            this.dispatchInternalSelectionChange(internalRefreshTargets, changes);
            this.redraw(ChartUpdateType.FULL);
        }
    }

    private onSeriesAreaDragStart(dragStartEvent: _Widget.DragWidgetEvent<'drag-start'>) {
        if (!this.supportsSelectionDrag()) return;

        const { enableDrag } = this.opts;
        if (!this.enabled() || !enableDrag || this.hasUnknownModifier(dragStartEvent)) return;

        this.dragStartEvent = dragStartEvent;
        this.dragRect.x = dragStartEvent.currentX;
        this.dragRect.y = dragStartEvent.currentY;
        this.dragRect.width = 0;
        this.dragRect.height = 0;
        this.dragRect.visible = true;
        dragStartEvent.sourceEvent.preventDefault();
    }

    private onSeriesAreaDragMove(dragMoveEvent: _Widget.DragWidgetEvent<'drag-move'>) {
        if (!this.supportsSelectionDrag()) return;

        const { enableDrag } = this.opts;
        const { dragStartEvent } = this;

        if (!this.enabled() || !enableDrag || !dragStartEvent) {
            this.dragRect.visible = false;
            return;
        }

        const { seriesRoot, seriesRect } = this.ctx.chartService;
        const canvasBounds = toCanvasBBox(seriesRoot, dragStartEvent, dragMoveEvent).clip(seriesRect);

        this.service.totalCandidacyCount = 0;
        this.service.candidacyInProgress ||= canvasBounds.width > 0 || canvasBounds.height > 0;
        this.service.candidacyUnion = hasAddToSelectionModifier(dragMoveEvent);
        for (const series of this.iterateSelectableSeries()) {
            const data = series.data;
            if (!data) continue;

            const bitfield = this.service.enableCandidacy(series.id, data);
            bitfield.clear();

            for (const { datumIndex } of series.pickNodesInBBox(canvasBounds)) {
                if (!series.isDatumSelectable(datumIndex)) continue;
                bitfield.setBit(datumIndex);
                this.service.totalCandidacyCount++;
            }
        }

        this.dragRect.x = canvasBounds.x;
        this.dragRect.y = canvasBounds.y;
        this.dragRect.width = canvasBounds.width;
        this.dragRect.height = canvasBounds.height;
        this.redraw(ChartUpdateType.FULL);
        dragMoveEvent.sourceEvent.preventDefault();
    }

    private onSeriesAreaDragEnd(dragEndEvent: _Widget.DragWidgetEvent<'drag-end'>) {
        if (!this.supportsSelectionDrag()) return;

        const { enableDrag } = this.opts;
        const { dragStartEvent, service } = this;

        service.totalCandidacyCount = 0;
        service.candidacyUnion = hasAddToSelectionModifier(dragEndEvent);
        if (!this.enabled() || !enableDrag || !dragStartEvent) {
            this.dragRect.visible = false;
            return;
        }

        const changes = this.allocSelectionChanges();
        const shouldClearSelections: boolean = !hasAddToSelectionModifier(dragEndEvent);
        // On a clear-and-replace drag every series sees a state transition
        // (Item/OtherItem flips for each rendered marker), so dispatch the
        // internal change to all of them — error-bar styling and other
        // per-marker consumers wouldn't otherwise re-render the previously
        // selected series.
        const changedSeries = new Set<Series>(shouldClearSelections ? this.ctx.chartService.series : undefined);
        if (shouldClearSelections) {
            clearAllSelections(changes, this.service);
        }

        const canvasBounds = toCanvasBBox(this.ctx.chartService.seriesRoot, dragStartEvent, dragEndEvent);
        const intervalSet = new IntervalSet();

        for (const series of this.iterateSelectableSeries()) {
            let changed = false;
            intervalSet.clear();

            const bucketLookup = series.ensureBucketLookupFeature();
            const getRangeOfAggregateIndex = bucketLookup?.getRangeReader();

            for (const nodeDatum of series.pickNodesInBBox(canvasBounds)) {
                const datumIndex = nodeDatum.datumIndex;
                const indexSet = bucketLookup?.getIndexSet(datumIndex);
                if (getRangeOfAggregateIndex) {
                    const range = getRangeOfAggregateIndex(datumIndex);
                    if (range && !intervalSet.has(datumIndex)) {
                        const [start, end] = range;
                        changed = true;
                        intervalSet.add(start, end);
                    }
                } else if (indexSet === undefined) {
                    changed = true;
                    setSelected(changes, series, service, datumIndex);
                } else {
                    for (const idx of indexSet) {
                        changed = true;
                        setSelected(changes, series, service, idx);
                    }
                }
            }

            for (const interval of intervalSet.values()) {
                // NOTE: `end` is inclusive in IntervalSet but exclusive in DataSetSelection
                setSelectedRange(changes, series, service, interval.start, interval.end + 1);
            }

            if (changed) {
                changedSeries.add(series);
            }
        }

        // External listener fires first so any rollback completes before we
        // refresh per-series bucket caches against the final bitset state.
        try {
            this.dispatchExternalSelectionChange('user-interaction', changes);
        } finally {
            this.dispatchInternalSelectionChange(changedSeries, changes);
            this.endDrag();
        }
    }

    private refreshCandidacyUnion(widgetEvent: _ModuleSupport.KeyboardWidgetEvent<'keydown' | 'keyup'>): void {
        // The drag-move / drag-end events include the state of all modifiers in the events, therefore those event
        // handlers always refresh the candidacyUnion count. However, the user can also press/release the modifier keys
        // without moving the mouse; which would mean that any itemStyler callbacks that read candidateState would need
        // to invoked again.
        const oldCandidacyUnion = this.service.candidacyUnion;
        const newCandidacyUnion = hasAddToSelectionModifier(widgetEvent);
        if (oldCandidacyUnion !== newCandidacyUnion) {
            this.service.candidacyUnion = newCandidacyUnion;
            this.redraw(ChartUpdateType.FULL);
        }
    }

    private onKeyDown(widgetEvent: _ModuleSupport.KeyboardWidgetEvent<'keydown'>): void {
        if (!this.enabled()) return;
        this.refreshCandidacyUnion(widgetEvent);

        const { code } = widgetEvent.sourceEvent;
        if (code === 'Escape') {
            this.endDrag();
        }
    }

    private onKeyUp(widgetEvent: _ModuleSupport.KeyboardWidgetEvent<'keyup'>): void {
        if (!this.enabled()) return;
        this.refreshCandidacyUnion(widgetEvent);
    }

    private endDrag(): void {
        this.service.clearCandidacy();
        this.dragStartEvent = undefined;
        this.dragRect.visible = false;
        this.redraw(ChartUpdateType.FULL);
    }

    private redraw(type: ChartUpdateType): void {
        this.ctx.eventsHub.emit('chart:request-update', { type, opts: { skipAnimations: true } });
    }

    private dispatchInternalSelectionChange(changedSeries: Iterable<Series>, changes: SelectionChanges): void {
        this.service.totalSelectedCount += changes.countDelta;
        for (const series of changedSeries) {
            series.events.emit('data-selection-change', null);
        }
    }

    private dispatchExternalSelectionChange(source: AgSelectionChangeEventSource, changes: SelectionChanges): void {
        if (changes.items === undefined) return;

        const added = changes.items.toAdded();
        const removed = changes.items.toRemoved();

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
            rollbackChanges(changes, this.service);
            this.service.totalSelectedCount -= changes.countDelta;
        }
    }

    private allocSelectionChanges(): SelectionChanges {
        if (!this.ctx.chartService.hasListener('selectionChange')) return { countDelta: 0 };
        return { countDelta: 0, items: new DataSelectionChangeMap() };
    }

    private hasUnknownModifier(event: _Widget.DragWidgetEvent): boolean {
        return event.sourceEvent.altKey || event.sourceEvent.shiftKey;
    }

    private *iterateSelectableSeries(): Generator<Series> {
        for (const series of this.ctx.chartService.series) {
            if (series.isSelectionEnabled()) {
                yield series;
            }
        }
    }
}
