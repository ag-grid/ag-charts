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
import { Line } from '../scene/shape/line';
import { Text, getFont } from '../scene/shape/text';
import { setElementBBox } from '../util/dom';
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
import { InteractionState, type PointerInteractionEvent } from './interaction/interactionManager';
import type { KeyNavEvent } from './interaction/keyNavManager';
import { makeKeyboardPointerEvent } from './keyboardUtil';
import { Layers } from './layers';
import type { CategoryLegendDatum, LegendSymbolOptions } from './legendDatum';
import type { Marker } from './marker/marker';
import { type MarkerConstructor, getMarker } from './marker/util';
import { MarkerLabel } from './markerLabel';
import { Pagination } from './pagination/pagination';
import { type TooltipPointerEvent, toTooltipHtml } from './tooltip/tooltip';

type LegendFocus = { on: boolean; mode: 'item' | 'page'; index: number };

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
    shape?: string | MarkerConstructor;

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
    enabled?: boolean;

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

    private readonly itemSelection: Selection<MarkerLabel, CategoryLegendDatum> = Selection.select(
        this.group,
        MarkerLabel
    );

    private readonly oldSize: [number, number] = [0, 0];
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

    private contextMenuDatum?: CategoryLegendDatum;

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

    private readonly characterWidths = new Map();

    private readonly destroyFns: Function[] = [];

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

        ctx.contextMenuRegistry.registerDefaultAction({
            id: 'legend-visibility',
            region: 'legend',
            label: 'Toggle Visibility',
            action: (_params) => this.contextToggleVisibility(),
        });
        ctx.contextMenuRegistry.registerDefaultAction({
            id: 'legend-other-series',
            region: 'legend',
            label: 'Toggle Other Series',
            action: (_params) => this.contextToggleOtherSeries(),
        });

        const animationState = InteractionState.Default | InteractionState.Animation;
        const region = ctx.regionManager.addRegionFromProperties({
            name: 'legend',
            bboxproviders: [this.group],
            canInteraction: () => false,
        });
        this.destroyFns.push(
            region.addListener('contextmenu', (e) => this.checkContextClick(e), animationState),
            region.addListener('click', (e) => this.checkLegendClick(e), animationState),
            region.addListener('dblclick', (e) => this.checkLegendDoubleClick(e), animationState),
            region.addListener('hover', (e) => this.handleLegendMouseMove(e)),
            region.addListener('leave', (e) => this.handleLegendMouseExit(e), animationState),
            region.addListener('enter', (e) => this.handleLegendMouseEnter(e), animationState),
            region.addListener('blur', (e) => this.onBlur(e)),
            region.addListener('tab', (e) => this.onTab(e)),
            region.addListener('tab-start', (e) => this.onTab(e)),
            region.addListener('nav-vert', (e) => this.onNav(e)),
            region.addListener('nav-hori', (e) => this.onNav(e)),
            region.addListener('submit', (e) => this.onSubmit(e)),
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
            label: { maxLength = Infinity, fontStyle, fontWeight, fontSize, fontFamily },
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

        this.itemSelection.each((markerLabel, datum, index) => {
            markerLabel.fontStyle = fontStyle;
            markerLabel.fontWeight = fontWeight;
            markerLabel.fontSize = fontSize;
            markerLabel.fontFamily = fontFamily;

            const paddedSymbolWidth = this.updateMarkerLabel(markerLabel, datum, index);
            const id = datum.itemId ?? datum.id;
            const labelText = this.getItemLabel(datum);
            const text = (labelText ?? '<unknown>').replace(/\r?\n/g, ' ');
            markerLabel.text = this.truncate(text, maxLength, maxItemWidth, paddedSymbolWidth, font, id);

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

    private updateMarkerLabel(markerLabel: MarkerLabel, datum: CategoryLegendDatum, index: number): number {
        const { showSeriesStroke, marker: itemMarker, line: itemLine, paddingX } = this.item;

        let paddedSymbolWidth = paddingX;
        if (markerLabel.markers.length > 0 || markerLabel.lines.length > 0) {
            return paddedSymbolWidth;
        }

        const dimensionProps: { length: number; spacing: number }[] = [];
        const markers: Marker[] = [];
        const lines: Line[] = [];

        datum.symbols.forEach((symbol) => {
            const markerEnabled =
                this.item.marker.enabled ??
                (showSeriesStroke && symbol.marker.enabled !== undefined ? symbol.marker.enabled : true);
            const lineEnabled = !!(symbol.line && showSeriesStroke);

            const spacing = symbol.marker.padding ?? itemMarker.padding;

            if (lineEnabled) {
                lines.push(new Line());
            }

            const { size: markerSize, shape: markerShape = symbol.marker.shape } = itemMarker;

            if (markerEnabled) {
                const MarkerCtr = getMarker(markerShape);
                const marker = new MarkerCtr();

                marker.size = markerSize;
                markers.push(marker);
            }

            const lineLength = lineEnabled ? itemLine.length ?? 25 : 0;
            const markerLength = markerEnabled ? markerSize : 0;
            dimensionProps.push({ length: lineLength, spacing });

            if (markerEnabled || lineEnabled) {
                paddedSymbolWidth += spacing + Math.max(lineLength, markerLength);
            }
        });

        markerLabel.markers = markers;
        markerLabel.lines = lines;
        markerLabel.update(dimensionProps);

        markerLabel.proxyButton ??= this.ctx.domManager.addProxyElement({
            type: 'button',
            id: `ag-charts-legend-item-${index}`,
            textContext: this.getItemAriaText(index),
            onclick: (_event: MouseEvent): any => {
                const datum = this.data[index];
                this.doClick(datum);
            },
        });

        return paddedSymbolWidth;
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
            lastPassPaginationBBox = this.pagination.computeBBox();

            if (!this.pagination.visible) {
                break;
            }
        } while (!stableOutput(lastPassPaginationBBox));

        return { maxPageWidth, maxPageHeight, pages, paginationBBox, paginationVertical };
    }

    private getPageItemCount(pageNumber: number): number {
        let count = 0;
        for (const col of this.pages[pageNumber].columns) {
            count += col.indices.length;
        }
        return count;
    }

    private getNodeIndexFromFocusIndex(): number {
        const { index } = this.focus;
        const page = this.pages[this.pagination.currentPage];
        let itemCount: number = 0;
        for (const col of page.columns) {
            if (index < itemCount + col.indices.length) {
                return col.indices[index - itemCount];
            } else {
                itemCount += col.indices.length;
            }
        }
        return -1;
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
        } = this.item;
        this.itemSelection.each((markerLabel, datum) => {
            datum.symbols.forEach((symbol, index) => {
                const marker = markerLabel.markers[index];
                const line = markerLabel.lines[index];

                if (marker) {
                    const { strokeWidth, fill, stroke, fillOpacity, strokeOpacity } = this.getMarkerStyles(symbol);

                    marker.fill = fill;
                    marker.stroke = stroke;
                    marker.strokeWidth = Math.min(2, strokeWidth);
                    marker.fillOpacity = fillOpacity;
                    marker.strokeOpacity = strokeOpacity;
                }

                if (line) {
                    const lineStyles = this.getLineStyles(symbol);

                    line.stroke = lineStyles.stroke;
                    line.strokeOpacity = lineStyles.strokeOpacity;
                    line.strokeWidth = lineStyles.strokeWidth;
                    line.lineDash = lineStyles.lineDash;
                }
            });

            markerLabel.opacity = datum.enabled ? 1 : 0.5;
            markerLabel.color = color;
        });
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
    private getMarkerStyles(datum: LegendSymbolOptions) {
        const { fill, stroke, strokeOpacity = 1, fillOpacity = 1, strokeWidth } = datum.marker;
        const defaultLineStrokeWidth = Math.min(2, strokeWidth ?? 1);

        return {
            fill,
            stroke,
            strokeOpacity,
            fillOpacity,
            strokeWidth: this.item.marker.strokeWidth ?? defaultLineStrokeWidth,
        };
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

    private contextToggleVisibility() {
        this.doClick(this.contextMenuDatum);
    }

    private contextToggleOtherSeries() {
        this.doDoubleClick(this.contextMenuDatum);
    }

    private checkContextClick(event: PointerInteractionEvent<'contextmenu'>) {
        this.contextMenuDatum = this.getDatumForPoint(event.offsetX, event.offsetY);
    }

    private checkLegendClick(event: PointerInteractionEvent<'click'>) {
        const datum = this.getDatumForPoint(event.offsetX, event.offsetY);
        if (this.doClick(datum)) {
            event.consume();
        }
    }

    private doClick(datum: CategoryLegendDatum | undefined): boolean {
        const {
            listeners: { legendItemClick },
            ctx: { chartService, highlightManager },
            item: { toggleSeriesVisible },
            preventHidingAll,
        } = this;

        if (!datum) {
            return false;
        }

        const { id, itemId, enabled } = datum;
        const series = chartService.series.find((s) => s.id === id);
        if (!series) {
            return false;
        }

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

            const status: string = newEnabled ? 'visible' : 'hidden';
            this.ctx.ariaAnnouncementService.announceValue(`${status}`);
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
        return true;
    }

    private checkLegendDoubleClick(event: PointerInteractionEvent<'dblclick'>) {
        const datum = this.getDatumForPoint(event.offsetX, event.offsetY);
        if (this.doDoubleClick(datum)) {
            event.consume();
        }
    }

    private doDoubleClick(datum: CategoryLegendDatum | undefined): boolean {
        const {
            listeners: { legendItemDoubleClick },
            ctx: { chartService },
            item: { toggleSeriesVisible },
        } = this;
        // Integrated charts do not handle double click behaviour correctly due to multiple instances of the
        // chart being created. See https://ag-grid.atlassian.net/browse/RTI-1381
        if (chartService.mode === 'integrated') {
            return false;
        }

        if (!datum) {
            return false;
        }

        const { id, itemId, seriesId } = datum;
        const series = chartService.series.find((s) => s.id === id);
        if (!series) {
            return false;
        }

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
        return true;
    }

    private handleLegendMouseMove(event: PointerInteractionEvent<'hover'>) {
        if (!this.enabled) {
            return;
        }

        const { offsetX, offsetY } = event;
        // Prevent other handlers from consuming this event if it's generated inside the legend
        // boundaries.
        event.consume();

        const datum = this.getDatumForPoint(offsetX, offsetY);
        this.doHover(event, datum);
    }

    private doHover(
        event: TooltipPointerEvent<'hover' | 'keyboard'> | undefined,
        datum: CategoryLegendDatum | undefined
    ) {
        const {
            item: { toggleSeriesVisible },
            listeners,
        } = this;

        if (event === undefined || datum === undefined) {
            this.ctx.cursorManager.updateCursor(this.id);
            this.ctx.highlightManager.updateHighlight(this.id);
            return;
        }

        const series = datum ? this.ctx.chartService.series.find((s) => s.id === datum?.id) : undefined;
        if (datum && this.truncatedItems.has(datum.itemId ?? datum.id)) {
            const { offsetX, offsetY } = event;
            this.ctx.tooltipManager.updateTooltip(
                this.id,
                { offsetX, offsetY, lastPointerEvent: event, showArrow: false },
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

    private handleLegendMouseExit(_event: PointerInteractionEvent<'leave'>) {
        this.doMouseExit();
    }

    private doMouseExit() {
        this.ctx.cursorManager.updateCursor(this.id);
        this.ctx.tooltipManager.removeTooltip(this.id);
        // Updating the highlight can interrupt animations, so only clear the highlight if the chart
        // is in a state when highlighting is possible.
        if (this.ctx.interactionManager.getState() === InteractionState.Default) {
            this.ctx.highlightManager.updateHighlight(this.id);
        }
    }

    private handleLegendMouseEnter(event: PointerInteractionEvent<'enter'>) {
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

    private readonly focus: LegendFocus = { on: false, mode: 'item', index: 0 };

    private onBlur(_event: KeyNavEvent<'blur'>) {
        this.doMouseExit();
        this.focus.on = false;
        this.ctx.regionManager.updateFocusIndicatorRect(undefined);
    }

    // Tab forward/backward between the items and pagination buttons.
    //
    // 'tab' is received when legend comes into focus. 'tab-start' is received when the legend is
    // currently focused and is just about to blur. Consuming the 'tab-start' event prevents the
    // RegionManager from blurring the legend and dispatching 'tab' events.
    private onTab(event: KeyNavEvent<'tab' | 'tab-start'>) {
        const { on: hasFocus, mode } = this.focus;
        const { delta } = event;
        const hasPagination = this.pagination.visible && this.pagination.enabled;

        if (delta === 0) {
            this.updateFocus();
            event.consume();
        } else if (hasPagination && ((!hasFocus && delta < 0) || (hasFocus && mode === 'item' && delta > 0))) {
            // If the user is on the first page then put the initial focus on the next button (index: 1),
            // because the previous button (index: 0) will be grayed out.
            this.focus.index = this.pagination.currentPage === 0 ? 1 : 0;
            this.focus.mode = 'page';
            this.updateFocus();
            event.consume();
        } else if ((!hasFocus && delta > 0) || (hasFocus && mode === 'page' && delta < 0)) {
            this.focus.index = 0;
            this.focus.mode = 'item';
            this.updateFocus();
            event.consume();
        }
    }

    private onNav(event: KeyNavEvent<'nav-vert' | 'nav-hori'>) {
        if (this.focus.mode === 'item') {
            const newIndex = this.focus.index + event.delta;
            const pageItemCount = this.getPageItemCount(this.pagination.currentPage);
            this.focus.index = clamp(-1, newIndex, pageItemCount);
            this.updateFocus();
            event.consume();
        } else if (this.focus.mode === 'page') {
            if (event.delta < 0) this.focus.index = 0;
            if (event.delta > 0) this.focus.index = 1;
            this.updateFocus();
            event.consume();
        }
    }

    private onSubmit(event: KeyNavEvent<'submit'>) {
        if (this.focus.mode === 'item') {
            this.doClick(this.getFocusedItem().datum);
        } else if (this.focus.mode === 'page') {
            if (this.focus.index === 0) this.pagination.clickPrevious();
            if (this.focus.index === 1) this.pagination.clickNext();
            this.ctx.ariaAnnouncementService.announceValue(
                `Legend page ${this.pagination.currentPage + 1} of ${this.pages.length}`
            );
        }
        event.consume();
    }

    private maybeChangeFocusPage() {
        // Update the current page by going left or right (or staying on the same page).
        const oldPage = this.pagination.currentPage;
        const oldPageItemCount = this.getPageItemCount(oldPage);
        if (this.focus.index === -1) {
            this.pagination.setPage(oldPage - 1);
        } else if (this.focus.index === oldPageItemCount) {
            this.pagination.setPage(oldPage + 1);
        } else {
            return;
        }

        // Update the current index of the focused item on this update-to-date page.
        const { currentPage } = this.pagination;
        if (oldPage === currentPage) {
            this.focus.index = clamp(0, this.focus.index, oldPageItemCount - 1);
        } else if (this.focus.index === -1) {
            this.focus.index = this.getPageItemCount(currentPage) - 1;
        } else {
            this.focus.index = 0;
        }
    }

    private getItemAriaText(nodeIndex: number): string {
        const datum = this.data[nodeIndex];
        const label = datum && this.getItemLabel(datum);
        if (nodeIndex >= 0 && label && datum) {
            const visibility = datum.enabled ? 'visible' : 'hidden';
            return `Legend item ${nodeIndex + 1} of ${this.data.length}, ${label}, ${visibility}`;
        }
        return 'Unknown legend item';
    }

    private getFocusedItem(): { node?: MarkerLabel; datum?: CategoryLegendDatum; ariaText: string } {
        let ariaText = this.getItemAriaText(-1);
        if (this.focus.mode !== 'item') {
            Logger.error(`getFocusedItem() should be called only when focus.mode is 'item'`);
            return { node: undefined, datum: undefined, ariaText };
        }
        this.maybeChangeFocusPage();

        const nodeIndex = this.getNodeIndexFromFocusIndex();
        if (nodeIndex < 0) {
            Logger.error(`Cannot access negative nodeIndex ${nodeIndex}`);
            return { node: undefined, datum: undefined, ariaText };
        }

        const node = this.itemSelection.nodes()[nodeIndex];
        const data = this.data;
        let datum: CategoryLegendDatum | undefined;
        if (nodeIndex < data.length) {
            datum = this.data[nodeIndex];
            ariaText = this.getItemAriaText(nodeIndex);
        } else {
            Logger.error(`Cannot access datum[${nodeIndex}]`);
        }

        return { node, datum, ariaText };
    }

    private updateFocus() {
        const { focus, pagination } = this;
        if (focus.mode === 'item') {
            const { node, datum, ariaText } = this.getFocusedItem();
            if (datum === undefined) return;

            const bbox = node?.computeTransformedBBox();
            this.doHover(makeKeyboardPointerEvent(this.ctx.regionManager, { bbox, showFocusBox: true }), datum);
            this.ctx.ariaAnnouncementService.announceValue(ariaText);
        } else if (focus.mode === 'page') {
            const button = focus.index === 0 ? pagination.previousButton : pagination.nextButton;
            this.ctx.regionManager.updateFocusIndicatorRect(button.computeTransformedBBox());
            const value = ['Previous legend page', 'Next legend page'][focus.index];
            this.ctx.ariaAnnouncementService.announceValue(`${value}, button`);
        }

        this.focus.on = true;
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
        }

        this.itemSelection.each((node) => {
            const bbox = node.computeTransformedBBox();
            if (bbox && node.proxyButton) {
                setElementBBox(node.proxyButton, bbox);
            }
        });

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
