import type {
    AgChartLegendClickEvent,
    AgChartLegendContextMenuEvent,
    AgChartLegendDoubleClickEvent,
    AgChartLegendLabelFormatterParams,
    AgChartLegendListeners,
    AgChartLegendOrientation,
    AgChartLegendPosition,
    FontStyle,
    FontWeight,
    Formatter,
} from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
import type { ModuleContext } from '../module/moduleContext';
import { BBox } from '../scene/bbox';
import { TranslatableGroup } from '../scene/group';
import { RedrawType } from '../scene/node';
import type { Scene } from '../scene/scene';
import { Selection } from '../scene/selection';
import { Line } from '../scene/shape/line';
import { type SpriteDimensions, SpriteRenderer } from '../scene/spriteRenderer';
import { getWindow, setElementBBox } from '../util/dom';
import { createId } from '../util/id';
import { initToolbarKeyNav } from '../util/keynavUtil';
import { Logger } from '../util/logger';
import { clamp } from '../util/number';
import { BaseProperties } from '../util/properties';
import { ObserveChanges } from '../util/proxy';
import { CachedTextMeasurerPool, TextUtils } from '../util/textMeasurer';
import { TextWrapper } from '../util/textWrapper';
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
import type { HighlightNodeDatum } from './interaction/highlightManager';
import { InteractionState, type PointerInteractionEvent } from './interaction/interactionManager';
import { makeKeyboardPointerEvent } from './keyboardUtil';
import { Layers } from './layers';
import type { CategoryLegendDatum, LegendSymbolOptions } from './legendDatum';
import { LegendMarkerLabel } from './legendMarkerLabel';
import type { Marker } from './marker/marker';
import { type MarkerConstructor, getMarker } from './marker/util';
import { Pagination } from './pagination/pagination';
import { type TooltipPointerEvent, toTooltipHtml } from './tooltip/tooltip';

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
    formatter?: Formatter<AgChartLegendLabelFormatterParams>;
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

const ID_LEGEND_VISIBILITY = 'legend-visibility';
const ID_LEGEND_OTHER_SERIES = 'legend-other-series';

export class Legend extends BaseProperties {
    static readonly className = 'Legend';

    readonly id = createId(this);

    private readonly group = new TranslatableGroup({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });

    private readonly itemSelection: Selection<LegendMarkerLabel, CategoryLegendDatum> = Selection.select(
        this.group,
        LegendMarkerLabel
    );

    private readonly spriteRenderer = new SpriteRenderer();

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

    private readonly contextMenuDatum?: CategoryLegendDatum;

    @Validate(BOOLEAN)
    toggleSeries: boolean = true;

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

    private readonly destroyFns: Function[] = [];

    private readonly proxyLegendToolbar: HTMLDivElement;
    private readonly proxyLegendPagination: HTMLDivElement;
    private proxyPrevButton?: HTMLButtonElement;
    private proxyNextButton?: HTMLButtonElement;
    private pendingHighlightDatum?: HighlightNodeDatum;

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
            id: ID_LEGEND_VISIBILITY,
            type: 'legend',
            label: 'contextMenuToggleSeriesVisibility',
            action: (params) => this.contextToggleVisibility(params),
        });
        ctx.contextMenuRegistry.registerDefaultAction({
            id: ID_LEGEND_OTHER_SERIES,
            type: 'legend',
            label: 'contextMenuToggleOtherSeries',
            action: (params) => this.contextToggleOtherSeries(params),
        });

        const { Default, Animation, ContextMenu } = InteractionState;
        const animationState = Default | Animation;
        const contextMenuState = Default | Animation | ContextMenu;
        const region = ctx.regionManager.addRegion('legend', this.group);
        this.destroyFns.push(
            region.addListener('contextmenu', (e) => this.checkContextClick(e), contextMenuState),
            region.addListener('click', (e) => this.checkLegendClick(e), animationState),
            region.addListener('dblclick', (e) => this.checkLegendDoubleClick(e), animationState),
            region.addListener('hover', (e) => this.handleLegendMouseMove(e), animationState),
            region.addListener('leave', () => this.handleLegendMouseExit(), animationState),
            region.addListener('enter', (e) => this.handleLegendMouseEnter(e), animationState),
            ctx.layoutService.addListener('start-layout', (e) => this.positionLegend(e)),
            ctx.localeManager.addListener('locale-changed', () => this.onLocaleChanged()),
            () => this.group.parent?.removeChild(this.group)
        );

        this.proxyLegendToolbar = this.ctx.proxyInteractionService.createProxyContainer({
            type: 'toolbar',
            id: `${this.id}-toolbar`,
            classList: ['ag-charts-proxy-legend-toolbar'],
            ariaLabel: { id: 'ariaLabelLegend' },
            ariaOrientation: 'horizontal',
            ariaHidden: true,
        });
        this.proxyLegendPagination = this.ctx.proxyInteractionService.createProxyContainer({
            type: 'group',
            id: `${this.id}-pagination`,
            classList: ['ag-charts-proxy-legend-pagination'],
            ariaLabel: { id: 'ariaLabelLegendPagination' },
            ariaOrientation: 'horizontal',
            ariaHidden: true,
        });
    }

    public destroy() {
        this.ctx.domManager.removeChild('canvas-overlay', `${this.id}-toolbar`);
        this.ctx.domManager.removeChild('canvas-overlay', `${this.id}-pagination`);
        this.destroyFns.forEach((f) => f());

        this.pagination.destroy();
        this.itemSelection.clear();
    }

    private initLegendItemToolbar() {
        this.itemSelection.each((markerLabel, _, i) => {
            // Create the hidden CSS button.
            markerLabel.proxyButton ??= this.ctx.proxyInteractionService.createProxyElement({
                type: 'button',
                id: `ag-charts-legend-item-${i}`,
                textContent: this.getItemAriaText(i),
                parent: this.proxyLegendToolbar,
                focusable: markerLabel,
                // Retrieve the datum from the node rather than from the method parameter.
                // The method parameter `datum` gets destroyed when the data is refreshed
                // using Series.getLegendData(). But the scene node will stay the same.
                onclick: () => {
                    this.doClick(markerLabel.datum);
                    markerLabel.proxyButton!.textContent = this.getItemAriaText(i, !markerLabel.datum.enabled);
                },
                onblur: () => this.handleLegendMouseExit(),
                onfocus: () => {
                    const bounds = markerLabel?.computeTransformedBBox();
                    const event = makeKeyboardPointerEvent(this.ctx.focusIndicator, { bounds, showFocusBox: true });
                    this.doHover(event, markerLabel.datum);
                    this.pagination.setPage(markerLabel.pageIndex);
                },
            });
        });

        const buttons: HTMLButtonElement[] = this.itemSelection
            .nodes()
            .map((markerLabel) => markerLabel.proxyButton)
            .filter((button): button is HTMLButtonElement => !!button);
        initToolbarKeyNav({
            orientation: this.getOrientation(),
            buttons,
            toolbar: this.proxyLegendToolbar,
        });
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
        const proxyToolbarNeedsUpdate = this.itemSelection.nodes().length === 0;
        this.itemSelection.update(data);

        if (proxyToolbarNeedsUpdate) {
            this.initLegendItemToolbar();
        }

        // Update properties that affect the size of the legend items and measure them.
        const bboxes: BBox[] = [];

        const font = TextUtils.toFontString(label);

        const itemMaxWidthPercentage = 0.8;
        const maxItemWidth = maxWidth ?? width * itemMaxWidthPercentage;

        const spriteDims = this.calculateSpriteDimensions();
        this.spriteRenderer.resize(spriteDims);

        this.itemSelection.each((markerLabel, datum) => {
            markerLabel.fontStyle = fontStyle;
            markerLabel.fontWeight = fontWeight;
            markerLabel.fontSize = fontSize;
            markerLabel.fontFamily = fontFamily;

            const paddedSymbolWidth = this.updateMarkerLabel(markerLabel, datum, spriteDims);
            const id = datum.itemId ?? datum.id;
            const labelText = this.getItemLabel(datum);
            const text = (labelText ?? '<unknown>').replace(/\r?\n/g, ' ');
            markerLabel.text = this.truncate(text, maxLength, maxItemWidth, paddedSymbolWidth, font, id);

            bboxes.push(markerLabel.getBBox());
        });

        width = Math.max(1, width);
        height = Math.max(1, height);

        if (!isFinite(width)) {
            return {};
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

    private calcSymbolsEnabled(symbol: LegendSymbolOptions) {
        const { showSeriesStroke, marker } = this.item;
        const markerEnabled = !!marker.enabled || !showSeriesStroke || (symbol.marker.enabled ?? true);
        const lineEnabled = !!(symbol.line && showSeriesStroke);
        return { markerEnabled, lineEnabled };
    }

    private calcSymbolsLengths(symbol: LegendSymbolOptions) {
        const { marker, line } = this.item;
        const { markerEnabled, lineEnabled } = this.calcSymbolsEnabled(symbol);
        const { strokeWidth: markerStrokeWidth } = this.getMarkerStyles(symbol);
        const { strokeWidth: lineStrokeWidth } = lineEnabled ? this.getLineStyles(symbol) : { strokeWidth: 0 };

        const markerLength = markerEnabled ? marker.size : 0;
        const lineLength = lineEnabled ? line.length ?? 25 : 0;
        return { markerLength, markerStrokeWidth, lineLength, lineStrokeWidth };
    }

    private calculateSpriteDimensions(): SpriteDimensions {
        // AG-11950 Calculate the length of the longest legend symbol to ensure that the text / symbols stay aligned.
        let spriteAAPadding = 0;
        let spriteWidth = 0;
        let spriteHeight = 0;
        let markerWidth = 0;
        this.itemSelection.each((_, datum) => {
            datum.symbols.forEach((symbol) => {
                const { markerLength, markerStrokeWidth, lineLength, lineStrokeWidth } =
                    this.calcSymbolsLengths(symbol);
                const markerTotalLength = markerLength + markerStrokeWidth;
                markerWidth = Math.max(markerWidth, lineLength, markerLength);
                spriteWidth = Math.max(spriteWidth, lineLength, markerTotalLength);
                spriteHeight = Math.max(spriteHeight, lineStrokeWidth, markerTotalLength);
                // Add +0.5 padding to handle cases where the X/Y pixel coordinates are not integers
                // (We need this extra row/column of pixels because legend's sprite render will use
                // integers for X/Y coords).
                spriteAAPadding = Math.max(spriteAAPadding, markerStrokeWidth + 0.5);
            });
        });
        spriteWidth += spriteAAPadding * 2;
        spriteHeight += spriteAAPadding * 2;
        const spritePixelRatio = getWindow().devicePixelRatio;
        return { spritePixelRatio, spriteAAPadding, spriteWidth, spriteHeight, markerWidth };
    }

    private updateMarkerLabel(
        markerLabel: LegendMarkerLabel,
        datum: CategoryLegendDatum,
        spriteDims: SpriteDimensions
    ): number {
        const { marker: itemMarker, paddingX } = this.item;
        const { markerWidth } = spriteDims;
        const dimensionProps: { length: number; spacing: number }[] = [];
        let paddedSymbolWidth = paddingX;

        if (markerLabel.markers.length !== datum.symbols.length && markerLabel.lines.length !== datum.symbols.length) {
            const markers: Marker[] = [];
            const lines: Line[] = [];

            datum.symbols.forEach((symbol) => {
                const { shape: markerShape = symbol.marker.shape } = itemMarker;
                const MarkerCtr = getMarker(markerShape);

                lines.push(new Line());
                // Important! marker must be created after line to ensure zIndex correctness
                markers.push(new MarkerCtr());
            });

            markerLabel.updateSymbols(markers, lines);
        }

        datum.symbols.forEach((symbol, i) => {
            const spacing = symbol.marker.padding ?? itemMarker.padding;
            const { markerEnabled, lineEnabled } = this.calcSymbolsEnabled(symbol);

            markerLabel.markers[i].size = markerEnabled || !lineEnabled ? itemMarker.size : 0;
            dimensionProps.push({ length: markerWidth, spacing });

            if (markerEnabled || lineEnabled) {
                paddedSymbolWidth += spacing + markerWidth;
            }

            const marker = markerLabel.markers[i];
            const line = markerLabel.lines[i];

            if (marker) {
                const { strokeWidth, fill, stroke, fillOpacity, strokeOpacity } = this.getMarkerStyles(symbol);

                marker.fill = fill;
                marker.stroke = stroke;
                marker.strokeWidth = strokeWidth;
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

        markerLabel.update(this.spriteRenderer, spriteDims, dimensionProps);
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
        let addEllipsis = false;
        if (text.length > maxCharLength) {
            text = text.substring(0, maxCharLength);
            addEllipsis = true;
        }

        const measurer = CachedTextMeasurerPool.getMeasurer({ font });
        const result = TextWrapper.truncateLine(text, measurer, maxItemWidth - paddedMarkerWidth, addEllipsis);

        if (result.endsWith(TextUtils.EllipsisChar)) {
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

    private updateItemProxyButtons() {
        this.itemSelection.each((markerLabel) => {
            const bbox = markerLabel.computeTransformedBBox()?.clone();
            bbox.translate(this.group.translationX, this.group.translationY);
            setElementBBox(markerLabel.proxyButton, bbox);
        });
    }

    private updatePaginationProxyButtons(oldPages: Page[] | undefined) {
        this.proxyLegendPagination.style.display = this.pagination.visible ? 'absolute' : 'none';

        const oldNeedsButtons = (oldPages?.length ?? this.pages.length) > 1;
        const newNeedsButtons = this.pages.length > 1;

        if (oldNeedsButtons !== newNeedsButtons) {
            if (newNeedsButtons) {
                this.proxyPrevButton = this.ctx.proxyInteractionService.createProxyElement({
                    type: 'button',
                    id: `${this.id}-prev-page`,
                    textContent: { id: 'ariaLabelLegendPagePrevious' },
                    tabIndex: 0,
                    parent: this.proxyLegendPagination,
                    focusable: this.pagination.previousButton,
                    onclick: () => this.pagination.clickPrevious(),
                });
                this.proxyNextButton ??= this.ctx.proxyInteractionService.createProxyElement({
                    type: 'button',
                    id: `${this.id}-next-page`,
                    textContent: { id: 'ariaLabelLegendPageNext' },
                    tabIndex: 0,
                    parent: this.proxyLegendPagination,
                    focusable: this.pagination.nextButton,
                    onclick: () => this.pagination.clickNext(),
                });
            } else {
                this.proxyNextButton?.remove();
                this.proxyPrevButton?.remove();
                [this.proxyNextButton, this.proxyPrevButton] = [undefined, undefined];
            }
        }

        const { prev, next } = this.pagination.computeCSSBounds();
        setElementBBox(this.proxyPrevButton, prev);
        setElementBBox(this.proxyNextButton, next);
    }

    private calculatePagination(bboxes: BBox[], width: number, height: number) {
        const { paddingX: itemPaddingX, paddingY: itemPaddingY } = this.item;

        const orientation = this.getOrientation();
        const paginationVertical = ['left', 'right'].includes(this.position);

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
            lastPassPaginationBBox = this.pagination.getBBox();

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
            // Track the middle item on the page.
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
            markerLabel.setEnabled(datum.enabled);
            markerLabel.color = color;
        });

        this.updateContextMenu();
    }

    private updateContextMenu() {
        const { toggleSeries } = this;
        this.ctx.contextMenuRegistry.setActionVisiblity(ID_LEGEND_VISIBILITY, toggleSeries);
        this.ctx.contextMenuRegistry.setActionVisiblity(ID_LEGEND_OTHER_SERIES, toggleSeries);
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
            if (!(child instanceof LegendMarkerLabel)) continue;

            const childBBox = child.getBBox().clone();
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
        let actualBBox = this.group.getBBox();
        if (this.pages.length <= 1) {
            return actualBBox;
        }

        const [maxPageWidth, maxPageHeight] = this.maxPageSize;
        actualBBox = actualBBox.clone();
        actualBBox.height = Math.max(maxPageHeight, actualBBox.height);
        actualBBox.width = Math.max(maxPageWidth, actualBBox.width);

        return actualBBox;
    }

    private contextToggleVisibility(params: AgChartLegendContextMenuEvent) {
        const datum = this.data.find((v) => v.itemId === params.itemId);
        this.doClick(datum);
    }

    private contextToggleOtherSeries(params: AgChartLegendContextMenuEvent) {
        const datum = this.data.find((v) => v.itemId === params.itemId);
        this.doDoubleClick(datum);
    }

    private checkContextClick(event: PointerInteractionEvent<'contextmenu'>) {
        const legendItem = this.getDatumForPoint(event.offsetX, event.offsetY);

        if (this.preventHidingAll && this.contextMenuDatum?.enabled && this.getVisibleItemCount() <= 1) {
            this.ctx.contextMenuRegistry.disableAction(ID_LEGEND_VISIBILITY);
        } else {
            this.ctx.contextMenuRegistry.enableAction(ID_LEGEND_VISIBILITY);
        }

        this.ctx.contextMenuRegistry.dispatchContext('legend', event, { legendItem });
    }

    private checkLegendClick(event: PointerInteractionEvent<'click'>) {
        const datum = this.getDatumForPoint(event.offsetX, event.offsetY);
        if (this.doClick(datum)) {
            event.preventDefault();
        }
    }

    private getVisibleItemCount(): number {
        return this.ctx.chartService.series.flatMap((s) => s.getLegendData('category')).filter((d) => d.enabled).length;
    }

    private doClick(datum: CategoryLegendDatum | undefined): boolean {
        const {
            listeners: { legendItemClick },
            ctx: { chartService, highlightManager },
            preventHidingAll,
            toggleSeries,
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
        if (toggleSeries) {
            newEnabled = !enabled;

            if (preventHidingAll && !newEnabled) {
                const numVisibleItems = this.getVisibleItemCount();
                if (numVisibleItems < 2) {
                    newEnabled = true;
                }
            }

            const status: string = newEnabled ? 'ariaAnnounceVisible' : 'ariaAnnounceHidden';
            this.ctx.ariaAnnouncementService.announceValue(status);
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
            event.preventDefault();
        }
    }

    private doDoubleClick(datum: CategoryLegendDatum | undefined): boolean {
        const {
            listeners: { legendItemDoubleClick },
            ctx: { chartService },
            toggleSeries,
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

        if (toggleSeries) {
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
        event.preventDefault();

        const datum = this.getDatumForPoint(offsetX, offsetY);
        this.doHover(event, datum);
    }

    private doHover(
        event: TooltipPointerEvent<'hover' | 'keyboard'> | undefined,
        datum: CategoryLegendDatum | undefined
    ) {
        const { toggleSeries, listeners } = this;

        if (event === undefined || datum === undefined) {
            this.ctx.cursorManager.updateCursor(this.id);
            this.updateHighlight();
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

        if (toggleSeries || listeners.legendItemClick != null || listeners.legendItemDoubleClick != null) {
            this.ctx.cursorManager.updateCursor(this.id, 'pointer');
        }

        if (datum?.enabled && series) {
            this.updateHighlight({
                series,
                itemId: datum?.itemId,
                datum: undefined,
            });
        } else {
            this.updateHighlight();
        }
    }

    private handleLegendMouseExit() {
        this.ctx.cursorManager.updateCursor(this.id);
        this.ctx.tooltipManager.removeTooltip(this.id);
        this.updateHighlight();
    }

    private updateHighlight(datum?: HighlightNodeDatum) {
        const state = this.ctx.interactionManager.getState();
        if (state === InteractionState.Default) {
            this.ctx.highlightManager.updateHighlight(this.id, datum);
        } else if (state === InteractionState.Animation) {
            // Updating the highlight can interrupt animations, so only clear the highlight if the chart
            // is in a state when highlighting is possible.
            this.pendingHighlightDatum = datum;
            this.ctx.animationManager.onBatchStop(() => {
                this.ctx.highlightManager.updateHighlight(this.id, this.pendingHighlightDatum);
            });
        }
    }

    private handleLegendMouseEnter(event: PointerInteractionEvent<'enter'>) {
        const {
            enabled,
            toggleSeries,
            listeners: { legendItemClick: clickListener, legendItemDoubleClick: dblclickListener },
        } = this;
        const datum = this.getDatumForPoint(event.offsetX, event.offsetY);
        if (enabled && datum !== undefined && (toggleSeries || clickListener != null || dblclickListener != null)) {
            this.ctx.cursorManager.updateCursor(this.id, 'pointer');
        }
    }

    private onLocaleChanged() {
        this.itemSelection.each(({ proxyButton }, _, i) => {
            if (proxyButton != null) {
                proxyButton.textContent = this.getItemAriaText(i);
            }
        });
    }

    private getItemAriaText(nodeIndex: number, enabled?: boolean): string {
        const datum = this.data[nodeIndex];
        const label = datum && this.getItemLabel(datum);
        enabled ??= datum.enabled;
        const lm = this.ctx.localeManager;
        if (nodeIndex >= 0 && label) {
            const index = nodeIndex + 1;
            const count = this.data.length;
            const part1 = lm.t('ariaLabelLegendItem', { label, index, count });
            const part2 = lm.t(enabled ? 'ariaAnnounceVisible' : 'ariaAnnounceHidden');
            return [part1, part2].join('');
        }
        return lm.t('ariaLabelLegendItemUnknown');
    }

    private positionLegend(ctx: LayoutContext) {
        if (!this.enabled || !this.data.length) return;

        const { layoutRect } = ctx;
        const { x, y, width, height } = layoutRect;
        const [legendWidth, legendHeight] = this.calculateLegendDimensions(layoutRect);

        this.group.translationX = 0;
        this.group.translationY = 0;
        const { oldPages } = this.calcLayout(legendWidth, legendHeight);
        const legendBBox = this.computePagedBBox();

        const calculateTranslationPerpendicularDimension = () => {
            switch (this.position) {
                case 'top':
                case 'left':
                    return 0;
                case 'bottom':
                    return height - legendBBox.height;
                case 'right':
                default:
                    return width - legendBBox.width;
            }
        };

        if (this.visible) {
            const legendPadding = this.spacing;

            let translationX;
            let translationY;

            switch (this.position) {
                case 'top':
                case 'bottom':
                    translationX = (width - legendBBox.width) / 2;
                    translationY = calculateTranslationPerpendicularDimension();
                    layoutRect.shrink(legendBBox.height + legendPadding, this.position);
                    break;

                case 'left':
                case 'right':
                default:
                    translationX = calculateTranslationPerpendicularDimension();
                    translationY = (height - legendBBox.height) / 2;
                    layoutRect.shrink(legendBBox.width + legendPadding, this.position);
            }

            // Round off for pixel grid alignment to work properly.
            this.group.translationX = Math.floor(x - legendBBox.x + translationX);
            this.group.translationY = Math.floor(y - legendBBox.y + translationY);

            this.proxyLegendToolbar.style.removeProperty('display');
            this.proxyLegendToolbar.ariaOrientation = this.getOrientation();
        } else {
            this.proxyLegendToolbar.style.display = 'none';
        }

        this.updateItemProxyButtons();
        this.updatePaginationProxyButtons(oldPages);
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

            case 'left':
            case 'right':
            default:
                // A vertical legend should take maximum between 25 and 50 percent of the chart width if width is larger than height
                // and maximum 25 percent of the chart width if width is smaller than height.
                const widthCoefficient =
                    aspectRatio > 1 ? Math.min(maxCoefficient, minWidthCoefficient * aspectRatio) : minWidthCoefficient;
                legendWidth = this.maxWidth ? Math.min(this.maxWidth, width) : Math.round(width * widthCoefficient);
                legendHeight = this.maxHeight ? Math.min(this.maxHeight, height) : height;
        }

        return [legendWidth, legendHeight];
    }
}
