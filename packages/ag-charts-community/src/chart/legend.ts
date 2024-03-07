import type { ModuleContext } from '../module/moduleContext';
import type {
    AgChartLegendClickEvent,
    AgChartLegendDoubleClickEvent,
    AgChartLegendLabelFormatterParams,
    AgChartLegendListeners,
    AgChartLegendOrientation,
    AgChartLegendPosition,
    FontStyle,
    FontWeight,
} from '../options/agChartOptions';
import { BBox } from '../scene/bbox';
import { Group } from '../scene/group';
import { RedrawType } from '../scene/node';
import type { Scene } from '../scene/scene';
import { Selection } from '../scene/selection';
import { Text, getFont } from '../scene/shape/text';
import { createId } from '../util/id';
import { Logger } from '../util/logger';
import { clamp } from '../util/number';
import { BaseProperties } from '../util/properties';
import { ObserveChanges } from '../util/proxy';
import {
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    FUNCTION,
    OBJECT,
    POSITION,
    POSITIVE_NUMBER,
    STRING,
    UNION,
    Validate,
} from '../util/validation';
import { ChartUpdateType } from './chartUpdateType';
import type { Page } from './gridLayout';
import { gridLayout } from './gridLayout';
import { InteractionEvent, InteractionState } from './interaction/interactionManager';
import { Layers } from './layers';
import type { CategoryLegendDatum } from './legendDatum';
import type { Marker } from './marker/marker';
import { getMarker } from './marker/util';
import { MarkerLabel } from './markerLabel';
import { Pagination } from './pagination/pagination';
import { toTooltipHtml } from './tooltip/tooltip';

class LegendLabel extends BaseProperties {
    @Validate(POSITIVE_NUMBER, { optional: true })
    maxLength?: number = undefined;

    @Validate(COLOR_STRING)
    color: string = 'black';

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle = undefined;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight = undefined;

    @Validate(POSITIVE_NUMBER)
    fontSize: number = 12;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgChartLegendLabelFormatterParams) => string = undefined;
}

class LegendMarker extends BaseProperties {
    /**
     * If the marker type is set, the legend will always use that marker type for all its items,
     * regardless of the type that comes from the `data`.
     */
    @ObserveChanges<LegendMarker>((target) => target.parent?.onMarkerShapeChange())
    shape?: string | (new () => Marker);

    @Validate(POSITIVE_NUMBER)
    size = 15;

    /**
     * Padding between the marker and the label within each legend item.
     */
    @Validate(POSITIVE_NUMBER)
    padding: number = 8;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(BOOLEAN)
    enabled: boolean = true;

    parent?: { onMarkerShapeChange(): void };
}

class LegendLine extends BaseProperties {
    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    length?: number;
}

class LegendItem extends BaseProperties {
    /** Used to constrain the width of legend items. */
    @Validate(POSITIVE_NUMBER, { optional: true })
    maxWidth?: number;
    /**
     * The legend uses grid layout for its items, occupying as few columns as possible when positioned to left or right,
     * and as few rows as possible when positioned to top or bottom. This config specifies the amount of horizontal
     * padding between legend items.
     */
    @Validate(POSITIVE_NUMBER)
    paddingX: number = 16;
    /**
     * The legend uses grid layout for its items, occupying as few columns as possible when positioned to left or right,
     * and as few rows as possible when positioned to top or bottom. This config specifies the amount of vertical
     * padding between legend items.
     */
    @Validate(POSITIVE_NUMBER)
    paddingY: number = 8;

    @Validate(BOOLEAN)
    toggleSeriesVisible: boolean = true;

    @Validate(BOOLEAN)
    showSeriesStroke: boolean = false;

    @Validate(OBJECT)
    readonly marker = new LegendMarker();

    @Validate(OBJECT)
    readonly label = new LegendLabel();

    @Validate(OBJECT)
    readonly line = new LegendLine();
}

class LegendListeners extends BaseProperties implements AgChartLegendListeners {
    @Validate(FUNCTION, { optional: true })
    legendItemClick?: (event: AgChartLegendClickEvent) => void;

    @Validate(FUNCTION, { optional: true })
    legendItemDoubleClick?: (event: AgChartLegendDoubleClickEvent) => void;
}

export class Legend extends BaseProperties {
    static readonly className = 'Legend';

    readonly id = createId(this);

    private readonly group: Group = new Group({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });

    private itemSelection: Selection<MarkerLabel, CategoryLegendDatum> = Selection.select(this.group, MarkerLabel);

    private oldSize: [number, number] = [0, 0];
    private pages: Page[] = [];
    private maxPageSize: [number, number] = [0, 0];
    /** Item index to track on re-pagination, so current page updates appropriately. */
    private paginationTrackingIndex: number = 0;

    private readonly truncatedItems: Set<string> = new Set();

    private _data: CategoryLegendDatum[] = [];
    set data(value: CategoryLegendDatum[]) {
        this._data = value;
        this.updateGroupVisibility();
    }
    get data() {
        return this._data;
    }

    @Validate(OBJECT)
    readonly pagination: Pagination;

    @Validate(OBJECT)
    readonly item = new LegendItem();

    @Validate(OBJECT)
    readonly listeners = new LegendListeners();

    @ObserveChanges<Legend>((target) => target.updateGroupVisibility())
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(POSITION)
    position: AgChartLegendPosition = 'bottom';

    /** Used to constrain the width of the legend. */
    @Validate(POSITIVE_NUMBER, { optional: true })
    maxWidth?: number;

    /** Used to constrain the height of the legend. */
    @Validate(POSITIVE_NUMBER, { optional: true })
    maxHeight?: number;

    /** Reverse the display order of legend items if `true`. */
    @Validate(BOOLEAN, { optional: true })
    reverseOrder?: boolean;

    @Validate(UNION(['horizontal', 'vertical'], 'an orientation'), { optional: true })
    orientation?: AgChartLegendOrientation;

    @Validate(BOOLEAN, { optional: true })
    preventHidingAll?: boolean;

    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    @Validate(POSITIVE_NUMBER)
    spacing = 20;

    private characterWidths = new Map();

    private destroyFns: Function[] = [];

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.item.marker.parent = this;
        this.pagination = new Pagination(
            (type: ChartUpdateType) => ctx.updateService.update(type),
            (page) => this.updatePageNumber(page),
            ctx.regionManager,
            ctx.cursorManager
        );
        this.pagination.attachPagination(this.group);

        this.item.marker.parent = this;

        const animationState = InteractionState.Default | InteractionState.Animation;
        const region = ctx.regionManager.addRegion('legend', this.group);
        this.destroyFns.push(
            region.addListener('click', (e) => this.checkLegendClick(e), animationState),
            region.addListener('dblclick', (e) => this.checkLegendDoubleClick(e), animationState),
            region.addListener('hover', (e) => this.handleLegendMouseMove(e)),
            region.addListener('leave', (e) => this.handleLegendMouseExit(e), animationState),
            region.addListener('enter', (e) => this.handleLegendMouseEnter(e), animationState),
            ctx.layoutService.addListener('start-layout', (e) => this.positionLegend(e.shrinkRect)),
            () => this.detachLegend()
        );
    }

    public destroy() {
        this.destroyFns.forEach((f) => f());

        this.pagination.destroy();
    }

    public onMarkerShapeChange() {
        this.itemSelection.clear();
        this.group.markDirty(this.group, RedrawType.MINOR);
    }

    private getOrientation(): AgChartLegendOrientation {
        if (this.orientation !== undefined) {
            return this.orientation;
        }
        switch (this.position) {
            case 'right':
            case 'left':
                return 'vertical';
            case 'bottom':
            case 'top':
                return 'horizontal';
        }
    }

    private getCharacterWidths(font: string) {
        const { characterWidths } = this;

        if (characterWidths.has(font)) {
            return characterWidths.get(font);
        }

        const cw: { [key: string]: number } = {
            '...': Text.getTextSize('...', font).width,
        };
        characterWidths.set(font, cw);
        return cw;
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

    attachLegend(scene: Scene) {
        scene.appendChild(this.group);
    }

    detachLegend() {
        this.group.parent?.removeChild(this.group);
    }

    private getItemLabel(datum: CategoryLegendDatum) {
        const {
            ctx: { callbackCache },
        } = this;
        const { formatter } = this.item.label;
        if (formatter) {
            return callbackCache.call(formatter, {
                itemId: datum.itemId,
                value: datum.label.text,
                seriesId: datum.seriesId,
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
            marker: { size: markerSize, padding: markerPadding, shape: markerShape },
            label: { maxLength = Infinity, fontStyle, fontWeight, fontSize, fontFamily },
            line: itemLine,
            showSeriesStroke,
        } = this.item;
        const data = [...this.data];
        if (this.reverseOrder) {
            data.reverse();
        }
        this.itemSelection.update(data);

        // Update properties that affect the size of the legend items and measure them.
        const bboxes: BBox[] = [];

        const font = getFont(label);

        const itemMaxWidthPercentage = 0.8;
        const maxItemWidth = maxWidth ?? width * itemMaxWidthPercentage;
        const paddedMarkerWidth = markerSize + markerPadding + paddingX;

        this.itemSelection.each((markerLabel, datum) => {
            const Marker = getMarker(markerShape ?? datum.marker.shape);
            const markerEnabled = datum.marker.enabled ?? this.item.marker.enabled;

            if (!(markerLabel.marker && markerLabel.marker instanceof Marker)) {
                markerLabel.marker = new Marker();
            }

            markerLabel.markerSize = markerSize;
            markerLabel.spacing = markerPadding;
            markerLabel.fontStyle = fontStyle;
            markerLabel.fontWeight = fontWeight;
            markerLabel.fontSize = fontSize;
            markerLabel.fontFamily = fontFamily;

            const id = datum.itemId ?? datum.id;
            const labelText = this.getItemLabel(datum);
            const text = (labelText ?? '<unknown>').replace(/\r?\n/g, ' ');
            markerLabel.text = this.truncate(text, maxLength, maxItemWidth, paddedMarkerWidth, font, id);

            if (showSeriesStroke && datum.line !== undefined) {
                markerLabel.lineVisible = true;
                markerLabel.markerVisible = markerEnabled;
                markerLabel.setSeriesStrokeOffset(itemLine.length ?? 5);
            } else {
                markerLabel.lineVisible = false;
                markerLabel.markerVisible = true;
            }

            bboxes.push(markerLabel.computeBBox());
        });

        width = Math.max(1, width);
        height = Math.max(1, height);

        if (!isFinite(width)) {
            return false;
        }

        const size = this.size;
        const oldSize = this.oldSize;
        size[0] = width;
        size[1] = height;

        if (size[0] !== oldSize[0] || size[1] !== oldSize[1]) {
            oldSize[0] = size[0];
            oldSize[1] = size[1];
        }

        const { pages, maxPageHeight, maxPageWidth } = this.updatePagination(bboxes, width, height);

        this.pages = pages;
        this.maxPageSize = [maxPageWidth - paddingX, maxPageHeight - paddingY];

        const pageNumber = this.pagination.currentPage;
        const page = this.pages[pageNumber];

        if (this.pages.length < 1 || !page) {
            this.visible = false;
            return;
        }

        this.visible = true;

        // Position legend items
        this.updatePositions(pageNumber);

        // Update legend item properties that don't affect the layout.
        this.update();
    }

    private truncate(
        text: string,
        maxCharLength: number,
        maxItemWidth: number,
        paddedMarkerWidth: number,
        font: string,
        id: string
    ): string {
        const ellipsis = `...`;

        const textChars = text.split('');
        let addEllipsis = false;

        if (text.length > maxCharLength) {
            text = `${text.substring(0, maxCharLength)}`;
            addEllipsis = true;
        }

        const labelWidth = Math.floor(paddedMarkerWidth + Text.getTextSize(text, font).width);
        if (labelWidth > maxItemWidth) {
            let truncatedText = '';
            const characterWidths = this.getCharacterWidths(font);
            let cumulativeWidth = paddedMarkerWidth + characterWidths[ellipsis];

            for (const char of textChars) {
                if (!characterWidths[char]) {
                    characterWidths[char] = Text.getTextSize(char, font).width;
                }

                cumulativeWidth += characterWidths[char];

                if (cumulativeWidth > maxItemWidth) {
                    break;
                }

                truncatedText += char;
            }

            text = truncatedText;
            addEllipsis = true;
        }

        if (addEllipsis) {
            text += ellipsis;
            this.truncatedItems.add(id);
        } else {
            this.truncatedItems.delete(id);
        }

        return text;
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

        return {
            maxPageHeight,
            maxPageWidth,
            pages,
        };
    }

    private calculatePagination(bboxes: BBox[], width: number, height: number) {
        const { paddingX: itemPaddingX, paddingY: itemPaddingY } = this.item;

        const orientation = this.getOrientation();
        const paginationVertical = ['left', 'right'].includes(this.position);

        let paginationBBox: BBox = this.pagination.computeBBox();
        let lastPassPaginationBBox: BBox = new BBox(0, 0, 0, 0);
        let pages: Page[] = [];
        let maxPageWidth = 0;
        let maxPageHeight = 0;
        let count = 0;

        const stableOutput = (bbox: BBox) => {
            return bbox.width === paginationBBox.width && bbox.height === paginationBBox.height;
        };

        const forceResult = this.maxWidth !== undefined || this.maxHeight !== undefined;

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
            lastPassPaginationBBox = this.pagination.computeBBox();

            if (!this.pagination.visible) {
                break;
            }
        } while (!stableOutput(lastPassPaginationBBox));

        return { maxPageWidth, maxPageHeight, pages, paginationBBox, paginationVertical };
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
            let columnIndex = 0;
            let rowIndex = 0;
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

            y = itemHeight * rowIndex;
            x = rowSumColumnWidths[rowIndex] ?? 0;

            rowSumColumnWidths[rowIndex] = (rowSumColumnWidths[rowIndex] ?? 0) + column.columnWidth;

            // Round off for pixel grid alignment to work properly.
            markerLabel.translationX = Math.floor(x);
            markerLabel.translationY = Math.floor(y);
        });
    }

    private updatePageNumber(pageNumber: number) {
        const { pages } = this;

        // Track an item on the page in re-pagination cases (e.g. resize).
        const { startIndex, endIndex } = pages[pageNumber];
        if (startIndex === 0) {
            // Stay on first page on pagination update.
            this.paginationTrackingIndex = 0;
        } else if (pageNumber === pages.length - 1) {
            // Stay on last page on pagination update.
            this.paginationTrackingIndex = endIndex;
        } else {
            // Track the middle item on the page).
            this.paginationTrackingIndex = Math.floor((startIndex + endIndex) / 2);
        }

        this.pagination.update();
        this.pagination.updateMarkers();

        this.updatePositions(pageNumber);
        this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER);
    }

    update() {
        const {
            label: { color },
            marker: itemMarker,
            line: itemLine,
            showSeriesStroke,
        } = this.item;
        this.itemSelection.each((markerLabel, datum) => {
            const marker = datum.marker;
            markerLabel.markerFill = marker.fill;
            markerLabel.markerStroke = marker.stroke;
            markerLabel.markerStrokeWidth = itemMarker.strokeWidth ?? Math.min(2, marker.strokeWidth);
            markerLabel.markerFillOpacity = marker.fillOpacity;
            markerLabel.markerStrokeOpacity = marker.strokeOpacity;
            markerLabel.opacity = datum.enabled ? 1 : 0.5;
            markerLabel.color = color;

            const { line } = datum;
            if (showSeriesStroke && line !== undefined) {
                markerLabel.lineStroke = line.stroke;
                markerLabel.lineStrokeOpacity = line.strokeOpacity;
                markerLabel.lineStrokeWidth = itemLine.strokeWidth ?? Math.min(2, line.strokeWidth);
                markerLabel.lineLineDash = line.lineDash;
            }
        });
    }

    private getDatumForPoint(x: number, y: number): CategoryLegendDatum | undefined {
        const visibleChildBBoxes: BBox[] = [];
        const closestLeftTop = { dist: Infinity, datum: undefined as any };
        for (const child of this.group.children) {
            if (!child.visible) continue;
            if (!(child instanceof MarkerLabel)) continue;

            const childBBox = child.computeBBox();
            childBBox.grow(this.item.paddingX / 2, 'horizontal');
            childBBox.grow(this.item.paddingY / 2, 'vertical');
            if (childBBox.containsPoint(x, y)) {
                return child.datum;
            }

            const distX = x - childBBox.x - this.item.paddingX / 2;
            const distY = y - childBBox.y - this.item.paddingY / 2;
            const dist = distX ** 2 + distY ** 2;
            const toTheLeftTop = distX >= 0 && distY >= 0;
            if (toTheLeftTop && dist < closestLeftTop.dist) {
                closestLeftTop.dist = dist;
                closestLeftTop.datum = child.datum;
            }

            visibleChildBBoxes.push(childBBox);
        }

        const pageBBox = BBox.merge(visibleChildBBoxes);
        if (!pageBBox.containsPoint(x, y)) {
            // We're not in-between legend items.
            return;
        }

        // Fallback to returning closest match to the left/up.
        return closestLeftTop.datum;
    }

    private computePagedBBox(): BBox {
        const actualBBox = this.group.computeBBox();
        if (this.pages.length <= 1) {
            return actualBBox;
        }

        const [maxPageWidth, maxPageHeight] = this.maxPageSize;
        actualBBox.height = Math.max(maxPageHeight, actualBBox.height);
        actualBBox.width = Math.max(maxPageWidth, actualBBox.width);

        return actualBBox;
    }

    private checkLegendClick(event: InteractionEvent<'click'>) {
        const {
            listeners: { legendItemClick },
            ctx: { chartService, highlightManager },
            item: { toggleSeriesVisible },
            preventHidingAll,
        } = this;
        const datum = this.getDatumForPoint(event.offsetX, event.offsetY);

        if (!datum) {
            return;
        }

        const { id, itemId, enabled } = datum;
        const series = chartService.series.find((s) => s.id === id);
        if (!series) {
            return;
        }
        event.consume();

        let newEnabled = enabled;
        if (toggleSeriesVisible) {
            newEnabled = !enabled;

            if (preventHidingAll && !newEnabled) {
                const numVisibleItems = chartService.series
                    .flatMap((s) => s.getLegendData('category'))
                    .filter((d) => d.enabled).length;

                if (numVisibleItems < 2) {
                    newEnabled = true;
                }
            }

            this.ctx.chartEventManager.legendItemClick(series, itemId, newEnabled, datum.legendItemName);
        }

        if (newEnabled) {
            highlightManager.updateHighlight(this.id, {
                series,
                itemId,
                datum: undefined,
            });
        } else {
            highlightManager.updateHighlight(this.id);
        }

        this.ctx.updateService.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true });

        legendItemClick?.({ type: 'click', enabled: newEnabled, itemId, seriesId: series.id });
    }

    private checkLegendDoubleClick(event: InteractionEvent<'dblclick'>) {
        const {
            listeners: { legendItemDoubleClick },
            ctx: { chartService },
            item: { toggleSeriesVisible },
        } = this;
        // Integrated charts do not handle double click behaviour correctly due to multiple instances of the
        // chart being created. See https://ag-grid.atlassian.net/browse/RTI-1381
        if (chartService.mode === 'integrated') {
            return;
        }

        const datum = this.getDatumForPoint(event.offsetX, event.offsetY);

        if (!datum) {
            return;
        }

        const { id, itemId, seriesId } = datum;
        const series = chartService.series.find((s) => s.id === id);
        if (!series) {
            return;
        }
        event.consume();

        if (toggleSeriesVisible) {
            const legendData = chartService.series.flatMap((s) => s.getLegendData('category'));
            const numVisibleItems = legendData.filter((d) => d.enabled).length;

            const clickedItem = legendData.find((d) => d.itemId === itemId && d.seriesId === seriesId);

            this.ctx.chartEventManager.legendItemDoubleClick(
                series,
                itemId,
                clickedItem?.enabled ?? false,
                numVisibleItems,
                clickedItem?.legendItemName
            );
        }

        this.ctx.updateService.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true });

        legendItemDoubleClick?.({ type: 'dblclick', enabled: true, itemId, seriesId: series.id });
    }

    private handleLegendMouseMove(event: InteractionEvent<'hover'>) {
        const {
            enabled,
            item: { toggleSeriesVisible },
            listeners,
        } = this;
        if (!enabled) {
            return;
        }

        const { offsetX, offsetY } = event;
        // Prevent other handlers from consuming this event if it's generated inside the legend
        // boundaries.
        event.consume();

        const datum = this.getDatumForPoint(offsetX, offsetY);
        if (datum === undefined) {
            this.ctx.cursorManager.updateCursor(this.id);
            this.ctx.highlightManager.updateHighlight(this.id);
            return;
        }

        const series = datum ? this.ctx.chartService.series.find((s) => s.id === datum?.id) : undefined;
        if (datum && this.truncatedItems.has(datum.itemId ?? datum.id)) {
            this.ctx.tooltipManager.updateTooltip(
                this.id,
                { offsetX, offsetY, lastPointerEvent: event, showArrow: false, addCustomClass: false },
                toTooltipHtml({ content: this.getItemLabel(datum) })
            );
        } else {
            this.ctx.tooltipManager.removeTooltip(this.id);
        }

        if (toggleSeriesVisible || listeners.legendItemClick != null || listeners.legendItemDoubleClick != null) {
            this.ctx.cursorManager.updateCursor(this.id, 'pointer');
        }

        if (datum?.enabled && series) {
            this.ctx.highlightManager.updateHighlight(this.id, {
                series,
                itemId: datum?.itemId,
                datum: undefined,
            });
        } else {
            this.ctx.highlightManager.updateHighlight(this.id);
        }
    }

    private handleLegendMouseExit(_event: InteractionEvent<'leave'>) {
        this.ctx.cursorManager.updateCursor(this.id);
        this.ctx.tooltipManager.removeTooltip(this.id);
        // Updating the highlight can interrupt animations, so only clear the highlight if the chart
        // is in a state when highlighting is possible.
        if (this.ctx.interactionManager.getState() === InteractionState.Default) {
            this.ctx.highlightManager.updateHighlight(this.id);
        }
    }

    private handleLegendMouseEnter(event: InteractionEvent<'enter'>) {
        const {
            enabled,
            item: { toggleSeriesVisible: toggle },
            listeners: { legendItemClick: clickListener, legendItemDoubleClick: dblclickListener },
        } = this;
        const datum = this.getDatumForPoint(event.offsetX, event.offsetY);
        if (enabled && datum !== undefined && (toggle || clickListener != null || dblclickListener != null)) {
            this.ctx.cursorManager.updateCursor(this.id, 'pointer');
        }
    }

    private positionLegend(shrinkRect: BBox) {
        const newShrinkRect = shrinkRect.clone();

        if (!this.enabled || !this.data.length) {
            return { shrinkRect: newShrinkRect };
        }

        const [legendWidth, legendHeight] = this.calculateLegendDimensions(shrinkRect);

        this.group.translationX = 0;
        this.group.translationY = 0;
        this.calcLayout(legendWidth, legendHeight);
        const legendBBox = this.computePagedBBox();

        const calculateTranslationPerpendicularDimension = () => {
            switch (this.position) {
                case 'top':
                case 'left':
                    return 0;
                case 'bottom':
                    return shrinkRect.height - legendBBox.height;
                case 'right':
                default:
                    return shrinkRect.width - legendBBox.width;
            }
        };
        if (this.visible) {
            let translationX;
            let translationY;

            switch (this.position) {
                case 'top':
                case 'bottom':
                    translationX = (shrinkRect.width - legendBBox.width) / 2;
                    translationY = calculateTranslationPerpendicularDimension();
                    newShrinkRect.shrink(legendBBox.height, this.position);
                    break;

                case 'left':
                case 'right':
                default:
                    translationX = calculateTranslationPerpendicularDimension();
                    translationY = (shrinkRect.height - legendBBox.height) / 2;
                    newShrinkRect.shrink(legendBBox.width, this.position);
            }

            // Round off for pixel grid alignment to work properly.
            this.group.translationX = Math.floor(-legendBBox.x + shrinkRect.x + translationX);
            this.group.translationY = Math.floor(-legendBBox.y + shrinkRect.y + translationY);
        }

        if (this.visible && this.enabled && this.data.length) {
            const legendPadding = this.spacing;
            newShrinkRect.shrink(legendPadding, this.position);

            const legendPositionedBBox = legendBBox.clone();
            legendPositionedBBox.x += this.group.translationX;
            legendPositionedBBox.y += this.group.translationY;
            this.ctx.tooltipManager.updateExclusiveRect(this.id, legendPositionedBBox);
        } else {
            this.ctx.tooltipManager.updateExclusiveRect(this.id);
        }

        return { shrinkRect: newShrinkRect };
    }

    private calculateLegendDimensions(shrinkRect: BBox): [number, number] {
        const { width, height } = shrinkRect;

        const aspectRatio = width / height;
        const maxCoefficient = 0.5;
        const minHeightCoefficient = 0.2;
        const minWidthCoefficient = 0.25;

        let legendWidth, legendHeight;

        switch (this.position) {
            case 'top':
            case 'bottom':
                // A horizontal legend should take maximum between 20 to 50 percent of the chart height if height is larger than width
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

            case 'left':
            case 'right':
            default:
                // A vertical legend should take maximum between 25 to 50 percent of the chart width if width is larger than height
                // and maximum 25 percent of the chart width if width is smaller than height.
                const widthCoefficient =
                    aspectRatio > 1 ? Math.min(maxCoefficient, minWidthCoefficient * aspectRatio) : minWidthCoefficient;
                legendWidth = this.maxWidth ? Math.min(this.maxWidth, width) : Math.round(width * widthCoefficient);
                legendHeight = this.maxHeight ? Math.min(this.maxHeight, height) : height;
        }

        return [legendWidth, legendHeight];
    }
}
