import {
    type AgCollectedValue,
    type AgStatusBarRendererItem,
    type NormalisedTextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartUpdateType,
    CleanupRegistry,
    type DynamicContext,
    Group,
    type NormalisedStatusBarOptions,
    ZIndexMap,
    callWithContext,
    isArray,
    isObjectWithProperty,
    toTextString,
} from 'ag-charts-core';

import { FinancialStatusBarView } from './financialStatusBarView';
import { type StatusBarAnchor, collectAnchoredValues, collectValues } from './statusBarCollection';
import { StatusBarItemsView } from './statusBarItemsView';

const { LayoutElement } = _ModuleSupport;

type StatusBarMode = 'items' | 'financial';

interface RecentAnchor {
    readonly seriesId: string;
    readonly datumIndex: number;
}

interface ResolvedAnchor {
    readonly anchor?: StatusBarAnchor;
    /** Whether the anchor is the hovered datum, rather than the `inactive` fallback. */
    readonly active: boolean;
}

interface RenderedItems {
    readonly key: string;
    readonly items: AgStatusBarRendererItem[];
}

export class StatusBar extends AbstractModuleInstance {
    private readonly layer = new Group({ name: 'StatusBar', zIndex: ZIndexMap.STATUS_BAR });
    private readonly enabledCleanup = new CleanupRegistry();
    private mode?: StatusBarMode;
    private financialView?: FinancialStatusBarView;
    private itemsView?: StatusBarItemsView;

    private recent?: RecentAnchor;
    private rendered?: RenderedItems;
    private sizing?: RenderedItems;

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.cleanup.register(
            ctx.scene.attachNode(this.layer),
            ctx.chartState.observe((get) => {
                if (get('options', 'statusBar.enabled') !== true) return this.setMode(undefined);
                this.setMode(get('options', 'statusBar.closeKey') == null ? 'items' : 'financial');
            }),
            () => this.teardown()
        );
    }

    private get opts(): NormalisedStatusBarOptions {
        return this.ctx.chartState.getValue('options', 'statusBar')!;
    }

    private setMode(mode: StatusBarMode | undefined) {
        if (mode === this.mode) return;
        this.teardown();
        this.mode = mode;
        if (mode == null) return;

        const { ctx } = this;
        if (mode === 'items') {
            const view = new StatusBarItemsView();
            this.itemsView = view;
            this.layer.appendChild(view.group);
            this.enabledCleanup.register(
                ctx.layoutManager.registerElement(LayoutElement.Legend, (e) => this.layoutItems(view, e)),
                ctx.eventsHub.on('layout:complete', (e) => view.onLayoutComplete(e.series.rect, this.opts)),
                ctx.eventsHub.on('update:process-data', () => this.invalidate()),
                ctx.chartState.observe((get) => {
                    get('options');
                    this.invalidate();
                }),
                ctx.chartState.observe((get) => this.onHighlight(get('highlight')))
            );
            return;
        }

        const view = new FinancialStatusBarView(ctx);
        this.financialView = view;
        this.layer.appendChild(view.labelGroup);
        this.enabledCleanup.register(
            ctx.layoutManager.registerElement(LayoutElement.Overlay, (e) => view.performLayout(e)),
            ctx.eventsHub.on('layout:complete', (e) => view.onLayoutComplete(e)),
            ctx.chartState.observe((get) => view.updateHighlight(get('highlight'))),
            ctx.eventsHub.on('data:update', (data) => {
                view.chartData = data;
            }),
            ctx.eventsHub.on('series-area:hover', ({ canvasY }) => this.onPointerMove(canvasY)),
            ctx.widgets.seriesBoundsWidget.addListener('mouseleave', () => this.onPointerMove(undefined))
        );
    }

    private teardown() {
        this.enabledCleanup.flush();
        this.layer.clear();
        this.mode = undefined;
        this.financialView = undefined;
        this.itemsView = undefined;
        this.recent = undefined;
        this.rendered = undefined;
        this.sizing = undefined;
    }

    private invalidate() {
        this.rendered = undefined;
        this.sizing = undefined;
    }

    private onPointerMove(canvasY: number | undefined) {
        if (this.financialView?.onPointerMove(canvasY)) {
            this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
        }
    }

    private layoutItems(view: StatusBarItemsView, layout: _ModuleSupport.LayoutContext) {
        const { opts } = this;
        const resolved = this.resolveAnchor(this.ctx.chartState.getValue('highlight'));
        const items = this.renderItems(resolved);
        const shown = isHidden(resolved, opts) ? [] : items;
        // Sized from the default items when the renderer shows nothing, so that hover content still has room.
        const sizing = items.length > 0 ? items : this.sizingItems();
        view.performLayout(layout, opts, sizing);
        if (shown !== sizing) view.update(opts, shown);
    }

    private onHighlight(highlight: _ModuleSupport.HighlightNodeDatum | undefined) {
        const { itemsView, rendered } = this;
        if (itemsView == null) return;

        const resolved = this.resolveAnchor(highlight);
        if (rendered?.key === renderKey(this.ctx.chartService.series, resolved)) return;

        const items = this.renderItems(resolved);
        itemsView.update(this.opts, isHidden(resolved, this.opts) ? [] : items);
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private resolveAnchor(highlight: _ModuleSupport.HighlightNodeDatum | undefined): ResolvedAnchor {
        const { series } = this.ctx.chartService;
        // Legend items highlight a whole series, with no datum to anchor to.
        const hovered =
            highlight == null || !Number.isFinite(highlight.datumIndex)
                ? undefined
                : series.find((s) => s === highlight.series);
        if (hovered != null && highlight != null) {
            this.recent = { seriesId: hovered.id, datumIndex: highlight.datumIndex };
            return { anchor: { series: hovered, datumIndex: highlight.datumIndex }, active: true };
        }

        const { recent } = this;
        if (this.opts.inactive !== 'recent' || recent == null) return { active: false };
        const recentSeries = series.find((s) => s.id === recent.seriesId);
        if (recentSeries == null || recentSeries.dataCount() === 0) return { active: false };
        const datumIndex = recentSeries.clampDatumIndex?.(recent.datumIndex);
        if (datumIndex == null) return { active: false };
        return { anchor: { series: recentSeries, datumIndex }, active: false };
    }

    private sizingItems() {
        const key = renderKey(this.ctx.chartService.series, { active: false });
        if (this.sizing?.key !== key) {
            this.sizing = { key, items: defaultItems(collectValues(this.ctx, lastDatumIndex)) };
        }
        return this.sizing.items;
    }

    private renderItems(resolved: ResolvedAnchor): AgStatusBarRendererItem[] {
        const { ctx, opts } = this;
        const key = renderKey(ctx.chartService.series, resolved);
        if (this.rendered?.key === key) return this.rendered.items;

        const { anchor, active } = resolved;
        const values = anchor == null ? collectValues(ctx, lastDatumIndex) : collectAnchoredValues(ctx, anchor);
        const items = applyRenderer(ctx, opts, values, active) ?? defaultItems(values);
        this.rendered = { key, items };
        return items;
    }
}

function applyRenderer(
    ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
    opts: NormalisedStatusBarOptions,
    values: AgCollectedValue[],
    active: boolean
): AgStatusBarRendererItem[] | undefined {
    const { renderer } = opts;
    if (renderer == null) return;

    let result: ReturnType<typeof renderer>;
    try {
        result = callWithContext(ctx.chartService, renderer, { values, active });
    } catch (e) {
        ctx.logger.warnOnce('User callback errored, ignoring', e);
        return;
    }
    if (result == null) return;
    if (!isArray(result)) return [{ value: toTextString(result) }];

    const items = result.filter((item) => isObjectWithProperty(item, 'value'));
    if (items.length < result.length) ctx.logger.warnOnce('Status bar `renderer` items must have a `value`, ignoring');
    return items;
}

function renderKey(series: readonly StatusBarAnchor['series'][], { anchor, active }: ResolvedAnchor) {
    let key = anchor == null ? 'fallback' : `${anchor.series.id}:${anchor.datumIndex}:${active}`;
    for (const s of series) {
        if (s.isEnabled()) key += `|${s.id}`;
    }
    return key;
}

function isHidden({ anchor }: ResolvedAnchor, opts: NormalisedStatusBarOptions) {
    return anchor == null && opts.inactive === 'hidden';
}

function lastDatumIndex(series: StatusBarAnchor['series']) {
    if (series.dataCount() === 0) return;
    return series.clampDatumIndex?.(Infinity);
}

function defaultItems(values: readonly AgCollectedValue[]): AgStatusBarRendererItem[] {
    const items: AgStatusBarRendererItem[] = [];
    for (const { label, value, formattedValue, color, category } of values) {
        if (category || (formattedValue == null && value == null)) continue;
        items.push({ label, value: withColor(formattedValue ?? String(value), color) });
    }
    return items;
}

function withColor(text: NormalisedTextOrSegments, color: string | undefined): NormalisedTextOrSegments {
    if (color == null) return text;
    if (!isArray(text)) return [{ text, color }];
    return text.map((segment) => (segment.type === 'image' || segment.color != null ? segment : { ...segment, color }));
}
