import { AgChartOptions, AgEnterpriseCharts, AgScatterSeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { getData } from './data';

function verbose_renderer(params: AgScatterSeriesTooltipRendererParams) {
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

function brief_renderer(params: AgScatterSeriesTooltipRendererParams) {
    const datum = params.datum;
    return {
        content:
          `<strong>${params.xKey}:</strong> ${datum[params.xKey]} `+
            `[${params.xLowerKey ? datum[params.xLowerKey] : undefined},`+
            ` ${params.xUpperKey ? datum[params.xUpperKey] : undefined}] m³<br/>`+
            `<strong>${params.yKey}:</strong> ${datum[params.yKey]} `+
              `[${params.yLowerKey ? datum[params.yLowerKey] : undefined},`+
              ` ${params.yUpperKey ? datum[params.yUpperKey] : undefined}] kPa`
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
