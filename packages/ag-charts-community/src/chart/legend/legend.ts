import type { DynamicContext } from 'ag-charts-core';
import {
    type Callback,
    type CallbackParam,
    ChartUpdateType,
    CleanupRegistry,
    FILL_GRADIENT_BLANK_DEFAULTS,
    FILL_IMAGE_BLANK_DEFAULTS,
    FILL_PATTERN_BLANK_DEFAULTS,
    type ITextMeasurer,
    LineSplitter,
    Logger,
    type NormalisedLegendOptions,
    type NormalisedLegendPaginationOptions,
    ZIndexMap,
    cachedTextMeasurer,
    callWithContext,
    clamp,
    createId,
    deepClone,
    expandLegendPosition,
    isImageFill,
    isPatternFill,
    isTextTruncated,
    objectsEqual,
    toPlainText,
    toTextString,
    truncateLine,
} from 'ag-charts-core';
import type { AgChartLegendContextMenuEvent, AgMarkerShapeFn } from 'ag-charts-types';

import type { ActiveLoadMementoEvent, HighlightNodeDatum } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { Group, TranslatableGroup } from '../../scene/group';
import { Node } from '../../scene/node';
import type { Scene } from '../../scene/scene';
import { Selection } from '../../scene/selection';
import { Rect } from '../../scene/shape/rect';
import { Transformable } from '../../scene/transformable';
import type { SwitchWidget } from '../../widget/switchWidget';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { ChartService } from '../chartService';
import type { Page } from '../gridLayout';
import { gridLayout } from '../gridLayout';
import { InteractionState } from '../interaction/interactionManager';
import { type LayoutContext, LayoutElement } from '../layout/layoutManager';
import { Marker } from '../marker/marker';
import { Pagination } from '../pagination/pagination';
import { getShapeStyle } from '../series/shapeUtil';
import { type TooltipMeta } from '../tooltip/tooltip';
import type { TooltipContent } from '../tooltip/tooltipContent';
import { LegendDOMProxy } from './legendDOMProxy';
import type { CategoryLegendDatum } from './legendDatum';
import { makeLegendItemEvent } from './legendEvent';
import { LegendMarkerLabel } from './legendMarkerLabel';
import type { LegendSymbolOptions } from './legendSymbol';

type SeriesType = ChartService['series'][number];

function toHighlightNodeDatum(series: SeriesType, legendDatum: CategoryLegendDatum): HighlightNodeDatum {
    switch (typeof legendDatum.itemId) {
        case 'number':
            return {
                series,
                itemId: undefined,
                datum: undefined,
                datumIndex: legendDatum.itemId,
                legendItemName: legendDatum.legendItemName,
            };
        case 'string':
            return {
                series,
                itemId: legendDatum.itemId,
                datum: undefined,
                datumIndex: Number.NaN,
                legendItemName: legendDatum.legendItemName,
            };
        default:
            return legendDatum.itemId satisfies never;
    }
}

export class Legend {
    static readonly className = 'Legend';

    readonly id = createId(this);

    private readonly group = new TranslatableGroup({ name: 'legend', zIndex: ZIndexMap.LEGEND });

    private readonly itemSelection: Selection<CategoryLegendDatum, LegendMarkerLabel> =
        Selection.select<LegendMarkerLabel>(this.group, LegendMarkerLabel);
    private readonly containerNode = this.group.appendChild(new Rect({ name: 'legend-container' }));

    private readonly oldSize: [number, number] = [0, 0];
    private pages: Page[] = [];
    private paginationItemsOffsetX = 0;
    private maxPageSize: [number, number] = [0, 0];
    /** Item index to track on re-pagination, so current page updates appropriately. */
    private paginationTrackingIndex: number = 0;

    private readonly truncatedItems: Set<string | number> = new Set();

    /** Incremented on every highlight update so a deferred (animation-batch) update can detect
     * that a later update has superseded it and skip itself. */
    private highlightUpdateToken = 0;

    private _data: CategoryLegendDatum[] = [];
    set data(value: CategoryLegendDatum[]) {
        if (objectsEqual(value, this._data)) return;
        this.domProxy.onDataUpdate(this._data, value);
        this._data = value;
        this.syncProxyButtonStates(value);
        this.updateGroupVisibility();
    }
    get data() {
        return this._data;
    }

    private syncProxyButtonStates(data: CategoryLegendDatum[]) {
        const enabledMap = new Map(data.map((d) => [d.itemId, d.enabled]));
        this.itemSelection.each(({ proxyButton }, { itemId }) => {
            if (proxyButton == null) return;
            const enabled = enabledMap.get(itemId);
            if (enabled != null) {
                proxyButton.setChecked(enabled);
            }
        });
    }

    private readonly contextMenuDatum?: CategoryLegendDatum;

    readonly size: [number, number] = [0, 0];

    private _visible: boolean = true;
    set visible(value: boolean) {
        this._visible = value;
        this.ctx.chartState.setValue('legendVisible', value);
        this.updateGroupVisibility();
    }
    get visible() {
        return this._visible;
    }

    private readonly pagination: Pagination;
    private readonly cleanup = new CleanupRegistry();
    private readonly domProxy: LegendDOMProxy;

    private get opts(): NormalisedLegendOptions {
        return this.ctx.chartState.getValue('options', 'legend');
    }

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {
        // Start invisible — updateGroupVisibility() will enable when legend has data and options.
        // This prevents a spurious true→false dirty mark during the first flushChanges() for chart
        // types where the legend is disabled (sparklines, gauges).
        this.group.visible = false;

        this.pagination = new Pagination(
            () => ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER }),
            (page) => this.updatePageNumber(page)
        );
        this.pagination.attachPagination(this.group);

        const items = ctx.contextMenuRegistry?.builtins.items;
        if (items) {
            items['toggle-series-visibility'].action = (params) => this.contextToggleVisibility(params);
            items['toggle-other-series'].action = (params) => this.contextToggleOtherSeries(params);
        }

        let prevEnabled = this.opts?.enabled;
        this.cleanup.register(
            ctx.chartState.observe((get) => {
                const enabled = get('options', 'legend.enabled');
                if (prevEnabled === false && enabled === true && ctx.legendManager) {
                    ctx.stateManager.restoreState(ctx.legendManager);
                }
                prevEnabled = enabled;
                this.updateGroupVisibility();
            }),
            ctx.eventsHub.on('active:load-memento', (event) => this.onActiveLoadMemento(event)),
            ctx.chartState.observe((get) => {
                const activeItem = get('activeItem');
                if (activeItem?.type === 'series-node') {
                    this.ctx.highlightManager.updateHighlight(this.id);
                }
            }),
            ctx.chartState.observe((get) => {
                const legendData = get('legendData');
                if (legendData == null) return;
                const allData = Object.values(legendData).flat();
                this.data = allData.filter((datum) => !datum.hideInLegend);
            }),
            ctx.layoutManager.registerElement(LayoutElement.Legend, (e) => this.positionLegend(e)),
            ctx.eventsHub.on('locale:change', () => this.onLocaleChanged()),
            () => {
                if (items) {
                    delete items['toggle-series-visibility'].action;
                    delete items['toggle-other-series'].action;
                }
            },
            () => this.group.remove()
        );

        this.domProxy = new LegendDOMProxy(this.ctx, this.id);

        if (ctx.legendManager) {
            this.ctx.historyManager.addMementoOriginator(ctx.legendManager);
        }
    }

    public destroy() {
        this.ctx.domManager.removeChild('canvas-overlay', `${this.id}-toolbar`);
        this.ctx.domManager.removeChild('canvas-overlay', `${this.id}-pagination`);
        this.cleanup.flush();
        this.itemSelection.clear();
    }

    private updateGroupVisibility() {
        const options = this.ctx.chartState.getValue('options');
        if (options === undefined) return;
        const enabled = options.legend?.enabled ?? false;
        this.group.visible = enabled && this.visible && this.data.length > 0;
    }

    private updateItemSelection(): void {
        const data = [...this.data];
        if (this.opts.reverseOrder) {
            data.reverse();
        }
        this.itemSelection.update(data);
    }

    private isInteractive(): boolean {
        const {
            toggleSeries,
            listeners: { legendItemClick, legendItemDoubleClick },
            item: { tooltip },
        } = this.opts;
        const hasExplicitTooltip = tooltip != null && tooltip.visible !== 'never';
        return toggleSeries || legendItemDoubleClick != null || legendItemClick != null || hasExplicitTooltip;
    }

    private hasEnabledContextMenu(): boolean {
        return (
            this.ctx.contextMenuRegistry != null &&
            (this.ctx.chartState.getValue('options', 'contextMenu')?.enabled ?? true)
        );
    }

    private checkInteractionState(): boolean {
        return this.ctx.interactionManager.isState(InteractionState.Frozen);
    }

    attachLegend(scene: Scene) {
        scene.appendChild(this.group);
    }

    getItemLabel(datum: CategoryLegendDatum) {
        const { formatter } = this.opts.item.label;
        if (formatter) {
            const seriesDatum = datum.datum;
            return this.cachedCallWithContext(formatter, {
                itemId: datum.itemId,
                value: datum.label.text,
                seriesId: datum.seriesId,
                ...(seriesDatum && { datum: seriesDatum }),
            });
        }
        return datum.label.text;
    }

    /**
     * The method is given the desired size of the legend, which only serves as a hint.
     * The vertically oriented legend will take as much horizontal space as needed, but will
     * respect the height constraints, and the horizontal legend will take as much vertical
     * space as needed in an attempt not to exceed the given width.
     * After the layout is done, the {@link size} will contain the actual size of the legend.
     * If the actual size is not the same as the previous actual size, the legend will fire
     * the 'layoutChange' event to communicate that another layout is needed, and the above
     * process should be repeated.
     * @param width
     * @param height
     */
    private calcLayout(width: number, height: number) {
        const { item } = this.opts;
        const {
            padding,
            label,
            maxWidth: itemMaxWidth,
            label: { maxLength = Infinity, fontStyle, fontWeight, fontSize, fontFamily },
        } = item;
        this.updateItemSelection();

        // Update properties that affect the size of the legend items and measure them.
        const bboxes: BBox[] = [];

        const measurer = cachedTextMeasurer(label);

        const itemMaxWidthPercentage = 0.8;
        const maxItemWidth = itemMaxWidth ?? width * itemMaxWidthPercentage;

        const { markerWidth, anyLineEnabled } = this.calculateMarkerWidth();
        const { isRtl } = this.ctx.domManager;

        this.itemSelection.each((markerLabel, datum) => {
            markerLabel.fontStyle = fontStyle;
            markerLabel.fontWeight = fontWeight;
            markerLabel.fontSize = fontSize;
            markerLabel.fontFamily = fontFamily;
            markerLabel.isRtl = isRtl;

            const paddedSymbolWidth = this.updateMarkerLabel(markerLabel, datum, markerWidth, anyLineEnabled, item);
            const id = datum.itemId ?? datum.id;
            const labelText = this.getItemLabel(datum);
            const text = toPlainText(labelText, '<unknown>').replace(LineSplitter, ' ');
            markerLabel.text = this.truncate(text, maxLength, maxItemWidth, paddedSymbolWidth, measurer, id);

            bboxes.push(markerLabel.getTextMeasureBBox());
        });

        width = Math.max(1, width);
        height = Math.max(1, height);

        if (!Number.isFinite(width)) {
            return {};
        }

        [width, height] = this.updateContainer(width, height);

        const size = this.size;
        const oldSize = this.oldSize;
        size[0] = width;
        size[1] = height;

        if (size[0] !== oldSize[0] || size[1] !== oldSize[1]) {
            oldSize[0] = size[0];
            oldSize[1] = size[1];
        }

        const { pages, maxPageHeight, maxPageWidth } = this.updatePagination(bboxes, width, height);
        const oldPages = this.pages;
        this.pages = pages;
        this.maxPageSize = [maxPageWidth - padding.left - padding.right, maxPageHeight - padding.top - padding.bottom];

        const pageNumber = this.pagination.currentPage;
        const page = this.pages[pageNumber];

        if (this.pages.length < 1 || !page) {
            this.visible = false;
            return { oldPages };
        }

        this.visible = true;

        // Position legend items
        this.updatePositions(pageNumber);

        // Update legend item properties that don't affect the layout.
        this.update();

        return { oldPages };
    }

    private isCustomMarker(
        markerEnabled: boolean,
        shape: LegendSymbolOptions['marker']['shape']
    ): shape is AgMarkerShapeFn {
        return markerEnabled && shape !== undefined && typeof shape !== 'string';
    }

    private calcSymbolsEnabled(symbol: LegendSymbolOptions, showSeriesStroke: boolean) {
        const markerEnabled = !showSeriesStroke || (symbol.marker.enabled ?? true);
        const lineEnabled = !!(symbol.line && showSeriesStroke);
        const isCustomMarker = this.isCustomMarker(markerEnabled, symbol.marker.shape);
        return { markerEnabled, lineEnabled, isCustomMarker };
    }

    private calcSymbolsLengths(
        symbol: LegendSymbolOptions,
        markerEnabled: boolean,
        lineEnabled: boolean,
        itemOpts: NormalisedLegendOptions['item']
    ) {
        const { marker, line } = itemOpts;

        let customMarkerSize: number | undefined;
        const { shape } = symbol.marker;
        // Calculate the marker size of a custom marker shape:
        if (this.isCustomMarker(markerEnabled, shape)) {
            const tmpShape = new Marker();
            tmpShape.shape = shape;
            tmpShape.updatePath();
            const bbox = tmpShape.getBBox();
            customMarkerSize = Math.max(bbox.width, bbox.height);
        }

        const markerLength = markerEnabled ? marker.size : 0;
        const lineLength = lineEnabled ? line.length : 0;
        return { markerLength, lineLength, customMarkerSize };
    }

    private calculateMarkerWidth() {
        const { item } = this.opts;
        const { showSeriesStroke } = item;
        let markerWidth = 0;
        let anyLineEnabled = false;
        this.itemSelection.each((_, datum) => {
            const { symbol } = datum;

            const { lineEnabled, markerEnabled } = this.calcSymbolsEnabled(symbol, showSeriesStroke);
            const {
                markerLength,
                lineLength,
                customMarkerSize = -Infinity,
            } = this.calcSymbolsLengths(symbol, markerEnabled, lineEnabled, item);
            markerWidth = Math.max(markerWidth, lineLength, customMarkerSize, markerLength);

            anyLineEnabled ||= lineEnabled;
        });
        return { markerWidth, anyLineEnabled };
    }

    private updateMarkerLabel(
        markerLabel: LegendMarkerLabel,
        datum: CategoryLegendDatum,
        markerWidth: number,
        anyLineEnabled: boolean,
        itemOpts: NormalisedLegendOptions['item']
    ): number {
        const { marker: itemMarker, padding, showSeriesStroke } = itemOpts;
        const { symbol } = datum;
        let paddedSymbolWidth = padding.left + padding.right;

        const { markerEnabled, isCustomMarker } = this.calcSymbolsEnabled(symbol, showSeriesStroke);

        if (markerEnabled || anyLineEnabled) {
            paddedSymbolWidth += itemMarker.padding.right + markerWidth;
        }

        const { marker, line } = markerLabel;

        marker.visible = markerEnabled;
        if (marker.visible) {
            marker.shape = itemMarker.shape ?? symbol.marker.shape ?? 'square';
            marker.size = itemMarker.size;
            // Clone the marker symbol styles to prevent mutations affecting the series.
            marker.setStyleProperties(this.getMarkerStyles(deepClone(symbol)));
        }

        line.visible = anyLineEnabled;
        if (line.visible) {
            line.setStyleProperties(this.getLineStyles(symbol));
        }

        markerLabel.length = markerWidth;
        markerLabel.spacing = itemMarker.padding.right;
        markerLabel.isCustomMarker = isCustomMarker;

        return paddedSymbolWidth;
    }

    private updateContainer(width: number, height: number) {
        const containerStyles = this.getContainerStyles();

        // Initialise the containerNode to zero size to not affect legends where it is not used
        this.containerNode.width = 0;
        this.containerNode.height = 0;

        this.containerNode.setStyleProperties(containerStyles);
        this.containerNode.cornerRadius = containerStyles.cornerRadius;

        // Shrink the desired legend size by the container, since the items layout is constrained by the inner
        // dimensions of the container
        width -= containerStyles.strokeWidth * 2 + containerStyles.padding.left + containerStyles.padding.right;
        height -= containerStyles.strokeWidth * 2 + containerStyles.padding.top + containerStyles.padding.bottom;

        return [width, height];
    }

    private truncate(
        text: string,
        maxCharLength: number,
        maxItemWidth: number,
        paddedMarkerWidth: number,
        measurer: ITextMeasurer,
        id: string | number
    ): string {
        let addEllipsis = false;
        if (text.length > maxCharLength) {
            text = text.substring(0, maxCharLength);
            addEllipsis = true;
        }

        const result = truncateLine(text, measurer, maxItemWidth - paddedMarkerWidth, addEllipsis);

        if (isTextTruncated(result)) {
            this.truncatedItems.add(id);
        } else {
            this.truncatedItems.delete(id);
        }

        return result;
    }

    private updatePagination(
        bboxes: BBox[],
        width: number,
        height: number
    ): {
        maxPageHeight: number;
        maxPageWidth: number;
        pages: Page[];
    } {
        const { item, pagination: paginationOpts, orientation } = this.opts;
        const trackingIndex = Math.min(this.paginationTrackingIndex, bboxes.length);

        const { isRtl } = this.ctx.domManager;

        this.pagination.orientation = orientation;
        this.pagination.isRtl = isRtl;

        this.pagination.translationX = 0;
        this.pagination.translationY = 0;

        const { pages, maxPageHeight, maxPageWidth, paginationBBox, paginationVertical } = this.calculatePagination(
            bboxes,
            width,
            height,
            paginationOpts
        );

        const newCurrentPage = pages.findIndex((p) => p.endIndex >= trackingIndex);
        this.pagination.currentPage = clamp(0, newCurrentPage, Math.max(0, pages.length - 1));

        const { marker, padding } = item;
        const paginationComponentPadding = 8;
        const legendItemsWidth = maxPageWidth - padding.left - padding.right;
        const legendItemsHeight = maxPageHeight - padding.top - padding.bottom;

        let paginationX = 0;
        let paginationY = -paginationBBox.y - marker.size / 2;
        if (paginationVertical) {
            if (isRtl) paginationX = width - paginationBBox.width + paginationBBox.x;
            paginationY += legendItemsHeight + paginationComponentPadding;
        } else if (isRtl) {
            paginationX = -paginationBBox.x;
            paginationY += (legendItemsHeight - paginationBBox.height) / 2;
        } else {
            paginationX += -paginationBBox.x + legendItemsWidth + paginationComponentPadding;
            paginationY += (legendItemsHeight - paginationBBox.height) / 2;
        }

        this.paginationItemsOffsetX =
            isRtl && !paginationVertical && this.pagination.visible
                ? paginationBBox.width + paginationComponentPadding
                : 0;

        this.pagination.translationX = paginationX;
        this.pagination.translationY = paginationY;
        this.pagination.update(paginationOpts);
        this.pagination.updateMarkers(paginationOpts);

        let pageIndex = 0;
        this.itemSelection.each((markerLabel, _, nodeIndex) => {
            if (nodeIndex > (pages[pageIndex]?.endIndex ?? Infinity)) {
                pageIndex++;
            }
            markerLabel.pageIndex = pageIndex;
        });
        return {
            maxPageHeight,
            maxPageWidth,
            pages,
        };
    }

    private calculatePagination(
        bboxes: BBox[],
        width: number,
        height: number,
        paginationOpts: NormalisedLegendPaginationOptions
    ) {
        const { item, maxWidth, maxHeight, position, orientation } = this.opts;
        const { padding } = item;

        const vertPositions: readonly string[] = [
            'left',
            'left-top',
            'left-bottom',
            'right',
            'right-top',
            'right-bottom',
        ];
        const { placement } = expandLegendPosition(position);
        const paginationVertical = vertPositions.includes(placement);

        this.pagination.update(paginationOpts);
        this.pagination.updateMarkers(paginationOpts);
        let paginationBBox: BBox = this.pagination.getBBox();
        let lastPassPaginationBBox: BBox = new BBox(0, 0, 0, 0);
        let pages: Page[] = [];
        let maxPageWidth = 0;
        let maxPageHeight = 0;
        let count = 0;

        const stableOutput = (bbox: BBox) => {
            return bbox.width === paginationBBox.width && bbox.height === paginationBBox.height;
        };

        const forceResult = maxWidth !== undefined && maxHeight !== undefined;

        do {
            if (count++ > 10) {
                Logger.warn('unable to find stable legend layout.');
                break;
            }

            paginationBBox = lastPassPaginationBBox;

            const layout = gridLayout({
                orientation,
                bboxes,
                maxWidth: width - (paginationVertical ? 0 : paginationBBox.width),
                maxHeight: height - (paginationVertical ? paginationBBox.height : 0),
                itemPaddingY: padding.top + padding.bottom,
                itemPaddingX: padding.left + padding.right,
                forceResult,
            });

            pages = layout?.pages ?? [];
            maxPageWidth = layout?.maxPageWidth ?? 0;
            maxPageHeight = layout?.maxPageHeight ?? 0;

            const totalPages = pages.length;
            this.pagination.visible = totalPages > 1;
            this.pagination.totalPages = totalPages;

            this.pagination.update(paginationOpts);
            this.pagination.updateMarkers(paginationOpts);
            lastPassPaginationBBox = this.pagination.getBBox();

            if (!this.pagination.visible) {
                break;
            }
        } while (!stableOutput(lastPassPaginationBBox));

        return { maxPageWidth, maxPageHeight, pages, paginationBBox: lastPassPaginationBBox, paginationVertical };
    }

    private updatePositions(pageNumber: number = 0) {
        const {
            opts: {
                item: { padding },
            },
            itemSelection,
            pages,
        } = this;

        if (pages.length < 1 || !pages[pageNumber]) {
            return;
        }

        const { columns, startIndex: visibleStart, endIndex: visibleEnd } = pages[pageNumber];

        // Position legend items using the layout computed above.
        let x = 0;
        let y = 0;

        const columnCount = columns.length;
        const rowCount = columns[0].indices.length;
        const horizontal = this.opts.orientation === 'horizontal';

        const itemHeight = columns[0].bboxes[0].height + padding.top + padding.bottom;

        const { isRtl } = this.ctx.domManager;
        const rowSumColumnWidths: number[] = [];
        const pageWidth = columns.reduce((sum, col) => sum + col.columnWidth, 0);

        itemSelection.each((markerLabel, _, i) => {
            if (i < visibleStart || i > visibleEnd) {
                markerLabel.visible = false;
                return;
            }

            const pageIndex = i - visibleStart;
            let columnIndex: number;
            let rowIndex: number;
            if (horizontal) {
                columnIndex = pageIndex % columnCount;
                rowIndex = Math.floor(pageIndex / columnCount);
            } else {
                columnIndex = Math.floor(pageIndex / rowCount);
                rowIndex = pageIndex % rowCount;
            }

            markerLabel.visible = true;
            const column = columns[columnIndex];
            if (!column) return;

            // Round off for pixel grid alignment to work properly.
            y = Math.floor(itemHeight * rowIndex);

            if (isRtl) {
                x = Math.floor(pageWidth - (rowSumColumnWidths[rowIndex] ?? 0));
            } else {
                x = Math.floor(rowSumColumnWidths[rowIndex] ?? 0);
            }

            rowSumColumnWidths[rowIndex] = (rowSumColumnWidths[rowIndex] ?? 0) + column.columnWidth;

            markerLabel.translationX = x + this.paginationItemsOffsetX;
            markerLabel.translationY = y;
        });
    }

    private updatePageNumber(pageNumber: number) {
        const {
            itemSelection,
            group,
            pagination,
            pages,
            opts: { pagination: paginationOpts },
        } = this;

        // Track an item on the page in re-pagination cases (e.g. resize).
        const page = pages[pageNumber];
        if (!page) return;
        const { startIndex, endIndex } = page;
        if (startIndex === 0) {
            // Stay on first page on pagination update.
            this.paginationTrackingIndex = 0;
        } else if (pageNumber === pages.length - 1) {
            // Stay on last page on pagination update.
            this.paginationTrackingIndex = endIndex;
        } else {
            // Track the middle item on the page.
            this.paginationTrackingIndex = Math.floor((startIndex + endIndex) / 2);
        }

        this.pagination.update(paginationOpts);
        this.pagination.updateMarkers(paginationOpts);

        this.updatePositions(pageNumber);
        this.domProxy.onPageChange({
            itemSelection,
            group,
            pagination,
            interactive: this.isInteractive(),
            contextMenuAvailable: this.hasEnabledContextMenu(),
        });

        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    update() {
        const { color } = this.opts.item.label;
        this.itemSelection.each((markerLabel, datum) => {
            markerLabel.setEnabled(datum.enabled);
            markerLabel.color = color;
        });

        this.updateContextMenu();
    }

    private updateContextMenu() {
        const action = this.opts.toggleSeries ? 'show' : 'hide';
        this.ctx.contextMenuRegistry?.toggle('toggle-series-visibility', action);
        this.ctx.contextMenuRegistry?.toggle('toggle-other-series', action);
    }

    private getLineStyles(datum: LegendSymbolOptions) {
        const { stroke, strokeOpacity = 1, strokeWidth, lineDash } = datum.line ?? {};

        const defaultLineStrokeWidth = Math.min(2, strokeWidth ?? 1);

        return {
            stroke,
            strokeOpacity,
            strokeWidth: this.opts.item.line.strokeWidth ?? defaultLineStrokeWidth,
            lineDash,
        };
    }
    private getMarkerStyles({ marker }: LegendSymbolOptions) {
        const { fill, stroke, strokeOpacity = 1, fillOpacity = 1, strokeWidth, lineDash, lineDashOffset } = marker;
        const defaultLineStrokeWidth = Math.min(2, strokeWidth ?? 1);

        if (isPatternFill(fill)) {
            fill.width = 8;
            fill.height = 8;
            fill.padding = 1;
            fill.strokeWidth = Math.min(2, fill.strokeWidth ?? 2);
        }

        if (isImageFill(fill)) {
            fill.fit = 'contain';
            fill.width = undefined;
            fill.height = undefined;
            fill.repeat = 'no-repeat';
        }

        return getShapeStyle(
            {
                fill,
                stroke,
                strokeOpacity,
                fillOpacity,
                strokeWidth: this.opts.item.marker.strokeWidth ?? defaultLineStrokeWidth,
                lineDash,
                lineDashOffset,
            },
            FILL_GRADIENT_BLANK_DEFAULTS,
            FILL_PATTERN_BLANK_DEFAULTS,
            FILL_IMAGE_BLANK_DEFAULTS
        );
    }

    private getContainerStyles() {
        const { border, cornerRadius, fill, fillOpacity, padding } = this.opts;
        const { stroke, strokeOpacity, strokeWidth, enabled: borderEnabled } = border;
        const isPaddingNumber = typeof padding === 'number';

        return getShapeStyle(
            {
                cornerRadius,
                fill,
                fillOpacity,
                padding: {
                    top: isPaddingNumber ? padding : (padding.top ?? 0),
                    right: isPaddingNumber ? padding : (padding.right ?? 0),
                    bottom: isPaddingNumber ? padding : (padding.bottom ?? 0),
                    left: isPaddingNumber ? padding : (padding.left ?? 0),
                },
                stroke,
                strokeOpacity,
                strokeWidth: borderEnabled ? strokeWidth : 0,
            },
            FILL_GRADIENT_BLANK_DEFAULTS,
            FILL_PATTERN_BLANK_DEFAULTS,
            FILL_IMAGE_BLANK_DEFAULTS
        );
    }

    private computePagedBBox(): BBox {
        // Get BBox without group transforms applied.
        const actualBBox = Group.computeChildrenBBox(this.group.excludeChildren({ name: 'legend-container' }));
        if (this.pages.length > 1) {
            const [maxPageWidth, maxPageHeight] = this.maxPageSize;
            actualBBox.height = Math.max(maxPageHeight, actualBBox.height);
            actualBBox.width = Math.max(maxPageWidth, actualBBox.width);
        }
        const { strokeWidth, padding } = this.getContainerStyles();
        actualBBox.grow(padding).grow(strokeWidth);
        return actualBBox;
    }

    private findNode(params: AgChartLegendContextMenuEvent): {
        datum: CategoryLegendDatum;
        proxyButton: SwitchWidget;
    } {
        const { datum, proxyButton } =
            this.itemSelection.select((ml: Node<any>): ml is LegendMarkerLabel => {
                return ml.datum?.itemId === params.itemId;
            })[0] ?? {};
        if (datum === undefined || proxyButton === undefined) {
            throw new Error(
                `AG Charts - Missing required properties { datum: ${JSON.stringify(datum)}, proxyButton: ${JSON.stringify(proxyButton)} }`
            );
        }
        return { datum, proxyButton };
    }

    private contextToggleVisibility(params: AgChartLegendContextMenuEvent) {
        const { datum, proxyButton } = this.findNode(params);
        this.doClick(params.event, datum, proxyButton);
        this.clearHighlight();
    }

    private contextToggleOtherSeries(params: AgChartLegendContextMenuEvent) {
        this.doDoubleClick(params.event, this.findNode(params).datum);
        this.clearHighlight();
    }

    onContextClick(widgetEvent: MouseWidgetEvent<'contextmenu'>, node: LegendMarkerLabel) {
        if (this.checkInteractionState()) return;
        const { sourceEvent } = widgetEvent;
        const legendItem: CategoryLegendDatum = node.unsafeNonNullDatum;

        this.clearHighlight();

        const registryItems = this.ctx.contextMenuRegistry?.builtins.items;
        if (registryItems) {
            registryItems['toggle-series-visibility'].enabled = !(
                this.opts.preventHidingAll &&
                this.contextMenuDatum?.enabled &&
                this.getVisibleItemCount() <= 1
            );
        }

        const toggleOtherSeriesVisible =
            this.ctx.chartService.series.length > 1 &&
            this.ctx.chartService.series[0]?.getLegendData('category')[0]?.hideToggleOtherSeries !== true;
        const action = toggleOtherSeriesVisible ? 'show' : 'hide';
        this.ctx.contextMenuRegistry?.toggle('toggle-other-series', action);

        const { offsetX, offsetY } = sourceEvent;
        const { x: canvasX, y: canvasY } = Transformable.toCanvasPoint(node, offsetX, offsetY);
        this.ctx.contextMenuRegistry?.dispatchContext('legend-item', { widgetEvent, canvasX, canvasY }, { legendItem });
    }

    onClick(event: Event, datum: CategoryLegendDatum, proxyButton: SwitchWidget) {
        if (this.doClick(event, datum, proxyButton)) {
            event.preventDefault();
        }
    }

    private getVisibleItemCount(): number {
        return this.ctx.chartService.series.flatMap((s) => s.getLegendData('category')).filter((d) => d.enabled).length;
    }

    private doClick(event: Event, datum: CategoryLegendDatum, proxyButton: SwitchWidget): boolean {
        const {
            opts: {
                listeners: { legendItemClick },
                preventHidingAll,
                toggleSeries,
            },
            ctx: { chartService },
        } = this;

        if (!datum) {
            return false;
        }

        const { legendType, seriesId, itemId, enabled, legendItemName } = datum;
        const series = chartService.series.find((s) => s.id === seriesId);
        if (!series) {
            return false;
        }

        let newEnabled = enabled;
        const clickEvent = makeLegendItemEvent('click', datum, event);
        if (legendItemClick) {
            callWithContext([series.properties, this.ctx.chartService], legendItemClick, clickEvent.apiEvent);
        }

        if (clickEvent.defaultPrevented) return true;

        if (toggleSeries) {
            newEnabled = !enabled;

            if (preventHidingAll && !newEnabled) {
                const numVisibleItems = this.getVisibleItemCount();
                if (numVisibleItems < 2) {
                    newEnabled = true;
                }
            }

            proxyButton.setChecked(newEnabled);
            this.ctx.eventsHub.emit('legend:item-click', {
                legendType,
                series,
                itemId,
                enabled: newEnabled,
                legendItemName,
            });
        }

        this.updateHighlight(newEnabled, datum, series);

        this.ctx.eventsHub.emit('chart:request-update', {
            type: ChartUpdateType.PROCESS_DATA,
            opts: { forceNodeDataRefresh: true, skipAnimations: datum.skipAnimations ?? false },
        });

        return true;
    }

    onDoubleClick(event: Event, datum: CategoryLegendDatum) {
        if (this.doDoubleClick(event, datum)) {
            event.preventDefault();
        }
    }

    private doDoubleClick(event: Event, datum: CategoryLegendDatum | undefined): boolean {
        const {
            opts: {
                listeners: { legendItemDoubleClick },
                toggleSeries,
            },
            ctx: { chartService },
        } = this;

        if (!datum) {
            return false;
        }

        const { legendType, id, itemId, seriesId } = datum;
        const series = chartService.series.find((s) => s.id === id);
        if (!series) {
            return false;
        }

        const doubleClickEvent = makeLegendItemEvent('dblclick', datum, event);
        if (legendItemDoubleClick) {
            callWithContext(
                [series.properties, this.ctx.chartService],
                legendItemDoubleClick,
                doubleClickEvent.apiEvent
            );
        }

        if (doubleClickEvent.defaultPrevented) return true;

        if (toggleSeries) {
            const legendData = chartService.series.flatMap((s) => s.getLegendData('category'));

            // Get the number of visible items but only count each legend item name once
            let numVisibleItems = 0;
            const visibleLegendItemNames = new Set<string>();
            for (const d of legendData) {
                if (!d.enabled) continue;
                numVisibleItems += 1;
                if (d.legendItemName != null) {
                    visibleLegendItemNames.add(d.legendItemName);
                }
            }
            if (visibleLegendItemNames.size > 0) {
                numVisibleItems = visibleLegendItemNames.size;
            }

            const clickedItem = legendData.find((d) => d.itemId === itemId && d.seriesId === seriesId);

            this.ctx.eventsHub.emit('legend:item-double-click', {
                legendType,
                series,
                itemId,
                numVisibleItems,
                enabled: clickedItem?.enabled ?? false,
                legendItemName: clickedItem?.legendItemName,
            });
        }

        this.ctx.eventsHub.emit('chart:request-update', {
            type: ChartUpdateType.PROCESS_DATA,
            opts: { forceNodeDataRefresh: true },
        });

        return true;
    }

    private toTooltipMeta(event: FocusEvent | MouseEvent, node: LegendMarkerLabel): TooltipMeta {
        let point: { x: number; y: number };
        if (event instanceof FocusEvent) {
            point = Transformable.toCanvas(node).computeCenter();
        } else {
            event.preventDefault();
            point = Transformable.toCanvasPoint(node, event.offsetX, event.offsetY);
        }

        return { canvasX: point.x, canvasY: point.y, showArrow: false };
    }

    private getTooltipContent(datum: CategoryLegendDatum): TooltipContent[] | undefined {
        const tooltipOpts = this.opts.item.tooltip;
        const isTruncated = this.truncatedItems.has(datum.itemId ?? datum.id);

        // Resolve effective visibility: default is 'always' when custom content provided, else 'auto'
        const hasCustomContent = tooltipOpts?.text != null || tooltipOpts?.renderer != null;
        const visible = tooltipOpts?.visible ?? (hasCustomContent ? 'always' : 'auto');

        if (visible === 'never') return undefined;
        if (visible === 'auto' && !isTruncated) return undefined;

        // Content precedence: renderer > text > default label.
        // A renderer returning '' suppresses the tooltip; returning undefined falls through to text/label.
        if (tooltipOpts?.renderer) {
            const params = {
                seriesId: datum.seriesId,
                itemId: datum.itemId ?? datum.id,
                text: toPlainText(datum.label.text),
                visible: datum.enabled,
            };
            const result = this.cachedCallWithContext(tooltipOpts.renderer, params);
            if (result === '') return undefined;
            if (result != null) return [{ type: 'raw', rawHtmlString: toTextString(result) }];
        }

        if (tooltipOpts?.text != null) {
            return [{ type: 'structured', title: tooltipOpts.text }];
        }

        return [{ type: 'structured', title: this.getItemLabel(datum) }];
    }

    onHover(event: FocusEvent | MouseEvent, node: LegendMarkerLabel, fromKeyboardFocus = false) {
        if (this.checkInteractionState()) return;
        if (!this.opts.enabled) throw new Error('AG Charts - onHover handler called on disabled legend');

        this.pagination.setPage(node.pageIndex);

        const datum: CategoryLegendDatum | undefined = node.datum;
        const series = datum ? this.ctx.chartService.series.find((s) => s.id === datum?.id) : undefined;

        const content = datum ? this.getTooltipContent(datum) : undefined;
        if (content) {
            const meta = this.toTooltipMeta(event, node);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, content);
        } else {
            this.ctx.tooltipManager.removeTooltip(this.id, undefined, true);
        }

        this.updateHighlight(datum?.enabled, datum, series, undefined, fromKeyboardFocus);
        this.ctx.eventsHub.emit('legend:item-hover', null);
    }

    onLeave(fromKeyboardFocus = false) {
        if (this.checkInteractionState()) return;
        this.ctx.tooltipManager.removeTooltip(this.id, undefined, true); // true = delayed
        this.clearHighlight(fromKeyboardFocus);
    }

    private clearHighlight(fromKeyboardFocus = false): void {
        this.updateHighlight(undefined, undefined, undefined, undefined, fromKeyboardFocus);
    }

    private updateHighlight(
        enabled: boolean | undefined,
        legendDatum: CategoryLegendDatum | undefined,
        series: SeriesType | undefined,
        event?: ActiveLoadMementoEvent,
        fromKeyboardFocus = false
    ): void {
        if (this.checkInteractionState()) return;
        type InternalUpdateOpts = {
            readonly itemId: NonNullable<CategoryLegendDatum['itemId']>;
            readonly nodeDatum: HighlightNodeDatum;
        };

        const updateActive = (opts: InternalUpdateOpts | undefined): boolean => {
            if (opts === undefined) {
                return this.ctx.activeManager.clear();
            } else {
                const seriesId = opts.nodeDatum.series.id;
                const itemId = opts.itemId;
                return this.ctx.activeManager.update({ type: 'legend', seriesId, itemId }, undefined);
            }
        };

        const updateManagers = (opts: InternalUpdateOpts | undefined): void => {
            const defaultPrevented: boolean = updateActive(opts);
            if (!defaultPrevented) {
                this.ctx.highlightManager.updateHighlight(this.id, opts?.nodeDatum);
            }
        };

        const highlightNodeDatum = (opts: InternalUpdateOpts | undefined): void => {
            // Any update supersedes earlier ones; a deferred update queued for batch-stop must
            // not run if a later update (immediate or deferred) has since taken its place.
            const token = ++this.highlightUpdateToken;
            if (this.ctx.interactionManager.isState(InteractionState.Default) || event?.initialState) {
                updateManagers(opts);
            } else if (this.ctx.interactionManager.isState(InteractionState.Animation)) {
                // A keyboard focus change is a deliberate navigation that must take effect immediately,
                // interrupting any in-progress animation. Pointer hover, by contrast, defers both setting
                // and clearing highlights until the current animation batch completes so that a passing
                // hover does not interrupt a show/hide animation.
                if (fromKeyboardFocus) {
                    updateManagers(opts);
                } else {
                    this.ctx.animationManager.onBatchStop(() => {
                        if (token === this.highlightUpdateToken) {
                            updateManagers(opts);
                        }
                    });
                }
            } else if (opts === undefined) {
                updateManagers(opts);
            }
        };

        const hasHighlightTarget = enabled === true && series !== undefined && legendDatum !== undefined;
        const legendItemSuppressesHighlight = legendDatum?.suppressHighlight === true;

        if (hasHighlightTarget && !legendItemSuppressesHighlight) {
            const itemId = legendDatum.itemId;
            const nodeDatum = toHighlightNodeDatum(series, legendDatum);
            highlightNodeDatum({ itemId, nodeDatum });
        } else {
            // Either no highlightable target, or the current legend item opts out
            // (e.g. a discrete colour-scale bin whose itemId is a bin index, not a
            // datum index). Push an undefined highlight so any prior highlight under
            // this caller id is cleared on hover transition.
            highlightNodeDatum(undefined);
        }
    }

    private onActiveLoadMemento(event: ActiveLoadMementoEvent): void {
        const { activeItem } = event;
        if (activeItem?.type !== 'legend') {
            return this.ctx.highlightManager.updateHighlight(this.id);
        }

        const datum = this.data.find((d) => d.seriesId === activeItem.seriesId && d.itemId === activeItem.itemId);
        const series = this.ctx.chartService.series.find((s) => s.id === activeItem.seriesId);
        if (series === undefined) {
            Logger.warn(`Cannot find seriesId: "${activeItem.seriesId}"`);
            event.reject();
        } else if (datum === undefined) {
            const json = JSON.stringify({ seriesId: activeItem.seriesId, itemId: activeItem.itemId });
            Logger.warn(`cannot find legend item: ${json}`);
            event.reject();
        } else {
            this.updateHighlight(datum.enabled, datum, series, event);
        }
    }

    private onLocaleChanged() {
        this.updateItemSelection();
        this.domProxy.onLocaleChanged(this.itemSelection, this);
    }

    private positionLegend(ctx: LayoutContext) {
        if (this.opts == null) return;
        const oldPages = this.positionLegendScene(ctx);
        this.positionLegendDOM(oldPages);
    }
    private positionLegendScene(ctx: LayoutContext) {
        const { enabled, position, spacing } = this.opts;
        if (!enabled || !this.data.length) return;

        const { placement, floating, xOffset, yOffset } = expandLegendPosition(position);
        // When legend in floating, the X/Y translation is relative to the entire canvas & layoutBox doesn't shrink
        const layoutBox = floating ? new BBox(0, 0, ctx.width, ctx.height) : ctx.layoutBox;
        const { x, y, width, height } = layoutBox;
        const [legendWidth, legendHeight] = this.calculateLegendDimensions(layoutBox);

        const { oldPages } = this.calcLayout(legendWidth, legendHeight);
        const legendBBox = this.computePagedBBox();

        if (this.visible) {
            function unreachable(_a: never): never {
                return undefined as never;
            }

            let translationX: number;
            let translationY: number;
            switch (placement) {
                case 'top':
                    translationX = (width - legendBBox.width) / 2;
                    translationY = 0;
                    break;
                case 'bottom':
                    translationX = (width - legendBBox.width) / 2;
                    translationY = height - legendBBox.height;
                    break;
                case 'right':
                    translationX = width - legendBBox.width;
                    translationY = (height - legendBBox.height) / 2;
                    break;
                case 'left':
                    translationX = 0;
                    translationY = (height - legendBBox.height) / 2;
                    break;
                case 'top-right':
                case 'right-top':
                    translationX = width - legendBBox.width;
                    translationY = 0;
                    break;
                case 'top-left':
                case 'left-top':
                    translationX = 0;
                    translationY = 0;
                    break;
                case 'bottom-right':
                case 'right-bottom':
                    translationX = width - legendBBox.width;
                    translationY = height - legendBBox.height;
                    break;
                case 'bottom-left':
                case 'left-bottom':
                    translationX = 0;
                    translationY = height - legendBBox.height;
                    break;
                default:
                    unreachable(placement);
            }

            if (!floating) {
                let shrinkAmount: number;
                let shrinkDirection: NonNullable<Parameters<BBox['shrink']>[1]>;
                switch (placement) {
                    case 'top':
                    case 'top-right':
                    case 'top-left':
                        shrinkAmount = legendBBox.height + spacing;
                        shrinkDirection = 'top';
                        break;
                    case 'bottom':
                    case 'bottom-right':
                    case 'bottom-left':
                        shrinkAmount = legendBBox.height + spacing;
                        shrinkDirection = 'bottom';
                        break;
                    case 'left':
                    case 'left-top':
                    case 'left-bottom':
                        shrinkAmount = legendBBox.width + spacing;
                        shrinkDirection = 'left';
                        break;
                    case 'right':
                    case 'right-top':
                    case 'right-bottom':
                        shrinkAmount = legendBBox.width + spacing;
                        shrinkDirection = 'right';
                        break;
                    default:
                        unreachable(placement);
                }
                layoutBox.shrink(shrinkAmount, shrinkDirection);
            }

            translationX += xOffset;
            translationY += yOffset;

            // Round off for pixel grid alignment to work properly.
            this.group.translationX = Math.floor(x + translationX - legendBBox.x);
            this.group.translationY = Math.floor(y + translationY - legendBBox.y);

            this.containerNode.x = legendBBox.x;
            this.containerNode.y = legendBBox.y;
            this.containerNode.width = legendBBox.width;
            this.containerNode.height = legendBBox.height;
        }
        return oldPages;
    }
    private positionLegendDOM(oldPages: Page[] | undefined) {
        const { ctx, itemSelection, pagination, pages: newPages, group } = this;
        const visible = this.visible && this.opts.enabled;
        const interactive = this.isInteractive();
        this.domProxy.update({
            visible,
            interactive,
            contextMenuAvailable: this.hasEnabledContextMenu(),
            ctx,
            itemSelection,
            group,
            pagination,
            oldPages,
            newPages,
            datumReader: this,
            itemListener: this,
        });
    }

    private calculateLegendDimensions(shrinkRect: BBox): [number, number] {
        const { width, height } = shrinkRect;
        const { maxWidth, maxHeight, position } = this.opts;
        const { placement } = expandLegendPosition(position);

        const aspectRatio = width / height;
        const maxCoefficient = 0.5;
        const minHeightCoefficient = 0.2;
        const minWidthCoefficient = 0.25;

        let legendWidth, legendHeight;

        function unreachable(_a: never): never {
            return undefined as never;
        }
        switch (placement) {
            case 'top':
            case 'top-left':
            case 'top-right':
            case 'bottom':
            case 'bottom-left':
            case 'bottom-right': {
                // A horizontal legend should take maximum between 20 and 50 percent of the chart height if height is larger than width
                // and maximum 20 percent of the chart height if height is smaller than width.
                const heightCoefficient =
                    aspectRatio < 1
                        ? Math.min(maxCoefficient, minHeightCoefficient * (1 / aspectRatio))
                        : minHeightCoefficient;
                legendWidth = maxWidth ? Math.min(maxWidth, width) : width;
                legendHeight = maxHeight ? Math.min(maxHeight, height) : Math.round(height * heightCoefficient);
                break;
            }

            case 'left':
            case 'left-top':
            case 'left-bottom':
            case 'right':
            case 'right-top':
            case 'right-bottom': {
                // A vertical legend should take maximum between 25 and 50 percent of the chart width if width is larger than height
                // and maximum 25 percent of the chart width if width is smaller than height.
                const widthCoefficient =
                    aspectRatio > 1 ? Math.min(maxCoefficient, minWidthCoefficient * aspectRatio) : minWidthCoefficient;
                legendWidth = maxWidth ? Math.min(maxWidth, width) : Math.round(width * widthCoefficient);
                legendHeight = maxHeight ? Math.min(maxHeight, height) : height;
                break;
            }
            default:
                unreachable(placement);
        }

        return [legendWidth, legendHeight];
    }

    private cachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined {
        const { callbackCache, chartService, chartState } = this.ctx;
        const caller = { context: chartState.getValue('options', 'context') };
        return callbackCache.call([caller, chartService], fn, params);
    }
}
