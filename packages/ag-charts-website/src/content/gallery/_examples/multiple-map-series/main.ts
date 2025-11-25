import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgTopologyChartOptions } from 'ag-charts-enterprise';
import {
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { DataType, FerryDataType } from './data';
import { ferryData } from './ferryData';
import { ferryTopology } from './ferryTopology';
import { flightData } from './flightData';
import { flightTopology } from './flightTopology';
import { islandData } from './islandData';
import { islandTopology } from './islandTopology';

ModuleRegistry.registerModules([
    LegendModule,
    MapLineSeriesModule,
    MapMarkerSeriesModule,
    MapShapeBackgroundSeriesModule,
    ZoomModule,
]);
const sizeDomain = [500, 0];

const options: AgTopologyChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Greek Islands Travel Network',
    },
    subtitle: {
        text: 'Ferry and flight connections between popular Greek island destinations',
    },
    zoom: {
        enabled: true,
    },
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
            fillOpacity: 0.8,
            strokeWidth: 0.5,
        },
        {
            type: 'map-marker',
            title: 'Islands',
            data: islandData,
            topology: islandTopology,
            idKey: 'name',
            sizeKey: 'population',
            sizeName: 'Population',
            shape: 'pin',
            size: 8,
            maxSize: 40,
            strokeOpacity: 1,
            highlight: {
                highlightedItem: {
                    strokeWidth: 4,
                },
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    heading: '🏝️ Island Destination',
                    title: datum.name || 'Island',
                    data: [{ label: 'Population', value: (datum as any)['population']?.toLocaleString() }],
                }),
            },
        },
        {
            type: 'map-line',
            title: 'Ferry Routes',
            legendItemName: 'Ferry Routes',
            data: ferryData,
            topology: ferryTopology,
            idKey: '@id',
            topologyIdKey: '@id',
            sizeKey: 'duration',
            sizeName: 'Duration',
            sizeDomain,
            strokeWidth: 2.5,
            strokeOpacity: 0.7,
            highlight: {
                highlightedItem: {
                    strokeWidth: 4,
                    strokeOpacity: 1,
                },
            },
            tooltip: {
                renderer: ({ datum }: { datum: DataType }) => {
                    const ferry = datum as FerryDataType;
                    const ferryName = ferry.int_name;
                    const duration = ferry.duration;

                    return {
                        heading: '⛴️ Ferry Service',
                        title: ferryName,
                        data: [
                            {
                                label: 'Travel Time',
                                value: duration ? `${Math.floor(duration / 60)}h ${duration % 60}min` : 'N/A',
                            },
                        ],
                    };
                },
            },
        },
        {
            type: 'map-line',
            title: 'Flight Routes',
            legendItemName: 'Flight Routes',
            data: flightData,
            topology: flightTopology,
            idKey: 'name',
            sizeKey: 'duration',
            sizeName: 'Duration',
            sizeDomain,
            strokeWidth: 2,
            strokeOpacity: 0.8,
            lineDash: [6, 3],
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                    strokeOpacity: 1,
                },
            },
            tooltip: {
                renderer: ({ datum }) => {
                    const flightName = datum.name || 'Flight Route';
                    const duration = 'duration' in datum ? datum.duration : null;
                    return {
                        heading: '✈️ Flight Service',
                        title: flightName,
                        data: [
                            {
                                label: 'Flight Time',
                                value: duration ? `${Math.floor(duration / 60)}h ${duration % 60}min` : 'N/A',
                            },
                        ],
                    };
                },
            },
        },
    ],
    legend: {
        enabled: true,
        position: 'bottom',
        item: {
            paddingX: 15,
            paddingY: 10,
            marker: {
                size: 18,
                strokeWidth: 2,
            },
        },
    },
    tooltip: {
        position: {
            anchorTo: 'pointer',
            placement: ['top', 'bottom', 'right', 'left'],
        },
    },
};

AgCharts.create(options);
