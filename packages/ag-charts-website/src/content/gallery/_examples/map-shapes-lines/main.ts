import {
    AgCharts,
    AgTopologyChartOptions,
    ContextMenuModule,
    LegendModule,
    MapLineSeriesModule,
    MapShapeSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { londonBoroughData } from './londonBoroughData';
import { londonBoroughTopology } from './londonBoroughTopology';
import { otherCountiesData } from './otherCountiesData';
import { otherCountiesTopology } from './otherCountiesTopology';
import { tubeData } from './tubeData';
import { tubeTopology } from './tubeTopology';

ModuleRegistry.registerModules([LegendModule, MapLineSeriesModule, MapShapeSeriesModule]);
const sizeDomain = [0, 141537];

const tubeLineColours = {
    Bakerloo: '#B26300',
    'Hammersmith & City': '#F589A6',
    Jubilee: '#838D93',
    Victoria: '#039BE5',
    District: '#007D32',
    Metropolitan: '#9B0058',
    Northern: '#000000',
    Piccadilly: '#0019A8',
    'Waterloo & City': '#76D0BD',
    Circle: '#FFC80A',
    Central: '#DC241F',
};

const options: AgTopologyChartOptions = {
    container: document.getElementById('myChart'),
    topology: tubeTopology,
    title: {
        text: 'London Tube Lines',
    },
    subtitle: {
        text: 'Passenger traffic by line section (daily ridership)',
    },
    padding: {
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
    },
    legend: {
        enabled: true,
        position: {
            placement: 'right',
            floating: true,
        },
        item: {
            line: {
                strokeWidth: 4,
            },
        },
        listeners: {
            legendItemDoubleClick: (event) => {
                event.preventDefault();
            },
        },
    },
    series: [
        {
            type: 'map-shape',
            topology: otherCountiesTopology,
            data: otherCountiesData,
            topologyIdKey: 'name',
            idKey: 'county',
            labelKey: 'county',
            fill: '#0000',
            stroke: '#6687990C',
            strokeWidth: 1,
            showInLegend: false,
            highlight: { enabled: false },
            label: {
                minimumFontSize: 8,
                color: '#66879933',
                formatter: ({ value }) => {
                    return value === 'Chiltern' || value === 'Three Rivers' || value === 'Epping Forest' ? value : '';
                },
            },
        },
        {
            type: 'map-shape',
            topology: londonBoroughTopology,
            data: londonBoroughData,
            idKey: 'name',
            topologyIdKey: 'name',
            labelKey: 'name',
            fill: '#66879933',
            stroke: '#6687990C',
            strokeWidth: 1,
            showInLegend: false,
            highlight: { enabled: false },
            label: {
                enabled: true,
                minimumFontSize: 8,
            },
            tooltip: {
                renderer: ({ datum }) => {
                    const borough = datum['name'];
                    return {
                        title: 'London Borough',
                    };
                },
            },
        },
        ...Object.entries(tubeData).map(([line, data]) => ({
            type: 'map-line' as const,
            title: line,
            data,
            idKey: 'section',
            sizeKey: 'passengers',
            stroke: tubeLineColours[line as keyof typeof tubeLineColours],
            sizeDomain,
            strokeWidth: 1.5,
            maxStrokeWidth: 6,
            highlight: {
                highlightedItem: {
                    strokeWidth: 8,
                    strokeOpacity: 0.9,
                },
            },
            tooltip: {
                renderer: ({ datum }: { datum: any }) => {
                    const passengers = (datum as any)['passengers'].toLocaleString();
                    return {
                        data: [{ label: `Passengers`, value: passengers }],
                    };
                },
            },
        })),
    ],
};

AgCharts.create(options);
