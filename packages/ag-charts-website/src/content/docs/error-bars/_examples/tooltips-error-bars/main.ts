import { AgChartOptions, AgEnterpriseCharts, AgScatterSeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { getData } from './data';

function myRenderer(params: AgScatterSeriesTooltipRendererParams) {
    const datum = params.datum;
    return {
        content:
            '<ul>' +
            `<li>${params.xUpperName}: ${params.xUpperKey ? datum[params.xUpperKey] : undefined}m³</li>` +
            `<li>${params.xLowerName}: ${params.xLowerKey ? datum[params.xLowerKey] : undefined}m³</li>` +
            `<li>${params.yUpperName}: ${params.yUpperKey ? datum[params.yUpperKey] : undefined}kPa</li>` +
            `<li>${params.yLowerName}: ${params.yLowerKey ? datum[params.yLowerKey] : undefined}kPa</li>` +
            '</ul>',
    };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Hover over markers to view tooltip example',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            errorBar:  {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
                xLowerName: 'Volume (lower bound)',
                xUpperName: 'Volume (upper bound)',
                /* yLowerName implicitly defaults to 'pressureLower' */
                /* yUpperName implicitly defaults to 'pressureUpper' */
            },
            tooltip: { renderer: myRenderer },
        },
    ],
};

AgEnterpriseCharts.create(options);
