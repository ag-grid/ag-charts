import type { AgChartLegendPlacement, AgStatusBarRendererItem, _ModuleSupport } from 'ag-charts-community';
import {
    BBox,
    EllipsisChar,
    Group,
    type NormalisedContentSegment,
    type NormalisedStatusBarFontOptions,
    type NormalisedStatusBarOptions,
    Rect,
    Text,
    TranslatableGroup,
    appendEllipsis,
    cachedTextMeasurer,
    drawnLineHeight,
    expandLegendPosition,
    isArray,
    isString,
    placementOffset,
    placementSide,
    resolvePadding,
    toTextString,
    truncateLine,
    wrapTextOrSegments,
} from 'ag-charts-core';

const INNER_SPACING = 4;
const OUTER_SPACING = 12;
const SPACING = 8;

interface ItemNodes {
    readonly label: Text;
    readonly value: Text;
}

/** Flows the renderer's label and value pairs into a box sized at layout, so hovering never moves the chart. */
export class StatusBarItemsView {
    readonly group = new TranslatableGroup({ name: 'StatusBarItems' });
    private readonly background = this.group.appendChild(new Rect());
    private readonly content = this.group.appendChild(new Group({ name: 'StatusBarItemsContent' }));
    private readonly nodes: ItemNodes[] = [];

    private area = new BBox(0, 0, 0, 0);
    private placement: AgChartLegendPlacement = 'top-left';
    private offset = { x: 0, y: 0 };
    private alignToSeries = false;
    private seriesWidth?: number;
    private contentWidth = 0;
    private contentHeight = 0;
    private maxContentHeight = 0;
    private relayoutPending = false;
    private items: readonly AgStatusBarRendererItem[] = [];
    private sizingItems: readonly AgStatusBarRendererItem[] = [];

    performLayout(
        { layoutBox, width, height }: _ModuleSupport.LayoutContext,
        opts: NormalisedStatusBarOptions,
        items: readonly AgStatusBarRendererItem[]
    ) {
        const padding = resolvePadding(opts.padding);
        const horizontalPadding = padding.left + padding.right;
        const verticalPadding = padding.top + padding.bottom;

        const { position } = opts;
        const { placement, floating, xOffset, yOffset } =
            position == null
                ? { placement: 'top-left' as const, floating: false, xOffset: 0, yOffset: 0 }
                : expandLegendPosition(position);
        const area = floating ? new BBox(0, 0, width, height) : layoutBox.clone();
        const side = placementSide(placement);
        const vertical = !floating && (side === 'left' || side === 'right');
        const alignToSeries = position == null;
        // The series width is only known after layout, so the previous layout's stands in for it.
        const areaWidth = alignToSeries ? Math.min(area.width, this.seriesWidth ?? Infinity) : area.width;

        const maxWidth = Math.max(0, Math.min(opts.maxWidth ?? Infinity, areaWidth) - horizontalPadding);
        const maxHeight = Math.max(0, Math.min(opts.maxHeight ?? Infinity, area.height) - verticalPadding);
        const measured = this.flow(opts, items, maxWidth, maxHeight);

        this.contentWidth = vertical ? measured.width : maxWidth;
        this.contentHeight = vertical ? maxHeight : measured.height;
        this.maxContentHeight = maxHeight;
        this.sizingItems = items;
        this.placement = placement;
        this.offset = { x: xOffset, y: yOffset };
        this.alignToSeries = alignToSeries;
        this.area = area;

        if (!floating && items.length > 0) {
            const extent = vertical ? measured.width + horizontalPadding : measured.height + verticalPadding;
            layoutBox.shrink(extent + SPACING, side);
        }
    }

    /** Returns whether the reserved height no longer fits the items at the final series width. */
    onLayoutComplete(seriesRect: BBox, opts: NormalisedStatusBarOptions): boolean {
        this.seriesWidth = seriesRect.width;
        let relayout = false;
        if (this.alignToSeries) {
            this.area = new BBox(seriesRect.x, this.area.y, seriesRect.width, this.area.height);
            const { left, right } = resolvePadding(opts.padding);
            const seriesContentWidth = Math.max(
                0,
                Math.min(opts.maxWidth ?? Infinity, seriesRect.width) - left - right
            );
            if (this.contentWidth !== seriesContentWidth) {
                const shown = this.items;
                this.contentWidth = seriesContentWidth;
                const { height } = this.flow(opts, this.sizingItems, seriesContentWidth, this.maxContentHeight);
                // One extra layout at most, in case the new height in turn changes the series width.
                relayout = height !== this.contentHeight && !this.relayoutPending;
                this.flow(opts, shown, this.contentWidth, this.contentHeight);
            }
        }
        this.relayoutPending = relayout;
        this.position(opts);
        return relayout;
    }

    update(opts: NormalisedStatusBarOptions, items: readonly AgStatusBarRendererItem[]) {
        this.flow(opts, items, this.contentWidth, this.contentHeight);
        this.position(opts);
    }

    private flow(
        opts: NormalisedStatusBarOptions,
        items: readonly AgStatusBarRendererItem[],
        maxWidth: number,
        maxHeight: number
    ) {
        this.items = items;
        this.group.visible = items.length > 0;
        const lineHeight = Math.max(lineHeightOf(opts.label), lineHeightOf(opts.value));
        const wraps = opts.wrapping !== 'never';
        const { nodes } = this;

        let x = 0;
        let y = 0;
        let width = 0;
        let lastShown: ItemNodes | undefined;
        for (let i = 0; i < Math.max(items.length, nodes.length); i++) {
            const item = items[i];
            const node = nodes[i] ?? this.createNodes();
            if (item == null) {
                node.label.visible = false;
                node.value.visible = false;
                continue;
            }

            const labelWidth = setText(node.label, item.label, opts.label, opts.label.color);
            const valueWidth = setText(node.value, item.value, opts.value, opts.label.color);
            let labelExtent = labelWidth > 0 ? labelWidth + INNER_SPACING : 0;
            let itemWidth = labelExtent + valueWidth;

            if (x > 0 && wraps && x + itemWidth > maxWidth) {
                x = 0;
                y += lineHeight;
            }

            const visible = y + lineHeight <= maxHeight && x < maxWidth;
            node.label.visible = visible && labelWidth > 0;
            node.value.visible = visible;
            if (!visible) {
                if (lastShown != null && opts.truncate) {
                    const { value } = lastShown;
                    const truncatedWidth = truncateText(value, opts.value, maxWidth - value.x, true);
                    width = Math.max(width, value.x + truncatedWidth);
                }
                lastShown = undefined;
                continue;
            }

            if (x + itemWidth > maxWidth && opts.truncate) {
                const available = maxWidth - x;
                // The value keeps at least half the room, so a long label cannot squeeze it out entirely.
                const labelMax = Math.max(available / 2, available - valueWidth) - INNER_SPACING;
                if (labelWidth > labelMax) {
                    labelExtent = truncateText(node.label, opts.label, labelMax, false) + INNER_SPACING;
                }
                itemWidth = labelExtent + truncateText(node.value, opts.value, available - labelExtent, false);
            }

            node.label.x = x;
            node.label.y = y;
            node.value.x = x + labelExtent;
            node.value.y = y;

            x += itemWidth;
            width = Math.max(width, Math.min(x, maxWidth));
            x += OUTER_SPACING;
            lastShown = node;
        }

        const height = items.length === 0 ? 0 : Math.min(y + lineHeight, maxHeight);
        this.updateBackground(opts, width, height);
        this.content.setClipRectCanvasSpace(new BBox(0, 0, maxWidth, height));
        return { width, height };
    }

    private position(opts: NormalisedStatusBarOptions) {
        const { background, area, placement, offset } = this;
        const { x, y } = placementOffset(placement, area.width, area.height, background.width, background.height);
        const padding = resolvePadding(opts.padding);
        this.group.translationX = Math.floor(area.x + x + offset.x + padding.left);
        this.group.translationY = Math.floor(area.y + y + offset.y + padding.top);
        background.x = -padding.left;
        background.y = -padding.top;
    }

    private updateBackground(opts: NormalisedStatusBarOptions, width: number, height: number) {
        const { background } = this;
        const padding = resolvePadding(opts.padding);
        background.width = width + padding.left + padding.right;
        background.height = height + padding.top + padding.bottom;
        background.fill = opts.fill;
        background.fillOpacity = opts.fillOpacity ?? 1;
        background.cornerRadius = opts.cornerRadius ?? 0;
        const border = opts.border;
        const stroked = border?.enabled === true;
        background.stroke = stroked ? border.stroke : undefined;
        background.strokeWidth = stroked ? border.strokeWidth : 0;
        background.strokeOpacity = stroked ? border.strokeOpacity : 1;
    }

    private createNodes(): ItemNodes {
        const nodes = { label: this.content.appendChild(new Text()), value: this.content.appendChild(new Text()) };
        this.nodes.push(nodes);
        return nodes;
    }
}

function lineHeightOf(font: NormalisedStatusBarFontOptions) {
    if (font.lineHeight != null) return drawnLineHeight(font);
    const { ascent, descent } = cachedTextMeasurer(font).measureText('');
    return ascent + descent;
}

function setText(
    node: Text,
    text: AgStatusBarRendererItem['value'] | undefined,
    font: NormalisedStatusBarFontOptions,
    color: string
) {
    node.setFont(font);
    node.fill = color;
    node.textAlign = 'left';
    node.textBaseline = 'top';
    node.text = text;
    if (text == null || text === '') return 0;
    return isString(text) ? cachedTextMeasurer(font).textWidth(text) : node.getBBox().width;
}

function truncateText(node: Text, font: NormalisedStatusBarFontOptions, maxWidth: number, ellipsisForce: boolean) {
    const { text } = node;
    const width = Math.max(0, maxWidth);
    if (isString(text)) {
        const measurer = cachedTextMeasurer(font);
        node.text = truncateLine(text, measurer, width, ellipsisForce);
        return measurer.textWidth(node.text);
    }
    if (!isArray(text)) return node.getBBox().width;
    const segments = ellipsisForce ? withEllipsis(text) : text;
    node.text = wrapTextOrSegments(segments, { font, maxWidth: width, textWrap: 'never' });
    return node.getBBox().width;
}

function withEllipsis(segments: NormalisedContentSegment[]): NormalisedContentSegment[] {
    const last = segments.at(-1);
    if (last == null || last.type === 'image') return [...segments, { text: EllipsisChar }];
    return [...segments.slice(0, -1), { ...last, text: appendEllipsis(toTextString(last.text)) }];
}
