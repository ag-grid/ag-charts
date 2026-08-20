import { useMemo } from 'react';

import type { AgStandaloneChartOptions, AgSunburstSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { COMMODITY_INK, MATERIAL_INK, NEUTRAL, SUBCATEGORY_RAMP, THEME } from '../chartTheme';
import { SUBCATEGORIES } from '../data';
import { fmtCurrency, fmtCurrencyCompact, fmtPct } from '../format';
import type { SpendNode } from '../types';
import { MANAGER } from '../workspace';

interface SpendSunburstProps {
    /**
     * Her commodity's spend tree: commodity at the centre, then subcategories, materials, and the
     * suppliers each material is bought from.
     */
    tree: SpendNode;
    /** Per-supplier colours, shared with the scatter and the scorecard cards. */
    supplierColors: Record<string, string>;
}

const SUBCATEGORY_INDEX = new Map(SUBCATEGORIES[MANAGER.commodity].map((name, index) => [name, index]));

/**
 * Sector fill by ring: her commodity at the centre in chrome ink, subcategories in one hue's
 * steps, materials in a single lighter tone of it, and suppliers in their own identity colour —
 * the same colour that supplier carries on its bubble and its row.
 *
 * A supplier with no spend in the period is greyed: it is only present to hold its place in
 * the ring (see `buildSpendTree`), and must not read as a value.
 */
function sectorFill(node: SpendNode, supplierColors: Record<string, string>): string {
    if (node.path.length === 0) return COMMODITY_INK;
    if (node.supplierId != null) {
        return node.spend > 0 ? (supplierColors[node.supplierId] ?? NEUTRAL) : NEUTRAL;
    }
    // Materials take one tone: their parent is the sector they sit in, not a shade of its colour.
    if (node.path.length > 1) return MATERIAL_INK;
    const index = SUBCATEGORY_INDEX.get(node.path[0]) ?? 0;
    return SUBCATEGORY_RAMP[index % SUBCATEGORY_RAMP.length];
}

export function SpendSunburst({ tree, supplierColors }: SpendSunburstProps) {
    const options = useMemo<AgStandaloneChartOptions<SpendNode>>(() => {
        const series: AgSunburstSeriesOptions<SpendNode> = {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'size',
            sizeName: 'Spend',
            // Separated by a hairline stroke rather than a gap: spacing narrow sectors apart
            // breaks the ring into spikes that read as rendering artefacts instead of small
            // values, whereas a stroke keeps the band continuous and still divides them.
            sectorSpacing: 0,
            cornerRadius: 0,
            strokes: ['var(--pc-panel)'],
            strokeWidth: 1,
            strokeOpacity: 1,
            padding: 4,
            label: { fontSize: 13, minimumFontSize: 9, spacing: 2 },
            secondaryLabel: {
                fontSize: 11,
                minimumFontSize: 8,
                // `size` carries the sliver an empty leaf is drawn with, so the label has to
                // read the true spend to avoid captioning that sliver.
                formatter: ({ datum }) => (datum.spend > 0 ? fmtCurrencyCompact(datum.spend) : 'no spend'),
            },
            itemStyler: ({ datum }) => ({ fill: sectorFill(datum, supplierColors) }),
            tooltip: {
                renderer: ({ datum }) => {
                    if (datum.path.length === 0) {
                        return {
                            title: datum.name,
                            data: [{ label: 'My spend this period', value: fmtCurrency(datum.spend) }],
                        };
                    }
                    // The ring above this one: her commodity, the subcategory, or the material.
                    const parent = datum.path.length > 1 ? datum.path[datum.path.length - 2] : MANAGER.commodity;
                    return {
                        title:
                            datum.path.length > 1
                                ? `${datum.path.slice(0, -1).join(' › ')} › ${datum.name}`
                                : datum.name,
                        data:
                            datum.spend > 0
                                ? [
                                      { label: 'Spend', value: fmtCurrency(datum.spend) },
                                      { label: `Share of ${parent}`, value: fmtPct(datum.shareOfParent) },
                                      { label: 'Share of my commodity', value: fmtPct(datum.shareOfTotal) },
                                  ]
                                : [{ label: 'Spend', value: 'None in this period' }],
                    };
                },
            },
        };

        return {
            theme: THEME,
            // The root is included, so her commodity renders as the centre.
            data: [tree],
            series: [series],
            padding: 0,
        };
    }, [tree, supplierColors]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
