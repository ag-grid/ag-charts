import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';
import type { AgLinearGaugeOptions } from 'ag-charts-enterprise';

import { type ChartHost, chartHost, gaugeHost } from '../chart';
import { SEGMENT_SEPARATOR, THEME } from '../chartTheme';
import { type View, h } from '../dom';
import { fmtCurrencyCompact, fmtInt, fmtPct } from '../format';
import { memo } from '../memo';
import type { Kpi, KpiGauge, KpiSegment } from '../types';
import type { MySpendPosition, MySummary } from '../workspace';
import { STATUS_ORDER, statusKeys, statusSegments } from './StatusKeys';

/** Bar ink per threshold state, matching the tile's own accent. */
const GAUGE_FILL: Record<Kpi['tone'], string> = {
    neutral: 'var(--pc-accent)',
    good: 'var(--pc-ok-fill)',
    warn: 'var(--pc-warn-fill)',
    bad: 'var(--pc-bad-fill)',
};

/**
 * The tile's figure against the thing it is measured against.
 *
 * A percentage says where she is; only the marker says whether that is where she should be, and at
 * a glance the gap between bar and marker is the reading — which is the question these two tiles
 * exist to answer.
 */
function gaugeOptions({ value, target, targetLabel }: KpiGauge, tone: Kpi['tone']): AgLinearGaugeOptions {
    // The scale runs past the target: clamped to it, an overrun would land on the marker and read as on plan.
    const max = Math.max(100, Math.ceil(value * 100));

    return {
        theme: THEME,
        type: 'linear-gauge',
        direction: 'horizontal',
        value: value * 100,
        thickness: 8,
        cornerRadius: 2,
        scale: {
            min: 0,
            max,
            fill: 'var(--pc-grid)',
            // The figure above the gauge is the number; ticks here would only repeat it.
            label: { enabled: false },
        },
        bar: { fill: GAUGE_FILL[tone] },
        targets: [
            {
                value: target * 100,
                text: targetLabel,
                shape: 'line',
                placement: 'middle',
                size: 14,
                strokeWidth: 2,
                stroke: 'var(--pc-text)',
            },
        ],
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };
}

/** One row of stacked bands, so the segments share a single 100%-wide bar. */
interface SegmentRow {
    row: string;
    [label: string]: string | number;
}

/**
 * The figure's composition, as one bar.
 *
 * The at-risk count says how many need watching but not how that sits against the rest of her
 * freight — three at risk out of five is a different morning from three out of thirty, and the
 * width of the healthy band is that reading.
 */
function segmentOptions(segments: KpiSegment[]): AgCartesianChartOptions<SegmentRow> {
    const datum: SegmentRow = { row: 'shipments' };
    for (const segment of segments) datum[segment.label] = segment.count;

    const series = segments.map<AgBarSeriesOptions<SegmentRow>>((segment) => ({
        type: 'bar',
        direction: 'horizontal',
        xKey: 'row',
        yKey: segment.label,
        yName: segment.label,
        stacked: true,
        normalizedTo: 100,
        fill: segment.color,
        cornerRadius: 2,
        ...SEGMENT_SEPARATOR,
    }));

    return {
        theme: THEME,
        data: [datum],
        series,
        // A single bar filling the box: every axis, tick and label would only repeat the tile.
        axes: {
            y: { type: 'category', label: { enabled: false }, line: { enabled: false }, tick: { enabled: false } },
            x: {
                type: 'number',
                label: { enabled: false },
                line: { enabled: false },
                tick: { enabled: false },
                gridLine: { enabled: false },
            },
        },
        legend: { enabled: false },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        highlight: { enabled: false },
        tooltip: { enabled: false },
    };
}

/**
 * Her delivery headline: the freight from her suppliers that needs watching.
 *
 * Scoped to her commodity rather than the portfolio, so the denominator is her commodity's
 * in-transit count, not the company's. Spend against allocation is a spend-tab
 * figure — see `buildSpendKpis`.
 *
 * `filterLabel` names what the orders tab's filters narrow to, so the detail line says the figure is filtered.
 */
export function buildKpis(summary: MySummary, filterLabel?: string): Kpi[] {
    const inTransit = STATUS_ORDER.reduce((total, status) => total + summary.shipmentsByStatus[status], 0);

    return [
        {
            key: 'atRisk',
            label: 'At-risk shipments',
            value: fmtInt(summary.atRiskShipments),
            detail:
                filterLabel == null
                    ? `Out of ${fmtInt(inTransit)} in transit from my suppliers`
                    : `Out of ${fmtInt(inTransit)} in transit · filtered to ${filterLabel}`,
            // The segmented bar already shows how many are late, so the tile carries no threshold state.
            tone: 'neutral',
            segments: statusSegments(summary.shipmentsByStatus),
        },
    ];
}

/** What the spend tab's tiles are built from. */
export interface SpendKpis {
    position: MySpendPosition;
    /** Label for the committed figure, e.g. "My spend YTD". */
    label: string;
    /** Label for the projection, which names where the window ends. */
    projectionLabel: string;
}

/**
 * Spend against the selected window's allocation, which heads the spend tab.
 *
 * Judged against the share of the window elapsed rather than a fixed threshold, because a share of
 * an allocation on its own is not a position: committing 70% of a year's budget is comfortable in
 * November and alarming in March. Spending ahead of the window is what the tile warns on, and it
 * says how far in the window it is so the warning can be read.
 */
export function buildSpendKpis({ position, label, projectionLabel }: SpendKpis): Kpi[] {
    let tone: Kpi['tone'] = 'neutral';
    if (position.used >= 1) tone = 'bad';
    else if (position.used > position.elapsed) tone = 'warn';

    const overrun = position.projected - position.budget;
    const projectedShare = position.budget > 0 ? position.projected / position.budget : 0;

    return [
        {
            key: 'spend',
            label,
            value: fmtCurrencyCompact(position.spend),
            detail: `${fmtPct(position.used)} of my ${fmtCurrencyCompact(position.budget)} ${position.budgetLabel} · ${fmtPct(position.elapsed)} of the ${position.windowLabel} elapsed`,
            tone,
            // The allocation is the ceiling, so the target sits at the far end of the scale.
            gauge: { value: position.used, target: 1, targetLabel: position.budgetLabel },
        },
        {
            key: 'projected',
            label: projectionLabel,
            value: fmtCurrencyCompact(position.projected),
            // Says the assumption out loud: a run rate is a projection, not a commitment.
            detail: `${fmtCurrencyCompact(Math.abs(overrun))} ${overrun >= 0 ? 'over' : 'under'} my ${fmtCurrencyCompact(position.budget)} ${position.budgetLabel} at my recent run rate`,
            tone: overrun > 0 ? 'bad' : 'good',
            gauge: { value: projectedShare, target: 1, targetLabel: position.budgetLabel },
        },
    ];
}

/** One tile, keyed on its KPI as the React list is, holding the chart it draws. */
interface Tile {
    el: HTMLDivElement;
    kpi: Kpi;
    label: HTMLSpanElement;
    value: HTMLSpanElement;
    foot?: HTMLSpanElement;
    gauge?: ChartHost<AgLinearGaugeOptions>;
    gaugeOptions: (gauge: KpiGauge, tone: Kpi['tone']) => AgLinearGaugeOptions;
    segments?: ChartHost<AgCartesianChartOptions<SegmentRow>>;
    segmentOptions: (segments: KpiSegment[]) => AgCartesianChartOptions<SegmentRow>;
}

/**
 * The line explaining the figure and the bands it is drawn from read as one row: the sentence on
 * the left, the counts it refers to ranged right.
 */
function fillFoot(foot: HTMLSpanElement, kpi: Kpi) {
    foot.replaceChildren();
    if (kpi.detail != null && kpi.detail !== '') foot.append(h('span', { class: 'pc-kpi-detail' }, kpi.detail));
    if (kpi.segments) foot.append(statusKeys({ segments: kpi.segments }));
}

function createTile(kpi: Kpi): Tile {
    const label = h('span', { class: 'pc-kpi-label' }, kpi.label);
    const value = h('span', { class: 'pc-kpi-value' }, kpi.value);
    // The chart the figure is read against: beside it, or under it when `stacked`.
    const figure = h('span', { class: 'pc-kpi-figure' }, value);
    const tile: Tile = {
        el: h('div', { class: 'pc-kpi' }, label, figure),
        kpi,
        label,
        value,
        gaugeOptions: memo(gaugeOptions),
        segmentOptions: memo(segmentOptions),
    };
    if (kpi.gauge) {
        tile.gauge = gaugeHost();
        // The detail line already states the figure and its target, so the gauge stays out of accessible text.
        figure.append(h('span', { class: 'pc-kpi-gauge', 'aria-hidden': 'true' }, tile.gauge.el));
    }
    if (kpi.segments) {
        tile.segments = chartHost();
        figure.append(h('span', { class: 'pc-kpi-segments' }, tile.segments.el));
    }
    if (kpi.detail != null || kpi.segments != null) {
        tile.foot = h('span', { class: 'pc-kpi-foot' });
        fillFoot(tile.foot, kpi);
        tile.el.append(tile.foot);
    }
    return tile;
}

/** Whether a tile's structure (which parts it has) still fits the KPI it would show. */
const tileFits = (tile: Tile, kpi: Kpi) =>
    tile.kpi.key === kpi.key &&
    (tile.gauge != null) === (kpi.gauge != null) &&
    (tile.segments != null) === (kpi.segments != null) &&
    (tile.foot != null) === (kpi.detail != null || kpi.segments != null);

export interface KpiStrip extends View {
    update(kpis: Kpi[]): void;
}

/**
 * Tiles share one card evenly, however many of them a view passes. `stacked` puts each chart under
 * its figure rather than beside it.
 */
export function createKpiStrip(kpis: Kpi[], stacked = false): KpiStrip {
    const el = h('div', { class: stacked ? 'pc-kpis pc-kpis--stacked' : 'pc-kpis' });
    let tiles: Tile[] = [];
    let mounted = false;

    function mountTile(tile: Tile) {
        if (tile.kpi.gauge) tile.gauge?.mount(tile.gaugeOptions(tile.kpi.gauge, tile.kpi.tone));
        if (tile.kpi.segments) tile.segments?.mount(tile.segmentOptions(tile.kpi.segments));
    }

    function build() {
        for (const tile of tiles) {
            tile.gauge?.destroy();
            tile.segments?.destroy();
        }
        tiles = kpis.map(createTile);
        el.style.cssText = `--pc-kpi-columns: ${kpis.length};`;
        el.replaceChildren(...tiles.map((tile) => tile.el));
        if (mounted) tiles.forEach(mountTile);
    }
    build();

    return {
        el,
        mount() {
            mounted = true;
            tiles.forEach(mountTile);
        },
        update(next) {
            if (next === kpis) return;
            kpis = next;
            // Same tiles in the same shape: React would keep the elements and re-render them in place.
            if (next.length !== tiles.length || !next.every((kpi, index) => tileFits(tiles[index], kpi))) {
                build();
                return;
            }
            tiles.forEach((tile, index) => {
                const kpi = next[index];
                tile.kpi = kpi;
                tile.label.textContent = kpi.label;
                tile.value.textContent = kpi.value;
                if (kpi.gauge) tile.gauge?.update(tile.gaugeOptions(kpi.gauge, kpi.tone));
                if (kpi.segments) tile.segments?.update(tile.segmentOptions(kpi.segments));
                if (tile.foot) fillFoot(tile.foot, kpi);
            });
        },
        destroy() {
            for (const tile of tiles) {
                tile.gauge?.destroy();
                tile.segments?.destroy();
            }
        },
    };
}
