import { useMemo } from 'react';

import type { AgChartOptions, AgTreemapSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { THEME, pageColor } from '../chartTheme';
import { fmtInt } from '../format';
import type { PageRow } from '../types';

interface PageTreemapChartProps {
    data: PageRow[];
}

export function PageTreemapChart({ data }: PageTreemapChartProps) {
    const options = useMemo<AgChartOptions>(() => {
        const series: AgTreemapSeriesOptions<PageRow> = {
            type: 'treemap',
            labelKey: 'pageTitle',
            secondaryLabelKey: 'pageviews',
            sizeKey: 'pageviews',
            sizeName: 'Page views',
            tile: {
                cornerRadius: 6,
                gap: 8,
                padding: 8,
                fillOpacity: 0.85,
                textAlign: 'left',
                verticalAlign: 'bottom',
                label: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    minimumFontSize: 10,
                },
                secondaryLabel: {
                    minimumFontSize: 9,
                    formatter: ({ value }) => fmtInt(Number(value)),
                },
            },
            itemStyler: ({ datum }) => ({ fill: pageColor(datum.pageTitle) }),
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
