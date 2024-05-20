import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { fromId: 'Wind', toId: 'Renewables', size: 79 },
        { fromId: 'Nuclear', toId: 'Renewables', size: 38 },
        { fromId: 'Biomass', toId: 'Renewables', size: 14 },
        { fromId: 'Solar', toId: 'Renewables', size: 13 },
        { fromId: 'Hydro', toId: 'Renewables', size: 3 },
        { fromId: 'Natural Gas', toId: 'Fossil Fuels', size: 86 },
        { fromId: 'Coal', toId: 'Fossil Fuels', size: 3 },
        { fromId: 'Imports', toId: 'Total', size: 33 },
        { fromId: 'Fossil Fuels', toId: 'Total', size: 89 },
        { fromId: 'Renewables', toId: 'Total', size: 147 },
    ],
    series: [
        {
            type: 'chord',
            fromIdKey: 'fromId',
            toIdKey: 'toId',
            sizeKey: 'size',
        },
    ],
};

AgCharts.create(options);
