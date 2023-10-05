import { AgChartOptions, AgEnterpriseCharts, AgScatterSeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { getData } from './data';

function verbose_renderer(params: AgScatterSeriesTooltipRendererParams) {
    return {
        title: `${params.xValue}m³ / ${params.yValue}kPa`,
        content: '<ul>'+
            `<li>${params.xUpperName}: ${params.xUpperValue}m³</li>`+
            `<li>${params.xLowerName}: ${params.xLowerValue}m³</li>`+
            `<li>${params.yUpperName}: ${params.yUpperValue}kPa</li>`+
            `<li>${params.yLowerName}: ${params.yLowerValue}kPa</li>`+
            '</ul>',
    }
}

function brief_renderer(params: AgScatterSeriesTooltipRendererParams) {
    return {
        content:
            `<strong>${params.xKey}:</strong> ${params.xValue} [${params.xLowerValue}, ${params.xUpperValue}] m³<br/>`+
            `<strong>${params.yKey}:</strong> ${params.yValue} [${params.yLowerValue}, ${params.yUpperValue}] kPa`,
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
            tooltip: { renderer: verbose_renderer },
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);

function defaults() {
  if (options.series) {
    options.series[0].tooltip = undefined;
    AgEnterpriseCharts.update(chart, options);
  }
}


function verbose() {
  if (options.series) {
    options.series[0].tooltip = { renderer: verbose_renderer };
    AgEnterpriseCharts.update(chart, options);
  }
}

function brief() {
  if (options.series) {
    options.series[0].tooltip = { renderer: brief_renderer };
    AgEnterpriseCharts.update(chart, options);
  }
}