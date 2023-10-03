import { AgChartOptions, AgEnterpriseCharts, AgScatterSeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { getData } from './data';

function renderer(params: AgScatterSeriesTooltipRendererParams) {
    return {
        title: `${params.xValue}m³ / ${params.yValue}kPa`,
        content: '<ul>'+
            `<li>${params.xUpperName}: ${params.xUpperValue}m³</li>`+
            `<li>${params.xLowerName}: ${params.xLowerValue}m³</li>`+
            `<li>${params.yUpperName}: ${params.yUpperValue}kPa</li>`+
            `<li>${params.yLowerName}: ${params.yLowerValue}kPa</li>`+
            '</ul>'
    }
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Volume-Pressure Relationship with Confidence Intervals',
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
            },
            tooltip: { renderer: renderer },
        },
    ],
};

AgEnterpriseCharts.create(options);
