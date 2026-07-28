import { useMemo } from 'react';

import type { AgChartOptions, AgSankeySeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, PALETTE, THEME } from '../chartTheme';
import { PAGE_TITLES, isTerminalNode } from '../data';
import type { PathLink } from '../types';

interface PathFlowChartProps {
    data: PathLink[];
}

// Node ids carry a position prefix ("2. Features") to keep each depth in its own
// column; strip it for display so users just see the page name.
const stripLevel = (label: string) => label.replace(/^\d+\.\s*/, '');

const isTerminal = (label: string | undefined) => !!label && isTerminalNode(label);

// One colour per page, held across every step column. Terminal nodes read grey, as
// does any page past the palette — a tenth page never reuses slot 0.
const pageColor = (label: string | undefined) => {
    if (!label || isTerminal(label)) return NEUTRAL;
    return PALETTE[PAGE_TITLES.indexOf(stripLevel(label))] ?? NEUTRAL;
};

export function PathFlowChart({ data }: PathFlowChartProps) {
    const options = useMemo<AgChartOptions>(() => {
        const series: AgSankeySeriesOptions = {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            sizeName: 'Sessions',
            node: {
                spacing: 20,
                width: 12,
                alignment: 'center',
                sort: 'data',
                itemStyler: ({ label }) => ({ fill: pageColor(label), stroke: pageColor(label) }),
            },
            link: {
                // Fade each link from its start-node colour to its end-node colour;
                // links into a terminal node fade page-colour → grey (see pageColor).
                itemStyler: ({ datum }) => {
                    const { from, to } = datum as Partial<PathLink>;
                    return {
                        fill: {
                            type: 'gradient',
                            colorStops: [
                                { color: pageColor(from), stop: 0 },
                                { color: pageColor(to), stop: 1 },
                            ],
                            // 90° runs the gradient left-to-right, matching link flow.
                            rotation: 90,
                        },
                        fillOpacity: isTerminal(to) ? 0.2 : 0.35,
                    };
                },
            },
            label: { formatter: ({ value }) => stripLevel(String(value)) },
            tooltip: {
                renderer: ({ datum }) => {
                    const { from, to } = (datum ?? {}) as Partial<PathLink>;
                    return from && to ? { title: `${from} → ${to}` } : undefined;
                },
            },
        };
        return {
            theme: {
                ...THEME,
                palette: { fills: [...PALETTE], strokes: [...PALETTE] },
            },
            data,
            series: [series],
            padding: 0,
        };
    }, [data]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
