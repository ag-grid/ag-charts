import { AgChartOptions, AgCharts, ContextMenuModule, ModuleRegistry, PyramidSeriesModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([PyramidSeriesModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pyramid',
            stageKey: 'incomeBracket',
            valueKey: 'adults',
            spacing: 4,
            fillOpacity: 1,
            aspectRatio: 1.2,
            label: {
                formatter: ({ value, datum }) => {
                    if (datum.group === 'Lower Middle Class' || datum.group === 'Bottom 50%') {
                        return `${datum.percentage}\n${value.toLocaleString()}`;
                    }
                    if (datum.group === 'Upper Middle Class') {
                        return datum.percentage;
                    }
                    return '';
                },
            },
            tooltip: {
                renderer: ({ datum }) => {
                    return {
                        data: [
                            {
                                label:
                                    datum.incomeBracket == ''
                                        ? 'Above $1,000,000'
                                        : datum.incomeBracket.replace('  →', ''),
                                value: datum.percentage,
                            },
                        ],
                    };
                },
            },
        },
    ],
};

AgCharts.create(options);
