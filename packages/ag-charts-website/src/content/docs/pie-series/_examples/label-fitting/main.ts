import { AgCharts, AgPolarChartOptions, LegendModule } from 'ag-charts-community';
import { DonutSeriesModule, ModuleRegistry, PieSeriesModule } from 'ag-charts-community';
import { TextWrap } from 'ag-charts-types';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([DonutSeriesModule, LegendModule, PieSeriesModule]);

let seriesType: 'pie' | 'donut' = 'pie';
const fit = {
    maxWidth: 70,
    wrapping: 'on-space' as TextWrap,
    truncate: true,
    minimumFontSize: undefined as number | undefined,
};

function buildSeries(): AgPolarChartOptions<DataType>['series'] {
    if (seriesType === 'donut') {
        return [
            {
                type: 'donut',
                innerRadiusRatio: 0.5,
                angleKey: 'terawattHours',
                calloutLabelKey: 'source',
                sectorLabelKey: 'share',
                calloutLabel: { ...fit },
                sectorLabel: { ...fit, formatter: ({ value }) => `${value}% of total` },
            },
        ];
    }
    return [
        {
            type: 'pie',
            angleKey: 'terawattHours',
            calloutLabelKey: 'source',
            sectorLabelKey: 'share',
            calloutLabel: { ...fit },
            sectorLabel: { ...fit, formatter: ({ value }) => `${value}% of total` },
        },
    ];
}

const options: AgPolarChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Global Electricity Generation by Source' },
    data: getData(),
    series: buildSeries(),
};

const chart = AgCharts.create(options);

/** inScope */
function refresh() {
    options.series = buildSeries();
    chart.update(options);
}

function setSeriesType(type: string) {
    seriesType = type === 'donut' ? 'donut' : 'pie';
    refresh();
}

function setMaxWidth(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('maxWidthValue')!.textContent = String(value);
    fit.maxWidth = value;
    refresh();
}

function setWrapping(wrapping: string) {
    fit.wrapping = wrapping as TextWrap;
    refresh();
}

function setTruncate(truncate: boolean) {
    fit.truncate = truncate;
    refresh();
}

function setMinimumFontSize(value: string) {
    fit.minimumFontSize = value === 'off' ? undefined : Number(value);
    refresh();
}
