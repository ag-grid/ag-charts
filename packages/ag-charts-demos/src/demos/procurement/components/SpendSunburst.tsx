import { useMemo } from 'react';

import type { AgStandaloneChartOptions, AgSunburstSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, SUBCATEGORY_RAMP, THEME } from '../chartTheme';
import { SUBCATEGORIES } from '../data';
import { fmtCurrency, fmtCurrencyCompact, fmtPct } from '../format';
import type { SpendNode } from '../types';
import { MANAGER } from '../workspace';

interface SpendSunburstProps {
    /**
     * Her commodity's spend tree. The commodity itself is not drawn: the rings start at its
     * subcategories, then materials, and the suppliers each material is bought from.
     */
    tree: SpendNode;
    /** Per-supplier colours, shared with the scatter and the scorecard cards. */
    supplierColors: Record<string, string>;
}

const SUBCATEGORY_INDEX = new Map(SUBCATEGORIES[MANAGER.commodity].map((name, index) => [name, index]));

/**
 * Sector fill by ring: subcategories in one hue's steps, materials in their parent
 * subcategory's step, and suppliers in their own identity colour — the same colour that
 * supplier carries on its bubble and its row.
 *
 * A supplier with no spend in the period is greyed: it is only present to hold its place in
 * the ring (see `buildSpendTree`), and must not read as a value.
 */
function sectorFill(node: SpendNode, supplierColors: Record<string, string>): string {
    if (node.supplierId != null) {
        return node.spend > 0 ? (supplierColors[node.supplierId] ?? NEUTRAL) : NEUTRAL;
    }
    // A material takes its parent subcategory's colour, so each branch reads as one band.
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
            // A hairline stroke rather than a gap: spacing narrow sectors apart breaks the ring into spikes.
            sectorSpacing: 0,
            cornerRadius: 2,
            strokes: ['var(--pc-panel)'],
            strokeWidth: 1,
            strokeOpacity: 1,
            padding: 4,
            label: { fontSize: 10, minimumFontSize: 9, spacing: 2 },
            secondaryLabel: {
                fontSize: 11,
                minimumFontSize: 8,
                // `size` carries the sliver an empty leaf is drawn with, so the label must read the true spend.
                formatter: ({ datum }) => (datum.spend > 0 ? fmtCurrencyCompact(datum.spend) : 'no spend'),
            },
            innerRadiusRatio: 0.3,
            innerLabels: [{ text: MANAGER.commodity, fontSize: 14 }],
            itemStyler: ({ datum }) => ({ fill: sectorFill(datum, supplierColors) }),
            tooltip: {
                renderer: ({ datum }) => {
                    // The ring above this one: her commodity, the subcategory, or the material.
                    const parent = datum.path.length > 1 ? datum.path[datum.path.length - 2] : MANAGER.commodity;
                    return {
                        title:
                            datum.path.length > 1
                                ? `${datum.path.slice(0, -1).join(' > ')} > ${datum.name}`
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
            data: tree.children ?? [],
            series: [series],
            padding: 0,
        };
    }, [tree, supplierColors]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
