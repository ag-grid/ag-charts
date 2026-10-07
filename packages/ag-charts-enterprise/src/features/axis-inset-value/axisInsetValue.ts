import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    type FontOptions,
    ZIndexMap,
    cachedTextMeasurer,
    callWithContext,
    createId,
    isFiniteNumber,
} from 'ag-charts-core';
import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { AxisInsetValueLabelOptions, AxisInsetValueOptions } from './axisInsetValueTypes';

const { LayoutElement, Rect, Selection, Text, TranslatableGroup, fitLabelToContainer } = _ModuleSupport;

type AxisContext = _ModuleSupport.AxisContext;

const DEFAULT_FONT_SIZE = 12;

/** The strip width when it is automatic but there are no labels to size it by. */

/** Thickness below which a block is too thin to carry a readable label. */
const MIN_LABEL_THICKNESS_PX = 2;

interface InsetBlock {
    /** The block's extent along the axis, relative to the series area. */
    readonly start: number;
    readonly end: number;
    readonly text: string;
}

const NO_ROWS: readonly InsetRow[] = [];

interface InsetRow {
    readonly category: any;
    readonly value: number;
    readonly datum: any;
}

/**
 * A fixed-width strip between the axis at `position` and the series area, holding one filled block per
 * category with its value as a label. The strip is reserved through the layout (`seriesInsets`), so the
 * series area shrinks to make room exactly as it does for the axis itself.
 */
export class AxisInsetValue extends AbstractModuleInstance {
    static readonly className = 'AxisInsetValue';
    readonly id = createId(this);

    private options: AxisInsetValueOptions | undefined;
    private readonly axisCtx: AxisContext;
    private seriesRect: _ModuleSupport.BBox | undefined;
    private rowCache: { data: any[]; categoryKey: string; valueKey: string; rows: InsetRow[] } | undefined;
    private textCache:
        | { rows: readonly InsetRow[]; formatter: AxisInsetValueLabelOptions['formatter']; texts: readonly string[] }
        | undefined;
    private autoWidth: { texts: readonly string[]; font: FontOptions; padding: number; width: number } | undefined;

    private readonly group = new TranslatableGroup({ name: 'axisInsetValue', zIndex: ZIndexMap.AXIS_FOREGROUND });
    private readonly blockSelection: _ModuleSupport.Selection<InsetBlock, _ModuleSupport.Rect<InsetBlock>>;
    private readonly labelSelection: _ModuleSupport.Selection<InsetBlock, _ModuleSupport.Text<InsetBlock>>;

    constructor(private readonly ctx: _ModuleSupport.ChartAxisRegistry<AxisContext>) {
        super();

        this.axisCtx = ctx.parent;
        this.blockSelection = Selection.select<_ModuleSupport.Rect<InsetBlock>>(
            this.group,
            () => new Rect({ name: 'axis-inset-value-block' })
        );
        this.labelSelection = Selection.select<_ModuleSupport.Text<InsetBlock>>(
            this.group,
            () => new Text({ name: 'axis-inset-value-label' })
        );

        this.cleanup.register(
            ctx.scene.attachNode(this.group),
            ctx.layoutManager.registerElement(LayoutElement.SeriesInset, (layout) => {
                const { enabled, position } = this.options ?? {};
                if (enabled && position != null) {
                    layout.seriesInsets[position] = this.resolveWidth();
                }
            }),
            // Text measured before a web font loads is narrower than the font that replaces it.
            ctx.eventsHub.on('font:load', () => {
                this.autoWidth = undefined;
            }),
            ctx.eventsHub.on('layout:complete', ({ series }) => {
                this.seriesRect = series.rect.clone();
                this.redraw();
            })
        );
    }

    applyOptions(options: AxisInsetValueOptions) {
        this.options = options;
        this.redraw();
    }

    onAxisUpdate() {
        this.redraw();
    }

    private redraw() {
        const { options, seriesRect } = this;
        const position = options?.position;
        if (!options?.enabled || position == null || seriesRect == null) {
            this.hide();
            return;
        }
        const width = this.resolveWidth();

        // The blocks sit along the axis' own direction, so the strip must run parallel to it.
        const horizontal = position === 'top' || position === 'bottom';
        const direction = this.axisCtx.direction;
        const parallel = direction === (horizontal ? ChartAxisDirection.X : ChartAxisDirection.Y);
        const length = horizontal ? seriesRect.width : seriesRect.height;
        if (!parallel || width <= 0 || length <= 0) {
            this.hide();
            return;
        }

        const blocks = this.collectBlocks();
        this.group.visible = true;
        const strip = this.stripOrigin(position, width, seriesRect);
        this.group.translationX = strip.x;
        this.group.translationY = strip.y;
        // setClipRect takes canvas coordinates, so the clip follows the group's translation.
        this.group.setClipRect(
            new _ModuleSupport.BBox(
                this.group.translationX,
                this.group.translationY,
                horizontal ? length : width,
                horizontal ? width : length
            )
        );

        this.blockSelection.update(blocks);
        this.labelSelection.update(blocks);

        const { fill, fillOpacity = 1 } = options;
        this.blockSelection.each((rect, block) => {
            rect.fill = fill as string | undefined; // theme references are resolved before options arrive
            rect.fillOpacity = fillOpacity;
            rect.strokeWidth = 0;
            rect.x = horizontal ? block.start : 0;
            rect.y = horizontal ? 0 : block.start;
            rect.width = horizontal ? block.end - block.start : width;
            rect.height = horizontal ? width : block.end - block.start;
        });

        this.updateLabels(horizontal, width);
    }

    /** The top-left corner of the strip, which abuts the series area on the side given by `position`. */
    private stripOrigin(position: AgCartesianAxisPosition, width: number, rect: _ModuleSupport.BBox) {
        const origins: Record<AgCartesianAxisPosition, { x: number; y: number }> = {
            left: { x: rect.x - width, y: rect.y },
            right: { x: rect.x + rect.width, y: rect.y },
            top: { x: rect.x, y: rect.y - width },
            bottom: { x: rect.x, y: rect.y + rect.height },
        };
        const { x, y } = origins[position];
        return { x: Math.round(x), y: Math.round(y) };
    }

    private hide() {
        this.group.visible = false;
        this.blockSelection.update([]);
        this.labelSelection.update([]);
    }

    private updateLabels(horizontal: boolean, width: number) {
        const label = this.options?.label;
        const padding = label?.padding ?? 0;
        const font = this.labelFont();
        const fontSize = label?.fontSize ?? DEFAULT_FONT_SIZE;

        this.labelSelection.each((node, block) => {
            const thickness = block.end - block.start;
            const visible = label?.enabled !== false && thickness >= Math.max(fontSize, MIN_LABEL_THICKNESS_PX);
            node.visible = visible;
            if (!visible) return;

            node.fill = label?.color as string | undefined;
            node.fontFamily = font.fontFamily;
            node.fontSize = fontSize;
            node.fontStyle = font.fontStyle;
            node.fontWeight = font.fontWeight;
            node.textAlign = 'center';
            node.textBaseline = 'middle';
            node.text = fitLabelToContainer(block.text, { wrapping: 'never', overflowStrategy: 'ellipsis' }, font, {
                width: Math.max(horizontal ? thickness : width - padding * 2, 0),
                height: horizontal ? width : thickness,
            });
            node.x = horizontal ? block.start + thickness / 2 : width / 2;
            node.y = horizontal ? width / 2 : block.start + thickness / 2;
        });
    }

    /** The strip thickness: `width` when given, else the widest label's width, but at least `minWidth`. */
    private resolveWidth(): number {
        const { width, minWidth = 0 } = this.options ?? {};
        return width ?? Math.max(minWidth, this.labelsWidth());
    }

    /**
     * Just wide enough for the widest label. Every level is measured, not only those in view, so the strip
     * does not change width as the chart is zoomed or panned.
     */
    private labelsWidth(): number {
        const label = this.options?.label;
        if (label?.enabled === false) return 0;

        const rows = this.readRows();
        const texts = this.formatRows(rows, label?.formatter);
        const font = this.labelFont();
        const padding = label?.padding ?? 0;
        const cache = this.autoWidth;
        if (cache?.texts === texts && cache.padding === padding && this.sameFont(cache.font, font)) return cache.width;

        const measurer = cachedTextMeasurer(font);
        // Along the category axis the strip's thickness is the height of a line of text, not its length.
        const position = this.options?.position;
        if (position === 'top' || position === 'bottom') return Math.ceil(measurer.lineHeight() + padding * 2);

        let widest = 0;
        for (const text of texts) {
            widest = Math.max(widest, measurer.textWidth(text));
        }
        const result = widest > 0 ? Math.ceil(widest + padding * 2) : 0;
        this.autoWidth = { texts, font, padding, width: result };
        return result;
    }

    private sameFont(a: FontOptions, b: FontOptions) {
        return (
            a.fontFamily === b.fontFamily &&
            a.fontSize === b.fontSize &&
            a.fontStyle === b.fontStyle &&
            a.fontWeight === b.fontWeight
        );
    }

    /** The label text of each row, kept while the rows and formatter are unchanged so redraws do not re-run the formatter. */
    private formatRows(rows: readonly InsetRow[], formatter: AxisInsetValueLabelOptions['formatter']) {
        const cache = this.textCache;
        if (cache?.rows === rows && cache.formatter === formatter) return cache.texts;

        const texts = rows.map(({ category, value, datum }) => this.formatValue(category, value, datum, formatter));
        this.textCache = { rows, formatter, texts };
        return texts;
    }

    private labelFont(): FontOptions {
        const label = this.options?.label;
        return {
            fontFamily: label?.fontFamily,
            fontSize: label?.fontSize ?? DEFAULT_FONT_SIZE,
            fontStyle: label?.fontStyle,
            fontWeight: label?.fontWeight,
        };
    }

    /** The levels read from the series bound to the axis, which holds the grouped data presets supply. */
    private readRows(): readonly InsetRow[] {
        const { categoryKey, valueKey } = this.options ?? {};
        if (categoryKey == null || valueKey == null) return NO_ROWS;

        const boundIds = this.axisCtx.seriesIds();
        const series = this.ctx.chartService.series.find((s) => boundIds.includes(s.id));
        const data = (series as { data?: { data?: any[] } } | undefined)?.data?.data;
        if (data == null) return NO_ROWS;

        // Reuse the rows while the series keeps the same data array and keys.
        const cache = this.rowCache;
        if (cache?.data === data && cache.categoryKey === categoryKey && cache.valueKey === valueKey) return cache.rows;

        const rows: InsetRow[] = [];
        for (const datum of data) {
            const value: unknown = datum?.[valueKey];
            // A category with nothing to show gets neither a block nor a label.
            if (isFiniteNumber(value) && value !== 0) rows.push({ category: datum[categoryKey], value, datum });
        }
        this.rowCache = { data, categoryKey, valueKey, rows };
        return rows;
    }

    /** The blocks of the categories in view, valued from the data of the series bound to the axis. */
    private collectBlocks(): InsetBlock[] {
        const rows = this.readRows();
        const texts = this.formatRows(rows, this.options?.label?.formatter);
        const blocks: InsetBlock[] = [];
        for (let i = 0; i < rows.length; i++) {
            const band = this.axisCtx.measureBand(rows[i].category)?.band;
            if (band == null) continue;

            // The axis clamps bands to its range, so a level outside the zoomed range collapses to its edge.
            const [start, end] = band;
            if (end <= start) continue;

            blocks.push({ start, end, text: texts[i] });
        }
        return blocks;
    }

    private formatValue(
        category: unknown,
        value: number,
        datum: unknown,
        formatter: NonNullable<AxisInsetValueOptions['label']>['formatter']
    ): string {
        if (formatter == null) return String(value);

        return (
            callWithContext([this.axisCtx.caller, this.ctx.chartService], formatter, { category, value, datum }) ?? ''
        );
    }
}
