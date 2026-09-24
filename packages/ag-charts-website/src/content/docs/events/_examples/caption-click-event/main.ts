import { AgCaptionClickEvent, AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Number of Cars Sold',
        listeners: {
            click: (event: AgCaptionClickEvent<'click'>) => {
                console.log('[title click]', event);
            },
            doubleClick: (event: AgCaptionClickEvent<'doubleClick'>) => {
                console.log('[title double click]', event);
            },
        },
    },
    subtitle: {
        text: '(single or double click the title, subtitle or footnote)',
    },
    footnote: {
        text: 'Source: Internal sales data',
    },
    data: [
        { month: 'March', units: 25 },
        { month: 'April', units: 27 },
        { month: 'May', units: 42 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'units',
        },
    ],
    listeners: {
        captionClick: (event) => console.log('[chart caption click]', event),
        captionDoubleClick: (event) => console.log('[chart caption double click]', event),
    },
};

AgCharts.create(options);
