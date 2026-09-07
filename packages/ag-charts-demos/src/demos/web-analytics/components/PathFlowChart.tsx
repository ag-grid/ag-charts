import { useMemo } from 'react';

import type { AgChartOptions, AgSankeySeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, THEME, pageColor } from '../chartTheme';
import { isTerminalNode } from '../data';
import { fmtInt } from '../format';
import type { PathLink } from '../types';

interface PathFlowChartProps {
    data: PathLink[];
}

// Node ids carry a position prefix ("2. Features") to keep each depth in its own
// column; strip it for display so users just see the page name.
const stripLevel = (label: string) => label.replace(/^\d+\.\s*/, '');

const isTerminal = (label: string | undefined) => !!label && isTerminalNode(label);

// Sankey labels carry the level prefix and include terminal nodes, which read grey.
const nodeColor = (label: string | undefined) => (!label || isTerminal(label) ? NEUTRAL : pageColor(stripLevel(label)));

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
                itemStyler: ({ label }) => ({ fill: nodeColor(label), stroke: nodeColor(label) }),
                cornerRadius: 3,
            },
            link: {
                // Fade each link from its start-node colour to its end-node colour.
                itemStyler: ({ datum }) => {
                    const { from, to } = datum as Partial<PathLink>;
                    return {
                        fill: {
                            type: 'gradient',
                            colorStops: [
                                { color: nodeColor(from), stop: 0 },
                                { color: nodeColor(to), stop: 1 },
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
            theme: THEME,
            data,
            series: [series],
            padding: 0,
            formatter: {
                size: ({ value }) => fmtInt(Number(value)),
            },
        };
    }, [data]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
