import type { DailyPoint, summary } from '../data';
import { type View, h } from '../dom';
import { fmtDelta } from '../format';
import { METRICS, type MetricKey } from '../metrics';
import { type SparkPoint, type Sparkline, createSparkline } from './Sparkline';

type Summary = ReturnType<typeof summary>;

export interface KpiDef {
    key: MetricKey;
    label: string;
    value: string;
    /** Fractional change vs the comparison period; undefined hides the delta. */
    delta?: number;
    /** Daily values across the selected range, for the tile sparkline. */
    series: SparkPoint[];
    /** Sparkline colour. */
    color: string;
    /** Formats a metric value for the sparkline tooltip. */
    formatValue: (value: number) => string;
}

export function buildKpis(current: Summary, daily: DailyPoint[], previous: Summary): KpiDef[] {
    return METRICS.map((metric) => {
        const before = metric.value(previous);
        return {
            key: metric.key,
            label: metric.label,
            color: metric.color,
            formatValue: metric.formatValue,
            value: metric.formatValue(metric.value(current)),
            delta: before === 0 ? undefined : metric.value(current) / before - 1,
            series: daily.map((d) => ({ date: d.date, value: metric.daily(d) })),
        };
    });
}

interface KpiTilesProps {
    kpis: KpiDef[];
    /** The metric currently driving the traffic chart. */
    activeKey: MetricKey;
    onSelect: (key: MetricKey) => void;
}

export interface KpiTiles extends View {
    update(kpis: KpiDef[], activeKey: MetricKey): void;
}

/** DOM id of a metric's tab, so the chart below can name the tab that drives it. */
export function kpiTabId(key: MetricKey) {
    return `wa-kpi-tab-${key}`;
}

interface Tile {
    button: HTMLButtonElement;
    value: HTMLSpanElement;
    delta: HTMLSpanElement | undefined;
    sparkBox: HTMLSpanElement;
    sparkline: Sparkline;
}

const deltaSpan = (delta: number) =>
    h('span', { class: `wa-kpi-delta ${delta >= 0 ? 'wa-up' : 'wa-down'}` }, `${fmtDelta(delta)} vs prev`);

/**
 * The KPI row doubles as the tab strip of the traffic card: each metric is a tab, and
 * the selected one drives the chart beneath it.
 */
export function createKpiTiles({ kpis, activeKey, onSelect }: KpiTilesProps): KpiTiles {
    // Selection follows focus, so the roving tabIndex below always lands on the active tab.
    const onKeyDown = (event: KeyboardEvent) => {
        const last = kpis.length - 1;
        const current = kpis.findIndex((kpi) => kpi.key === activeKey);
        let next: number;
        switch (event.key) {
            case 'ArrowRight':
                next = current === last ? 0 : current + 1;
                break;
            case 'ArrowLeft':
                next = current === 0 ? last : current - 1;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = last;
                break;
            default:
                return;
        }
        event.preventDefault();
        onSelect(kpis[next].key);
        el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    };

    // One tile per metric, keyed by metric as the React list is; the metric set is fixed.
    const tiles = new Map<MetricKey, Tile>(
        kpis.map((kpi) => {
            const value = h('span', { class: 'wa-kpi-value' }, kpi.value);
            const delta = kpi.delta != null ? deltaSpan(kpi.delta) : undefined;
            const sparkline = createSparkline(kpi.series, kpi.color, kpi.formatValue);
            // The sparkline restates the tab's own figures, so keep its chart DOM out of the
            // button's accessible name.
            const sparkBox = h('span', { class: 'wa-kpi-spark-box', 'aria-hidden': 'true' }, sparkline.el);
            const button = h(
                'button',
                {
                    id: kpiTabId(kpi.key),
                    type: 'button',
                    role: 'tab',
                    class: 'wa-kpi',
                    'aria-selected': 'false',
                    // Roving tab order: Tab reaches the strip, arrow keys move within it.
                    tabindex: '-1',
                    onclick: () => onSelect(kpi.key),
                },
                h('span', { class: 'wa-kpi-label' }, kpi.label),
                value,
                delta,
                sparkBox
            );
            return [kpi.key, { button, value, delta, sparkBox, sparkline }];
        })
    );

    const el = h(
        'div',
        { class: 'wa-kpi-tabs', role: 'tablist', 'aria-label': 'Traffic metric', onkeydown: onKeyDown },
        ...[...tiles.values()].map((tile) => tile.button)
    );

    function render() {
        for (const kpi of kpis) {
            const tile = tiles.get(kpi.key);
            if (!tile) continue;
            const active = kpi.key === activeKey;
            tile.button.className = active ? 'wa-kpi is-active' : 'wa-kpi';
            tile.button.setAttribute('aria-selected', String(active));
            tile.button.setAttribute('tabindex', active ? '0' : '-1');
            // Resolves `currentcolor` for the active tab's underline.
            tile.button.style.color = active ? kpi.color : '';
            tile.value.textContent = kpi.value;
            const delta = kpi.delta != null ? deltaSpan(kpi.delta) : undefined;
            if (tile.delta && delta) tile.delta.replaceWith(delta);
            else if (tile.delta) tile.delta.remove();
            else if (delta) tile.sparkBox.before(delta);
            tile.delta = delta;
            tile.sparkline.update(kpi.series);
        }
    }
    render();

    return {
        el,
        mount() {
            for (const tile of tiles.values()) tile.sparkline.mount();
        },
        update(nextKpis, nextActiveKey) {
            kpis = nextKpis;
            activeKey = nextActiveKey;
            render();
        },
        destroy() {
            for (const tile of tiles.values()) tile.sparkline.destroy();
        },
    };
}
