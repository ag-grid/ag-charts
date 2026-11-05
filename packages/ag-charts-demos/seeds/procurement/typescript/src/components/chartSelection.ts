import type { AgChartInstance, AgSelectionItemIds } from 'ag-charts-community';

const itemKey = ({ seriesId, itemId }: AgSelectionItemIds) => `${seriesId}\u0000${String(itemId)}`;

/**
 * Brings a chart's own data selection into line with the workspace's, once the chart has series to
 * select into. Returns a cancel function for an effect's cleanup.
 */
export function mirrorSelection(chart: AgChartInstance, wanted: AgSelectionItemIds[]): () => void {
    let cancelled = false;
    // A chart remounted by a tab switch has no series to select into until its first update lands.
    void chart.waitForUpdate().then(() => {
        if (cancelled) return;
        const current = new Set(Array.from(chart.getSelection(), itemKey));
        if (wanted.length === current.size && wanted.every((item) => current.has(itemKey(item)))) return;
        if (wanted.length === 0) {
            chart.clearSelection();
        } else {
            chart.setSelection(wanted);
        }
    });
    return () => {
        cancelled = true;
    };
}

/**
 * Selection styles that leave each item as its styler drew it, for charts that draw the shared
 * selection themselves: the theme's outline and fade on top would compound it. `strokeWidth` is the
 * item's own, so selecting it does not thicken its outline.
 */
export const stylerOwnedSelection = (strokeWidth: number) => ({
    selectedItem: { strokeWidth },
    unselectedItem: { opacity: 1 },
    unselectedSeries: { opacity: 1 },
});
