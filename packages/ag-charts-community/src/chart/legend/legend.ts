import {
    BaseProperties,
    Border,
    type Callback,
    type CallbackParam,
    ChartUpdateType,
    CleanupRegistry,
    FONT_SIZE,
    type ITextMeasurer,
    LineSplitter,
    Logger,
    ObserveChanges,
    Property,
    type RequiredInternalAgGradientColor,
    type RequiredInternalAgImageFill,
    type RequiredInternalAgPatternColor,
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
    truncateLine,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgChartLegendClickEvent,
    AgChartLegendContextMenuEvent,
    AgChartLegendDoubleClickEvent,
    AgChartLegendLabelFormatterParams,
    AgChartLegendListeners,
    AgChartLegendOrientation,
    AgChartLegendPosition,
    AgMarkerShape,
    AgMarkerShapeFn,
    FontStyle,
    FontWeight,
    Formatter,
    Padding,
    PixelSize,
} from 'ag-charts-types';

import type {
    ActiveLoadMementoEvent,
    HighlightNodeDatum,
    LegendChangeEvent,
    LegendChangePartialEvent,
} from '../../core/eventsHub';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { Group, TranslatableGroup } from '../../scene/group';
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
                datumIndex: undefined,
                legendItemName: legendDatum.legendItemName,
            };
        default:
            return legendDatum.itemId satisfies never;
    }
}

class LegendLabel extends BaseProperties {
    @Property
    maxLength?: number = undefined;

    @Property
    color: string = 'black';

    @Property
    fontStyle?: FontStyle = undefined;

    @Property
    fontWeight?: FontWeight = undefined;

    @Property
    fontSize: number = FONT_SIZE.SMALL;

    @Property
    fontFamily: string = 'Verdana, sans-serif';

    @Property
    formatter?: Formatter<AgChartLegendLabelFormatterParams>;
}

class LegendMarker extends BaseProperties {
    /**
     * If the marker type is set, the legend will always use that marker type for all its items,
     * regardless of the type that comes from the `data`.
     */
    @Property
    shape?: AgMarkerShape = undefined;

    @Property
    size = 15;

    /**
     * Padding between the marker and the label within each legend item.
     */
    @Property
    padding: number = 8;

    @Property
    strokeWidth?: number;

    @Property
    enabled?: boolean;
}

class LegendLine extends BaseProperties {
    @Property
    strokeWidth?: number;

    @Property
    length?: number;
}

class LegendItem extends BaseProperties {
    /** Used to constrain the width of legend items. */
    @Property
    maxWidth?: number;
    /**
     * The legend uses grid layout for its items, occupying as few columns as possible when positioned to left or right,
     * and as few rows as possible when positioned to top or bottom. This config specifies the amount of horizontal
     * padding between legend items.
     */
    @Property
    paddingX: number = 16;
    /**
     * The legend uses grid layout for its items, occupying as few columns as possible when positioned to left or right,
     * and as few rows as possible when positioned to top or bottom. This config specifies the amount of vertical
     * padding between legend items.
     */
    @Property
    paddingY: number = 8;

    @Property
    showSeriesStroke: boolean = false;

    @Property
    readonly marker = new LegendMarker();

    @Property
    readonly label = new LegendLabel();

    @Property
    readonly line = new LegendLine();
}

class LegendListeners extends BaseProperties implements AgChartLegendListeners {
    @Property
    legendItemClick?: (event: AgChartLegendClickEvent) => void;

    @Property
    legendItemDoubleClick?: (event: AgChartLegendDoubleClickEvent) => void;
}

const fillGradientDefaults: RequiredInternalAgGradientColor = {
    type: 'gradient',
    bounds: 'item',
    gradient: 'linear',
    colorStops: [{ color: 'black' }],
    rotation: 0,
    reverse: false,
    colorSpace: 'rgb',
};

const fillPatternDefaults: RequiredInternalAgPatternColor = {
    type: 'pattern',
    pattern: 'forward-slanted-lines',
    width: 8,
    height: 8,
    padding: 1,
    fill: 'black',
    fillOpacity: 1,
    backgroundFill: 'white',
    backgroundFillOpacity: 1,
    stroke: 'black',
    strokeOpacity: 1,
    strokeWidth: 1,
    rotation: 0,
    scale: 1,
};

const fillImageDefaults: RequiredInternalAgImageFill = {
    type: 'image',
    backgroundFill: 'black',
    backgroundFillOpacity: 1,
    rotation: 0,
    repeat: 'no-repeat',
    fit: 'contain',
    width: 8,
    height: 8,
};

export class Legend extends BaseProperties {
    static readonly className = 'Legend';

    readonly id = createId(this);

    private readonly group = new TranslatableGroup({ name: 'legend', zIndex: ZIndexMap.LEGEND });

    private readonly itemSelection: Selection<LegendMarkerLabel, CategoryLegendDatum> = Selection.select(
        this.group,
        LegendMarkerLabel
    );
    private readonly containerNode = this.group.appendChild(new Rect({ name: 'legend-container' }));

    private readonly oldSize: [number, number] = [0, 0];
    private pages: Page[] = [];
    private maxPageSize: [number, number] = [0, 0];
    /** Item index to track on re-pagination, so current page updates appropriately. */
    private paginationTrackingIndex: number = 0;

    private readonly truncatedItems: Set<string | number> = new Set();

    private _data: CategoryLegendDatum[] = [];
    set data(value: CategoryLegendDatum[]) {
        if (objectsEqual(value, this._data)) return;
        this.domProxy.onDataUpdate(this._data, value);
        this._data = value;
        this.updateGroupVisibility();
    }
    get data() {
        return this._data;
    }

    private readonly contextMenuDatum?: CategoryLegendDatum;

    context!: never;

    @Property
    toggleSeries: boolean = true;

    @Property
    readonly pagination: Pagination;

    @Property
    readonly item = new LegendItem();

    @Property
    readonly listeners = new LegendListeners();

    @ObserveChanges<Legend>((target, newValue?: boolean, oldValue?: boolean) => {
        target.updateGroupVisibility();

        if (newValue === oldValue) {
            return;
        }

        const {
            ctx: { legendManager, stateManager },
        } = target;

        if (oldValue === false && newValue === true) {
            stateManager.restoreState(legendManager);
        }
    })
    @Property
    enabled: boolean = false;

    @Property
    position: AgChartLegendPosition = 'bottom';

    /** Used to constrain the width of the legend. */
    @Property
    maxWidth?: number;

    /** Used to constrain the height of the legend. */
    @Property
    maxHeight?: number;

    /** Reverse the display order of legend items if `true`. */
    @Property
    reverseOrder?: boolean;

    @Property
    orientation?: AgChartLegendOrientation;

    @Property
    preventHidingAll?: boolean;

    @Property
    border = new Border(this.containerNode);

    @Property
    cornerRadius: number = 0;

    @Property
    fill?: string;

    @Property
    fillOpacity: number = 1;

    @Property
    padding: Padding = 4;

    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    @Property
    spacing: PixelSize = 0; // Default derived from chart theme practically.

    @Property
    xOffset?: PixelSize;

    @Property
    yOffset?: PixelSize;

    private readonly cleanup = new CleanupRegistry();

    private readonly domProxy: LegendDOMProxy;

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.pagination = new Pagination(
            (type: ChartUpdateType) => ctx.updateService.update(type),
            (page) => this.updatePageNumber(page)
        );
        this.pagination.attachPagination(this.group);

        const { items } = ctx.contextMenuRegistry.builtins;
        items['toggle-series-visibility'].action = (params) => this.contextToggleVisibility(params);
        items['toggle-other-series'].action = (params) => this.contextToggleOtherSeries(params);
        this.cleanup.register(
            ctx.eventsHub.on('active:load-memento', (event) => this.onActiveLoadMemento(event)),
            ctx.eventsHub.on('active:update', (event) => this.onActiveUpdate(event)),
            ctx.eventsHub.on('legend:change', this.onLegendDataChange.bind(this)),
            ctx.eventsHub.on('legend:change-partial', this.onLegendDataChangePartial.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.Legend, (e) => this.positionLegend(e)),
            ctx.eventsHub.on('locale:change', () => this.onLocaleChanged()),
            () => delete items['toggle-series-visibility'].action,
            () => delete items['toggle-other-series'].action,
            () => this.group.remove()
        );

        this.domProxy = new LegendDOMProxy(this.ctx, this.id);

        this.ctx.historyManager.addMementoOriginator(ctx.legendManager);
    }

    private onLegendDataChange({ legendData = [] }: LegendChangeEvent) {
        if (!this.enabled) return;
        this.data = legendData.filter((datum) => !datum.hideInLegend);
    }

    private onLegendDataChangePartial(event: LegendChangePartialEvent) {
        this.itemSelection.each(({ proxyButton }, { itemId }) => {
            if (proxyButton == null) return;
            for (const eventElem of event.legendData) {
                if (eventElem.itemId === itemId) {
                    proxyButton.setChecked(eventElem.enabled);
                }
            }
        });
    }

    public destroy() {
        this.ctx.domManager.removeChild('canvas-overlay', `${this.id}-toolbar`);
        this.ctx.domManager.removeChild('canvas-overlay', `${this.id}-pagination`);
        this.cleanup.flush();
        this.itemSelection.clear();
    }

    private getOrientation(): AgChartLegendOrientation {
        return this.orientation ?? 'horizontal';
    }

    readonly size: [number, number] = [0, 0];

    private _visible: boolean = true;
    set visible(value: boolean) {
        this._visible = value;
        this.updateGroupVisibility();
    }
    get visible() {
        return this._visible;
    }

    private updateGroupVisibility() {
        this.group.visible = this.enabled && this.visible && this.data.length > 0;
    }

    private updateItemSelection(): void {
        const data = [...this.data];
        if (this.reverseOrder) {
            data.reverse();
        }
        this.itemSelection.update(data);
    }

    private isInteractive(): boolean {
        const {
            toggleSeries,
            listeners: { legendItemClick, legendItemDoubleClick },
        } = this;
        return toggleSeries || legendItemDoubleClick != null || legendItemClick != null;
    }

    private checkInteractionState(): boolean {
        return this.ctx.interactionManager.isState(InteractionState.Frozen);
    }

    attachLegend(scene: Scene) {
        scene.appendChild(this.group);
    }

    getItemLabel(datum: CategoryLegendDatum) {
        const { formatter } = this.item.label;
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
        const {
            paddingX,
            paddingY,
            label,
            maxWidth,
            label: { maxLength = Infinity, fontStyle, fontWeight, fontSize, fontFamily },
        } = this.item;
        this.updateItemSelection();

        // Update properties that affect the size of the legend items and measure them.
        const bboxes: BBox[] = [];

        const measurer = cachedTextMeasurer(label);

        const itemMaxWidthPercentage = 0.8;
        const maxItemWidth = maxWidth ?? width * itemMaxWidthPercentage;

        const { markerWidth, anyLineEnabled } = this.calculateMarkerWidth();

        this.itemSelection.each((markerLabel, datum) => {
            markerLabel.fontStyle = fontStyle;
            markerLabel.fontWeight = fontWeight;
            markerLabel.fontSize = fontSize;
            markerLabel.fontFamily = fontFamily;

            const paddedSymbolWidth = this.updateMarkerLabel(markerLabel, datum, markerWidth, anyLineEnabled);
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
        this.maxPageSize = [maxPageWidth - paddingX, maxPageHeight - paddingY];

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

    private calcSymbolsEnabled(symbol: LegendSymbolOptions) {
        const { showSeriesStroke, marker } = this.item;
        const markerEnabled = !!marker.enabled || !showSeriesStroke || (symbol.marker.enabled ?? true);
        const lineEnabled = !!(symbol.line && showSeriesStroke);
        const isCustomMarker = this.isCustomMarker(markerEnabled, symbol.marker.shape);
        return { markerEnabled, lineEnabled, isCustomMarker };
    }

    private calcSymbolsLengths(symbol: LegendSymbolOptions, markerEnabled: boolean, lineEnabled: boolean) {
        const { marker, line } = this.item;

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
        const lineLength = lineEnabled ? line.length ?? 25 : 0;
        return { markerLength, lineLength, customMarkerSize };
    }

    private calculateMarkerWidth() {
        let markerWidth = 0;
        let anyLineEnabled = false;
        this.itemSelection.each((_, datum) => {
            const { symbol } = datum;

            const { lineEnabled, markerEnabled } = this.calcSymbolsEnabled(symbol);
            const {
                markerLength,
                lineLength,
                customMarkerSize = -Infinity,
            } = this.calcSymbolsLengths(symbol, markerEnabled, lineEnabled);
            markerWidth = Math.max(markerWidth, lineLength, customMarkerSize, markerLength);

            anyLineEnabled ||= lineEnabled;
        });
        return { markerWidth, anyLineEnabled };
    }

    private updateMarkerLabel(
        markerLabel: LegendMarkerLabel,
        datum: CategoryLegendDatum,
        markerWidth: number,
        anyLineEnabled: boolean
    ): number {
        const { marker: itemMarker, paddingX } = this.item;
        const { symbol } = datum;
        let paddedSymbolWidth = paddingX;

        const { markerEnabled, isCustomMarker } = this.calcSymbolsEnabled(symbol);

        const spacing = itemMarker.padding;

        if (markerEnabled || anyLineEnabled) {
            paddedSymbolWidth += spacing + markerWidth;
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
        markerLabel.spacing = spacing;
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
        const orientation = this.getOrientation();
        const trackingIndex = Math.min(this.paginationTrackingIndex, bboxes.length);

        this.pagination.orientation = orientation;

        this.pagination.translationX = 0;
        this.pagination.translationY = 0;

        const { pages, maxPageHeight, maxPageWidth, paginationBBox, paginationVertical } = this.calculatePagination(
            bboxes,
            width,
            height
        );

        const newCurrentPage = pages.findIndex((p) => p.endIndex >= trackingIndex);
        this.pagination.currentPage = clamp(0, newCurrentPage, pages.length - 1);

        const { paddingX: itemPaddingX, paddingY: itemPaddingY } = this.item;
        const paginationComponentPadding = 8;
        const legendItemsWidth = maxPageWidth - itemPaddingX;
        const legendItemsHeight = maxPageHeight - itemPaddingY;

        let paginationX = 0;
        let paginationY = -paginationBBox.y - this.item.marker.size / 2;
        if (paginationVertical) {
            paginationY += legendItemsHeight + paginationComponentPadding;
        } else {
            paginationX += -paginationBBox.x + legendItemsWidth + paginationComponentPadding;
            paginationY += (legendItemsHeight - paginationBBox.height) / 2;
        }

        this.pagination.translationX = paginationX;
        this.pagination.translationY = paginationY;
        this.pagination.update();
        this.pagination.updateMarkers();

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

    private calculatePagination(bboxes: BBox[], width: number, height: number) {
        const { paddingX: itemPaddingX, paddingY: itemPaddingY } = this.item;

        const vertPositions: readonly AgChartLegendPosition[] = [
            'left',
            'left-top',
            'left-bottom',
            'right',
            'right-top',
            'right-bottom',
        ] as const;
        const { placement } = expandLegendPosition(this.position);
        const orientation = this.getOrientation();
        const paginationVertical = vertPositions.includes(placement);

        let paginationBBox: BBox = this.pagination.getBBox();
        let lastPassPaginationBBox: BBox = new BBox(0, 0, 0, 0);
        let pages: Page[] = [];
        let maxPageWidth = 0;
        let maxPageHeight = 0;
        let count = 0;

        const stableOutput = (bbox: BBox) => {
            return bbox.width === paginationBBox.width && bbox.height === paginationBBox.height;
        };

        const forceResult = this.maxWidth !== undefined && this.maxHeight !== undefined;

        do {
            if (count++ > 10) {
                Logger.warn('unable to find stable legend layout.');
                break;
            }

            paginationBBox = lastPassPaginationBBox;
            const maxWidth = width - (paginationVertical ? 0 : paginationBBox.width);
            const maxHeight = height - (paginationVertical ? paginationBBox.height : 0);

            const layout = gridLayout({
                orientation,
                bboxes,
                maxHeight,
                maxWidth,
                itemPaddingY,
                itemPaddingX,
                forceResult,
            });

            pages = layout?.pages ?? [];
            maxPageWidth = layout?.maxPageWidth ?? 0;
            maxPageHeight = layout?.maxPageHeight ?? 0;

            const totalPages = pages.length;
            this.pagination.visible = totalPages > 1;
            this.pagination.totalPages = totalPages;

            this.pagination.update();
            this.pagination.updateMarkers();
            lastPassPaginationBBox = this.pagination.getBBox();

            if (!this.pagination.visible) {
                break;
            }
        } while (!stableOutput(lastPassPaginationBBox));

        return { maxPageWidth, maxPageHeight, pages, paginationBBox: lastPassPaginationBBox, paginationVertical };
    }

    private updatePositions(pageNumber: number = 0) {
        const {
            item: { paddingY },
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
        const horizontal = this.getOrientation() === 'horizontal';

        const itemHeight = columns[0].bboxes[0].height + paddingY;

        const rowSumColumnWidths: number[] = [];

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

            if (!column) {
                return;
            }

            // Round off for pixel grid alignment to work properly.
            y = Math.floor(itemHeight * rowIndex);
            x = Math.floor(rowSumColumnWidths[rowIndex] ?? 0);

            rowSumColumnWidths[rowIndex] = (rowSumColumnWidths[rowIndex] ?? 0) + column.columnWidth;

            markerLabel.translationX = x;
            markerLabel.translationY = y;
        });
    }

    private updatePageNumber(pageNumber: number) {
        const { itemSelection, group, pagination, pages } = this;

        // Track an item on the page in re-pagination cases (e.g. resize).
        const { startIndex, endIndex } = pages[pageNumber];
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

        this.pagination.update();
        this.pagination.updateMarkers();

        this.updatePositions(pageNumber);
        this.domProxy.onPageChange({ itemSelection, group, pagination, interactive: this.isInteractive() });

        this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER);
    }

    update() {
        const {
            label: { color },
        } = this.item;
        this.itemSelection.each((markerLabel, datum) => {
            markerLabel.setEnabled(datum.enabled);
            markerLabel.color = color;
        });

        this.updateContextMenu();
    }

    private updateContextMenu() {
        const action = this.toggleSeries ? 'show' : 'hide';
        this.ctx.contextMenuRegistry.toggle('toggle-series-visibility', action);
        this.ctx.contextMenuRegistry.toggle('toggle-other-series', action);
    }

    private getLineStyles(datum: LegendSymbolOptions) {
        const { stroke, strokeOpacity = 1, strokeWidth, lineDash } = datum.line ?? {};

        const defaultLineStrokeWidth = Math.min(2, strokeWidth ?? 1);

        return {
            stroke,
            strokeOpacity,
            strokeWidth: this.item.line.strokeWidth ?? defaultLineStrokeWidth,
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
                strokeWidth: this.item.marker.strokeWidth ?? defaultLineStrokeWidth,
                lineDash,
                lineDashOffset,
            },
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults
        );
    }

    private getContainerStyles() {
        const { stroke, strokeOpacity, strokeWidth } = this.border;
        const { cornerRadius, fill, fillOpacity, padding } = this;
        const isPaddingNumber = typeof padding === 'number';

        return getShapeStyle(
            {
                cornerRadius,
                fill,
                fillOpacity,
                padding: {
                    top: isPaddingNumber ? padding : padding.top ?? 0,
                    right: isPaddingNumber ? padding : padding.right ?? 0,
                    bottom: isPaddingNumber ? padding : padding.bottom ?? 0,
                    left: isPaddingNumber ? padding : padding.left ?? 0,
                },
                stroke,
                strokeOpacity,
                strokeWidth: this.border.enabled ? strokeWidth : 0,
            },
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults
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
            this.itemSelection.select((ml): ml is LegendMarkerLabel => ml.datum?.itemId === params.itemId)[0] ?? {};
        if (datum === undefined || proxyButton === undefined) {
            throw new Error(
                `AG Charts - Missing required properties { datum: ${datum}, proxyButton: ${JSON.stringify(proxyButton)} }`
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
        const legendItem: CategoryLegendDatum = node.datum;

        this.clearHighlight();

        if (this.preventHidingAll && this.contextMenuDatum?.enabled && this.getVisibleItemCount() <= 1) {
            this.ctx.contextMenuRegistry.builtins.items['toggle-series-visibility'].enabled = false;
        } else {
            this.ctx.contextMenuRegistry.builtins.items['toggle-series-visibility'].enabled = true;
        }

        const toggleOtherSeriesVisible =
            this.ctx.chartService.series.length > 1 &&
            this.ctx.chartService.series[0]?.getLegendData('category')[0]?.hideToggleOtherSeries !== true;
        const action = toggleOtherSeriesVisible ? 'show' : 'hide';
        this.ctx.contextMenuRegistry.toggle('toggle-other-series', action);

        const { offsetX, offsetY } = sourceEvent;
        const { x: canvasX, y: canvasY } = Transformable.toCanvasPoint(node, offsetX, offsetY);
        this.ctx.contextMenuRegistry.dispatchContext('legend-item', { widgetEvent, canvasX, canvasY }, { legendItem });
    }

    onClick(event: Event, datum: CategoryLegendDatum, proxyButton: SwitchWidget) {
        if (this.checkInteractionState()) return;
        if (this.doClick(event, datum, proxyButton)) {
            event.preventDefault();
        }
    }

    private getVisibleItemCount(): number {
        return this.ctx.chartService.series.flatMap((s) => s.getLegendData('category')).filter((d) => d.enabled).length;
    }

    private doClick(event: Event, datum: CategoryLegendDatum, proxyButton: SwitchWidget): boolean {
        const {
            listeners: { legendItemClick },
            ctx: { chartService },
            preventHidingAll,
            toggleSeries,
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

        this.ctx.legendManager.update();
        this.ctx.updateService.update(ChartUpdateType.PROCESS_DATA, {
            forceNodeDataRefresh: true,
            skipAnimations: datum.skipAnimations ?? false,
        });

        return true;
    }

    onDoubleClick(event: Event, datum: CategoryLegendDatum) {
        if (this.checkInteractionState()) return;
        if (this.doDoubleClick(event, datum)) {
            event.preventDefault();
        }
    }

    private doDoubleClick(event: Event, datum: CategoryLegendDatum | undefined): boolean {
        const {
            listeners: { legendItemDoubleClick },
            ctx: { chartService },
            toggleSeries,
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

        this.ctx.legendManager.update();
        this.ctx.updateService.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true });

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

    onHover(event: FocusEvent | MouseEvent, node: LegendMarkerLabel) {
        if (this.checkInteractionState()) return;
        if (!this.enabled) throw new Error('AG Charts - onHover handler called on disabled legend');

        this.pagination.setPage(node.pageIndex);

        const datum: CategoryLegendDatum | undefined = node.datum;
        const series = datum ? this.ctx.chartService.series.find((s) => s.id === datum?.id) : undefined;
        if (datum && this.truncatedItems.has(datum.itemId ?? datum.id)) {
            const meta = this.toTooltipMeta(event, node);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, [
                { type: 'structured', title: this.getItemLabel(datum) },
            ]);
        } else {
            this.ctx.tooltipManager.removeTooltip(this.id, undefined, true); // true = delayed
        }

        this.updateHighlight(datum?.enabled, datum, series);
    }

    onLeave() {
        if (this.checkInteractionState()) return;
        this.ctx.tooltipManager.removeTooltip(this.id, undefined, true); // true = delayed
        this.clearHighlight();
    }

    private clearHighlight(): void {
        this.updateHighlight(undefined, undefined, undefined);
    }

    private updateHighlight(
        enabled: boolean | undefined,
        legendDatum: CategoryLegendDatum | undefined,
        series: SeriesType | undefined,
        event?: ActiveLoadMementoEvent
    ): void {
        type InternalUpdateOpts = {
            readonly itemId: NonNullable<CategoryLegendDatum['itemId']>;
            readonly nodeDatum: HighlightNodeDatum;
        };

        const updateManagers = (opts: InternalUpdateOpts | undefined): void => {
            if (opts === undefined) {
                this.ctx.activeManager.clear();
            } else {
                const seriesId = opts.nodeDatum.series.id;
                const itemId = opts.itemId;
                this.ctx.activeManager.update({ type: 'legend', seriesId, itemId }, undefined);
            }
            this.ctx.highlightManager.updateHighlight(this.id, opts?.nodeDatum);
        };

        const highlightNodeDatum = (opts: InternalUpdateOpts | undefined): void => {
            if (this.ctx.interactionManager.isState(InteractionState.Default) || event?.initialState) {
                updateManagers(opts);
            } else if (this.ctx.interactionManager.isState(InteractionState.Animation)) {
                // Updating the highlight can interrupt animations, so defer both setting and
                // clearing highlights until the current animation batch completes.
                this.ctx.animationManager.onBatchStop(() => {
                    updateManagers(opts);
                });
            } else if (opts === undefined) {
                updateManagers(opts);
            }
        };

        if (enabled === true && series !== undefined && legendDatum !== undefined) {
            const itemId = legendDatum.itemId;
            const nodeDatum = toHighlightNodeDatum(series, legendDatum);
            highlightNodeDatum({ itemId, nodeDatum });
        } else {
            highlightNodeDatum(undefined);
        }
    }

    private onActiveUpdate(activeItem: AgActiveItemState | undefined): void {
        if (activeItem?.type === 'series-node') {
            this.ctx.highlightManager.updateHighlight(this.id, undefined);
        }
    }

    private onActiveLoadMemento(event: ActiveLoadMementoEvent): void {
        const { activeItem } = event;
        if (activeItem?.type !== 'legend') {
            return this.ctx.highlightManager.updateHighlight(this.id, undefined);
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
        this.domProxy.onLocaleChanged(this.ctx.localeManager, this.itemSelection, this);
    }

    private positionLegend(ctx: LayoutContext) {
        const oldPages = this.positionLegendScene(ctx);
        this.positionLegendDOM(oldPages);
    }
    private positionLegendScene(ctx: LayoutContext) {
        if (!this.enabled || !this.data.length) return;

        const { placement, floating, xOffset, yOffset } = expandLegendPosition(this.position);
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

            const legendSpacing = this.spacing;

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
                        shrinkAmount = legendBBox.height + legendSpacing;
                        shrinkDirection = 'top';
                        break;
                    case 'bottom':
                    case 'bottom-right':
                    case 'bottom-left':
                        shrinkAmount = legendBBox.height + legendSpacing;
                        shrinkDirection = 'bottom';
                        break;
                    case 'left':
                    case 'left-top':
                    case 'left-bottom':
                        shrinkAmount = legendBBox.width + legendSpacing;
                        shrinkDirection = 'left';
                        break;
                    case 'right':
                    case 'right-top':
                    case 'right-bottom':
                        shrinkAmount = legendBBox.width + legendSpacing;
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
        const visible = this.visible && this.enabled;
        const interactive = this.isInteractive();
        this.domProxy.update({
            visible,
            interactive,
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
        const { placement } = expandLegendPosition(this.position);

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
                legendWidth = this.maxWidth ? Math.min(this.maxWidth, width) : width;
                legendHeight = this.maxHeight
                    ? Math.min(this.maxHeight, height)
                    : Math.round(height * heightCoefficient);
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
                legendWidth = this.maxWidth ? Math.min(this.maxWidth, width) : Math.round(width * widthCoefficient);
                legendHeight = this.maxHeight ? Math.min(this.maxHeight, height) : height;
                break;
            }
            default:
                unreachable(placement);
        }

        return [legendWidth, legendHeight];
    }

    private cachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined {
        const { callbackCache, chartService } = this.ctx;
        return callbackCache.call([this, chartService], fn, params);
    }
}
