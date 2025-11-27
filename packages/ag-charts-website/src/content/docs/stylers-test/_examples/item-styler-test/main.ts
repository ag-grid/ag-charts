// @ag-skip-fws
// @ag-skip-container-check
import {
    AgCartesianChartOptions,
    AgChartOptions,
    AgCharts,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
    AgTopologyChartOptions,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import {
    getBoxPlotData,
    getCandlestickData,
    getCartesianData,
    getChordData,
    getFunnelData,
    getHeatmapData,
    getMapData,
    getMapLineTopology,
    getMapMarkerTopology,
    getMapTopology,
    getOhlcData,
    getPieData,
    getPyramidData,
    getSankeyData,
    getSunburstData,
    getTreemapData,
    getWaterfallData,
} from './data';

// Track itemStyler usage and highlightState validity
const itemStylerStatus: Record<
    string,
    {
        used: boolean;
        hasValidHighlightState: boolean;
        hasInvalidHighlightState: boolean;
        unseenStates: Set<string>;
        chartType?: string;
    }
> = {};

// Track current chart type
let currentChartType: string = 'initial';

// Load data from data.ts
const cartesianData = getCartesianData();
const waterfallData = getWaterfallData();
const pieData = getPieData();
const treemapData = getTreemapData();
const boxPlotData = getBoxPlotData();
const heatmapData = getHeatmapData();
const funnelData = getFunnelData();
const sankeyData = getSankeyData();
const ohlcData = getOhlcData();
const candlestickData = getCandlestickData();
const pyramidData = getPyramidData();
const chordData = getChordData();
const sunburstData = getSunburstData();
const mapData = getMapData();
const mapTopology = getMapTopology();
const mapLineTopology = getMapLineTopology();
const mapMarkerTopology = getMapMarkerTopology();

const validHighlightStates = [
    'highlighted-item',
    'unhighlighted-item',
    'highlighted-series',
    'unhighlighted-series',
    'none',
];

// Helper function to create a logging itemStyler
function createItemStyler(type: string) {
    return (params: any) => {
        // Initialize or update status for this styler
        if (!itemStylerStatus[type]) {
            itemStylerStatus[type] = {
                used: false,
                hasValidHighlightState: false,
                hasInvalidHighlightState: false,
                unseenStates: new Set<string>([
                    'highlighted-item',
                    'unhighlighted-item',
                    'highlighted-series',
                    'unhighlighted-series',
                    'none',
                ]),
                chartType: currentChartType,
            };
        }

        const status = itemStylerStatus[type];
        status.used = true;
        status.chartType = currentChartType;

        // Check highlightState validity
        const hasValidHighlightState = validHighlightStates.includes(params.highlightState);

        if (hasValidHighlightState) {
            status.hasValidHighlightState = true;
            status.unseenStates.delete(params.highlightState);
        } else {
            status.hasInvalidHighlightState = true;
        }

        console.log(`[${type} itemStyler]`, {
            highlightState: params.highlightState,
            seriesId: params.seriesId,
            datum: params.datum,
            ...params,
        });

        updateStatusIndicators();
        return undefined;
    };
}

const barLineAreaOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'area',
            xKey: 'category',
            yKey: 'value1',
            yName: 'Area Series',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('area-marker'),
            },
            label: {
                enabled: true,
                itemStyler: createItemStyler('area-label*'),
            },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'value1',
            yName: 'Bar Series',
            itemStyler: createItemStyler('bar'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('bar-label*'),
            },
            errorBar: {
                yLowerKey: 'value1',
                yUpperKey: 'value2',
                itemStyler: createItemStyler('bar-errorBar'),
            },
        },
        {
            type: 'line',
            xKey: 'category',
            yKey: 'value2',
            yName: 'Line Series',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('line-marker'),
            },
            label: {
                enabled: true,
                itemStyler: createItemStyler('line-label*'),
            },
            errorBar: {
                yLowerKey: 'value1',
                yUpperKey: 'value2',
                itemStyler: createItemStyler('line-errorBar'),
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

const scatterBubbleOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'scatter',
            xKey: 'value1',
            yKey: 'value2',
            yName: 'Scatter Series 1',
            itemStyler: createItemStyler('scatter1'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('scatter1-label*'),
            },
            errorBar: {
                xLowerKey: 'value1',
                xUpperKey: 'size',
                yLowerKey: 'value2',
                yUpperKey: 'size',
                itemStyler: createItemStyler('scatter1-errorBar'),
            },
        },
        {
            type: 'scatter',
            xKey: 'value2',
            yKey: 'value1',
            yName: 'Scatter Series 2',
            itemStyler: createItemStyler('scatter2'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('scatter2-label*'),
            },
        },
        {
            type: 'bubble',
            xKey: 'value1',
            yKey: 'value2',
            sizeKey: 'size',
            yName: 'Bubble Series',
            itemStyler: createItemStyler('bubble'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('bubble-label*'),
            },
        },
    ],
    axes: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
};

const pieDonutOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
            sectorLabelKey: 'value',
            legendItemKey: 'label',
            outerRadiusRatio: 0.5,
            itemStyler: createItemStyler('pie'),
            calloutLabel: {
                enabled: true,
                itemStyler: createItemStyler('pie-calloutLabel*'),
            },
            sectorLabel: {
                enabled: true,
                itemStyler: createItemStyler('pie-sectorLabel*'),
            },
        },
        {
            type: 'donut',
            angleKey: 'value2',
            calloutLabelKey: 'label',
            sectorLabelKey: 'value2',
            legendItemKey: 'label',
            itemStyler: createItemStyler('donut'),
            calloutLabel: {
                enabled: true,
                itemStyler: createItemStyler('donut-calloutLabel*'),
            },
            sectorLabel: {
                enabled: true,
                itemStyler: createItemStyler('donut-sectorLabel*'),
            },
        },
    ],
};

// Radar Line options
const radarLineOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'radar-line',
            angleKey: 'label',
            radiusKey: 'value',
            radiusName: 'Radar Line 1',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('radarLine1-marker'),
            },
            label: {
                enabled: true,
                itemStyler: createItemStyler('radarLine1-label*'),
            },
        },
        {
            type: 'radar-line',
            angleKey: 'label',
            radiusKey: 'value2',
            radiusName: 'Radar Line 2',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('radarLine2-marker'),
            },
            label: {
                enabled: true,
                itemStyler: createItemStyler('radarLine2-label*'),
            },
        },
    ],
};

// Radar Area options
const radarAreaOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'radar-area',
            angleKey: 'label',
            radiusKey: 'value',
            radiusName: 'Radar Area 1',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('radarArea1-marker'),
            },
            label: {
                enabled: true,
                itemStyler: createItemStyler('radarArea1-label*'),
            },
        },
        {
            type: 'radar-area',
            angleKey: 'label',
            radiusKey: 'value2',
            radiusName: 'Radar Area 2',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('radarArea2-marker'),
            },
            label: {
                enabled: true,
                itemStyler: createItemStyler('radarArea2-label*'),
            },
        },
    ],
};

// Radial Bar options
const radialBarOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'label',
            angleKey: 'value',
            angleName: 'Radial Bar 1',
            itemStyler: createItemStyler('radialBar1'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('radialBar1-label*'),
            },
        },
        {
            type: 'radial-bar',
            radiusKey: 'label',
            angleKey: 'value2',
            angleName: 'Radial Bar 2',
            itemStyler: createItemStyler('radialBar2'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('radialBar2-label*'),
            },
        },
    ],
};

// Radial Column options
const radialColumnOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'radial-column',
            angleKey: 'label',
            radiusKey: 'value',
            radiusName: 'Radial Column 1',
            itemStyler: createItemStyler('radialColumn1'),
            label: {
                enabled: true,
                formatter: ({ value }) => `${value}`,
                itemStyler: createItemStyler('radialColumn1-label*'),
            },
        },
        {
            type: 'radial-column',
            angleKey: 'label',
            radiusKey: 'value2',
            radiusName: 'Radial Column 2',
            itemStyler: createItemStyler('radialColumn2'),
            label: {
                enabled: true,
                formatter: ({ value }) => `${value}`,
                itemStyler: createItemStyler('radialColumn2-label*'),
            },
        },
    ],
};

// Nightingale options
const nightingaleOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'nightingale',
            angleKey: 'label',
            radiusKey: 'value',
            radiusName: 'Nightingale 1',
            itemStyler: createItemStyler('nightingale1'),
            label: {
                enabled: true,
                formatter: ({ value }) => `${value}`,
                itemStyler: createItemStyler('nightingale1-label*'),
            },
        },
        {
            type: 'nightingale',
            angleKey: 'label',
            radiusKey: 'value2',
            radiusName: 'Nightingale 2',
            itemStyler: createItemStyler('nightingale2'),
            label: {
                enabled: true,
                formatter: ({ value }) => `${value}`,
                itemStyler: createItemStyler('nightingale2-label*'),
            },
        },
    ],
};

const treemapOptions: AgHierarchyChartOptions = {
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            itemStyler: createItemStyler('treemap'),
            tile: {
                label: {
                    enabled: true,
                    itemStyler: createItemStyler('treemap-tile-label'),
                },
                secondaryLabel: {
                    enabled: true,
                    itemStyler: createItemStyler('treemap-tile-secondaryLabel'),
                },
            },
            group: {
                label: {
                    enabled: true,
                    itemStyler: createItemStyler('treemap-group-label'),
                },
            },
        },
    ],
};

const histogramOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'histogram',
            xKey: 'value1',
            yName: 'Histogram',
            // Note: Histogram series does not support itemStyler
        },
    ],
};

const boxPlotOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'box-plot',
            xKey: 'category',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            yName: 'Box Plot 1',
            itemStyler: createItemStyler('boxPlot1'),
        },
        {
            type: 'box-plot',
            xKey: 'category',
            minKey: 'min2',
            q1Key: 'q1_2',
            medianKey: 'median2',
            q3Key: 'q3_2',
            maxKey: 'max2',
            yName: 'Box Plot 2',
            itemStyler: createItemStyler('boxPlot2'),
        },
    ],
};

const heatmapOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'heatmap',
            xKey: 'x',
            yKey: 'y',
            colorKey: 'value',
            yName: 'Heatmap 1',
            itemStyler: createItemStyler('heatmap1'),
        },
        {
            type: 'heatmap',
            xKey: 'x',
            yKey: 'y',
            colorKey: 'value2',
            yName: 'Heatmap 2',
            itemStyler: createItemStyler('heatmap2'),
        },
    ],
};

const rangeSeriesOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'range-bar',
            xKey: 'category',
            yLowKey: 'value1',
            yHighKey: 'value2',
            yName: 'Range Bar 1',
            itemStyler: createItemStyler('rangeBar1'),
        },
        {
            type: 'range-bar',
            xKey: 'category',
            yLowKey: 'min',
            yHighKey: 'max',
            yName: 'Range Bar 2',
            itemStyler: createItemStyler('rangeBar2'),
        },
        {
            type: 'range-area',
            xKey: 'category',
            yLowKey: 'value1',
            yHighKey: 'value2',
            yName: 'Range Area 1',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('rangeArea1-marker'),
            },
        },
        {
            type: 'range-area',
            xKey: 'category',
            yLowKey: 'min',
            yHighKey: 'max',
            yName: 'Range Area 2',
            marker: {
                enabled: true,
                itemStyler: createItemStyler('rangeArea2-marker'),
            },
        },
    ],
};

const waterfallOptions: AgCartesianChartOptions = {
    series: [
        // Single series only
        {
            type: 'waterfall',
            xKey: 'category',
            yKey: 'value',
            yName: 'Waterfall 1',
            totals: [
                {
                    totalType: 'total',
                    index: 3,
                    axisLabel: 'Total 1',
                },
            ],
            item: {
                positive: {
                    itemStyler: createItemStyler('waterfall1-positive'),
                },
                negative: {
                    itemStyler: createItemStyler('waterfall1-negative'),
                },
                total: {
                    itemStyler: createItemStyler('waterfall1-total'),
                },
            },
        },
    ],
};

const funnelOptions: AgChartOptions = {
    series: [
        {
            type: 'funnel',
            stageKey: 'category',
            valueKey: 'value',
            itemStyler: createItemStyler('funnel'),
        },
    ],
};

const sankeyOptions: AgChartOptions = {
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'value',
            link: {
                itemStyler: createItemStyler('sankey-link'),
            },
            node: {
                itemStyler: createItemStyler('sankey-node'),
            },
        },
    ],
};

const ohlcOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'ohlc',
            xKey: 'date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            yName: 'OHLC 1',
            itemStyler: createItemStyler('ohlc1'),
        },
        {
            type: 'ohlc',
            xKey: 'date',
            openKey: 'open2',
            highKey: 'high2',
            lowKey: 'low2',
            closeKey: 'close2',
            yName: 'OHLC 2',
            itemStyler: createItemStyler('ohlc2'),
        },
    ],
    axes: {
        x: { type: 'time', position: 'bottom' },
    },
};

const candlestickOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            yName: 'Candlestick 1',
            itemStyler: createItemStyler('candlestick1'),
        },
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open2',
            highKey: 'high2',
            lowKey: 'low2',
            closeKey: 'close2',
            yName: 'Candlestick 2',
            itemStyler: createItemStyler('candlestick2'),
        },
    ],
    axes: {
        x: { type: 'time', position: 'bottom' },
    },
};

const pyramidOptions: AgChartOptions = {
    series: [
        {
            type: 'pyramid',
            stageKey: 'category',
            valueKey: 'value',
            itemStyler: createItemStyler('pyramid'),
        },
    ],
};

const chordOptions: AgChartOptions = {
    series: [
        {
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'value',
            link: {
                itemStyler: createItemStyler('chord-link'),
            },
            node: {
                itemStyler: createItemStyler('chord-node'),
            },
        },
    ],
};

const sunburstOptions: AgHierarchyChartOptions = {
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'value',
            itemStyler: createItemStyler('sunburst'),
        },
    ],
};

const mapOptions: AgTopologyChartOptions = {
    topology: mapTopology,
    legend: {},
    series: [
        {
            type: 'map-shape-background',
            topology: mapTopology,
            fill: '#f0f0f0',
            stroke: '#d0d0d0',
            strokeWidth: 1,
        },
        {
            type: 'map-shape',
            topology: mapTopology,
            data: mapData,
            idKey: 'name',
            colorKey: 'value',
            title: 'Map Shape 1',
            itemStyler: createItemStyler('mapShape1'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('mapShape1-label*'),
            },
        },
        {
            type: 'map-shape',
            topology: mapTopology,
            data: mapData,
            idKey: 'name',
            colorKey: 'value2',
            title: 'Map Shape 2',
            itemStyler: createItemStyler('mapShape2'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('mapShape2-label*'),
            },
        },
        {
            type: 'map-marker',
            topology: mapMarkerTopology,
            data: mapData,
            idKey: 'name',
            sizeKey: 'value',
            title: 'Map Marker 1',
            itemStyler: createItemStyler('mapMarker1'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('mapMarker1-label*'),
            },
        },
        {
            type: 'map-marker',
            topology: mapMarkerTopology,
            data: mapData,
            idKey: 'name',
            sizeKey: 'value2',
            title: 'Map Marker 2',
            itemStyler: createItemStyler('mapMarker2'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('mapMarker2-label*'),
            },
        },
        {
            type: 'map-line',
            topology: mapLineTopology,
            data: [
                { name: 'Trade Route North', value: 100, value2: 80 },
                { name: 'Trade Route South', value: 80, value2: 90 },
                { name: 'Mountain Pass', value: 60, value2: 70 },
            ],
            idKey: 'name',
            sizeKey: 'value',
            title: 'Map Line 1',
            itemStyler: createItemStyler('mapLine1'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('mapLine1-label*'),
            },
        },
        {
            type: 'map-line',
            topology: mapLineTopology,
            data: [
                { name: 'Trade Route North', value: 100, value2: 80 },
                { name: 'Trade Route South', value: 80, value2: 90 },
                { name: 'Mountain Pass', value: 60, value2: 70 },
            ],
            idKey: 'name',
            sizeKey: 'value2',
            title: 'Map Line 2',
            itemStyler: createItemStyler('mapLine2'),
            label: {
                enabled: true,
                itemStyler: createItemStyler('mapLine2-label*'),
            },
        },
    ],
};

let chart: any;

function createChart(newOptions: AgChartOptions, chartType: string) {
    if (chart) {
        chart.destroy();
    }
    currentChartType = chartType;
    chart = AgCharts.create(newOptions);
    setTimeout(updateStatusIndicators, 100);
}

function showBarLineArea() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: cartesianData,
        animation: { enabled: false },
        ...barLineAreaOptions,
    };
    createChart(options, 'Bar + Line + Area');
}

function showScatterBubble() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: cartesianData,
        animation: { enabled: false },
        ...scatterBubbleOptions,
    };
    createChart(options, 'Scatter + Bubble');
}

function showPieDonut() {
    const options: AgPolarChartOptions = {
        container: document.getElementById('myChart'),
        data: pieData,
        animation: { enabled: false },
        ...pieDonutOptions,
    };
    createChart(options, 'Pie + Donut');
}

function showTreemap() {
    const options: AgHierarchyChartOptions = {
        container: document.getElementById('myChart'),
        data: [treemapData],
        animation: { enabled: false },
        ...treemapOptions,
    };
    createChart(options, 'Treemap');
}

function showOtherSeries() {
    // Show the range series which are compatible together
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: cartesianData,
        animation: { enabled: false },
        ...rangeSeriesOptions,
    };
    createChart(options, 'Range Series');
}

function showHistogram() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: cartesianData,
        animation: { enabled: false },
        ...histogramOptions,
    };
    createChart(options, 'Histogram');
}

function showBoxPlot() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: boxPlotData,
        animation: { enabled: false },
        ...boxPlotOptions,
    };
    createChart(options, 'Box Plot');
}

function showHeatmap() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: heatmapData,
        animation: { enabled: false },
        ...heatmapOptions,
    };
    createChart(options, 'Heatmap');
}

function showWaterfall() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: waterfallData,
        animation: { enabled: false },
        ...waterfallOptions,
    };
    createChart(options, 'Waterfall');
}

function showRadarLine() {
    const options: AgPolarChartOptions = {
        container: document.getElementById('myChart'),
        data: pieData,
        animation: { enabled: false },
        ...radarLineOptions,
    };
    createChart(options, 'Radar Line');
}

function showRadarArea() {
    const options: AgPolarChartOptions = {
        container: document.getElementById('myChart'),
        data: pieData,
        animation: { enabled: false },
        ...radarAreaOptions,
    };
    createChart(options, 'Radar Area');
}

function showRadialBar() {
    const options: AgPolarChartOptions = {
        container: document.getElementById('myChart'),
        data: pieData,
        animation: { enabled: false },
        ...radialBarOptions,
    };
    createChart(options, 'Radial Bar');
}

function showRadialColumn() {
    const options: AgPolarChartOptions = {
        container: document.getElementById('myChart'),
        data: pieData,
        animation: { enabled: false },
        ...radialColumnOptions,
    };
    createChart(options, 'Radial Column');
}

function showNightingale() {
    const options: AgPolarChartOptions = {
        container: document.getElementById('myChart'),
        data: pieData,
        animation: { enabled: false },
        ...nightingaleOptions,
    };
    createChart(options, 'Nightingale');
}

function showFunnel() {
    const options: AgChartOptions = {
        container: document.getElementById('myChart'),
        data: funnelData,
        animation: { enabled: false },
        ...funnelOptions,
    };
    createChart(options, 'Funnel');
}

function showSankey() {
    const options: AgChartOptions = {
        container: document.getElementById('myChart'),
        data: sankeyData,
        animation: { enabled: false },
        ...sankeyOptions,
    };
    createChart(options, 'Sankey');
}

function showOhlc() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: ohlcData,
        animation: { enabled: false },
        ...ohlcOptions,
    };
    createChart(options, 'OHLC');
}

function showCandlestick() {
    const options: AgCartesianChartOptions = {
        container: document.getElementById('myChart'),
        data: candlestickData,
        animation: { enabled: false },
        ...candlestickOptions,
    };
    createChart(options, 'Candlestick');
}

function showPyramid() {
    const options: AgChartOptions = {
        container: document.getElementById('myChart'),
        data: pyramidData,
        animation: { enabled: false },
        ...pyramidOptions,
    };
    createChart(options, 'Pyramid');
}

function showChord() {
    const options: AgChartOptions = {
        container: document.getElementById('myChart'),
        data: chordData,
        animation: { enabled: false },
        ...chordOptions,
    };
    createChart(options, 'Chord');
}

function showSunburst() {
    const options: AgHierarchyChartOptions = {
        container: document.getElementById('myChart'),
        data: [sunburstData],
        animation: { enabled: false },
        ...sunburstOptions,
    };
    createChart(options, 'Sunburst');
}

function showMap() {
    const options: AgChartOptions = {
        container: document.getElementById('myChart'),
        animation: { enabled: false },
        ...mapOptions,
    };
    createChart(options, 'Map');
}

function clearConsole() {
    console.clear();
    console.log('Console cleared. Hover over chart elements to see itemStyler logs.');
}

function resetStatus() {
    // Only reset statuses for the current chart
    Object.keys(itemStylerStatus).forEach((key) => {
        if (itemStylerStatus[key].chartType === currentChartType) {
            itemStylerStatus[key] = {
                used: false,
                hasValidHighlightState: false,
                hasInvalidHighlightState: false,
                unseenStates: new Set<string>([
                    'highlighted-item',
                    'unhighlighted-item',
                    'highlighted-series',
                    'unhighlighted-series',
                    'none',
                ]),
                chartType: currentChartType,
            };
        }
    });
    updateStatusIndicators();
    console.log('Status indicators reset. Interact with the chart to update them.');
}

(window as any).showBarLineArea = showBarLineArea;
(window as any).showScatterBubble = showScatterBubble;
(window as any).showPieDonut = showPieDonut;
(window as any).showTreemap = showTreemap;
(window as any).showOtherSeries = showOtherSeries;
(window as any).showRadarLine = showRadarLine;
(window as any).showRadarArea = showRadarArea;
(window as any).showRadialBar = showRadialBar;
(window as any).showRadialColumn = showRadialColumn;
(window as any).showNightingale = showNightingale;
(window as any).showHistogram = showHistogram;
(window as any).showBoxPlot = showBoxPlot;
(window as any).showHeatmap = showHeatmap;
(window as any).showWaterfall = showWaterfall;
(window as any).showFunnel = showFunnel;
(window as any).showSankey = showSankey;
(window as any).showOhlc = showOhlc;
(window as any).showCandlestick = showCandlestick;
(window as any).showPyramid = showPyramid;
(window as any).showChord = showChord;
(window as any).showSunburst = showSunburst;
(window as any).showMap = showMap;
(window as any).clearConsole = clearConsole;
(window as any).resetStatus = resetStatus;

// Set the chart type BEFORE defining options so itemStylers are properly tagged
currentChartType = 'Bar + Line + Area';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: cartesianData,
    animation: { enabled: false },
    ...barLineAreaOptions,
};

chart = AgCharts.create(options);
setTimeout(updateStatusIndicators, 100);

function updateStatusIndicators() {
    const statusContainer = document.getElementById('statusIndicators');
    const matrixContainer = document.getElementById('statusMatrix');
    if (!statusContainer || !matrixContainer) return;

    const allValidHighlightStates = [
        'highlighted-item',
        'unhighlighted-item',
        'highlighted-series',
        'unhighlighted-series',
        'none',
    ];

    // Create series groups - only for current chart
    const seriesGroups: Record<string, string[]> = {};
    const currentChartKeys = Object.keys(itemStylerStatus).filter((key) => {
        const status = itemStylerStatus[key];
        return status && status.used && status.chartType === currentChartType;
    });

    currentChartKeys.forEach((key) => {
        const parts = key.split('-');
        const seriesType = parts[0];
        const configType = parts.length > 1 ? parts[parts.length - 1] : 'item';

        if (!seriesGroups[seriesType]) {
            seriesGroups[seriesType] = [];
        }
        if (!seriesGroups[seriesType].includes(configType)) {
            seriesGroups[seriesType].push(configType);
        }
    });

    // Create status indicators HTML with series grouping
    const statusHtml = `
        <h3>Current Chart: ${currentChartType}</h3>
        <div class="status-items">
            ${Object.entries(itemStylerStatus)
                .filter(([_, status]) => status && status.used && status.chartType === currentChartType)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, status]) => {
                    let color = '#999';
                    let statusText = 'Not used';
                    let tooltip = '';

                    if (status.used) {
                        if (status.hasInvalidHighlightState) {
                            color = '#f44336';
                            statusText = 'Invalid ✗';
                            tooltip = 'Received invalid highlightState values';
                        } else if (status.hasValidHighlightState) {
                            const unseenCount = status.unseenStates.size;
                            const totalCount = allValidHighlightStates.length;

                            if (unseenCount === 0) {
                                color = '#4caf50';
                                statusText = 'Complete ✓';
                                tooltip = `All ${totalCount} states seen`;
                            } else {
                                color = '#ffd700';
                                statusText = `Partial (${totalCount - unseenCount}/${totalCount})`;
                                const seenSt = allValidHighlightStates.filter((s) => !status.unseenStates.has(s));
                                tooltip = `Missing: ${Array.from(status.unseenStates).join(', ')}\nSeen: ${seenSt.join(', ')}`;
                            }
                        }
                    }

                    return `<div class="status-item" style="background: ${color}; color: ${color === '#ffd700' ? 'black' : 'white'}; padding: 5px 10px; margin: 2px; border-radius: 3px; display: inline-block;" title="${tooltip}">
                        ${name}: ${statusText}
                    </div>`;
                })
                .join('')}
        </div>
        <h4>Series Summary</h4>
        <div class="series-summary">
            ${Object.keys(seriesGroups)
                .sort()
                .map((seriesType) => {
                    const configs = seriesGroups[seriesType];
                    let completeCount = 0;
                    let partialCount = 0;
                    let unusedCount = 0;

                    configs.forEach((config) => {
                        const key = config === 'item' ? seriesType : `${seriesType}-${config}`;
                        const status = itemStylerStatus[key];

                        if (!status || !status.used) {
                            unusedCount++;
                        } else if (status.unseenStates.size === 0) {
                            completeCount++;
                        } else {
                            partialCount++;
                        }
                    });

                    const totalConfigs = configs.length;
                    let summaryColor = '#4caf50';
                    let summaryText = 'Complete';

                    if (unusedCount > 0 || partialCount > 0) {
                        if (completeCount === 0) {
                            summaryColor = '#f44336';
                            summaryText = 'Incomplete';
                        } else {
                            summaryColor = '#ffd700';
                            summaryText = 'Partial';
                        }
                    }

                    return `<div class="series-item" style="background: ${summaryColor}; color: ${summaryColor === '#ffd700' ? 'black' : 'white'}; padding: 8px 12px; margin: 5px; border-radius: 5px; display: inline-block;">
                        <strong>${seriesType}</strong>: ${summaryText} (${completeCount}/${totalConfigs} complete)
                    </div>`;
                })
                .join('')}
        </div>
    `;

    // Create matrix HTML with grouped columns
    const matrixHtml = `
        <style>
            .status-matrix-table {
                border-collapse: collapse;
                width: 100%;
                margin: 10px 0;
                font-size: 12px;
            }
            .status-matrix-table th, .status-matrix-table td {
                border: 1px solid #ddd;
                padding: 4px 8px;
                text-align: center;
            }
            .status-matrix-table th {
                background: #f5f5f5;
                font-weight: bold;
            }
            .status-matrix-table .config-header {
                background: #e8e8e8;
                font-size: 10px;
                border-top: 2px solid #999;
            }
            .status-matrix-table .state-name {
                background: #f9f9f9;
                text-align: left;
                font-weight: bold;
            }
            .matrix-cell {
                width: 30px;
                height: 20px;
                min-width: 30px;
            }
            .matrix-legend {
                margin: 10px 0;
                font-size: 12px;
            }
            .legend-item {
                margin-right: 15px;
                display: inline-flex;
                align-items: center;
            }
            .legend-color {
                width: 12px;
                height: 12px;
                margin-right: 5px;
                border: 1px solid #ccc;
            }
        </style>
        <h3>State vs Series Configuration Matrix</h3>
        <table class="status-matrix-table">
            <thead>
                <tr>
                    <th rowspan="2">Highlight State</th>
                    ${Object.keys(seriesGroups)
                        .sort()
                        .map((seriesType) => `<th colspan="${seriesGroups[seriesType].length}">${seriesType}</th>`)
                        .join('')}
                </tr>
                <tr>
                    ${Object.keys(seriesGroups)
                        .sort()
                        .map((seriesType) =>
                            seriesGroups[seriesType]
                                .sort()
                                .map((config) => `<th class="config-header">${config}</th>`)
                                .join('')
                        )
                        .join('')}
                </tr>
            </thead>
            <tbody>
                ${allValidHighlightStates
                    .map((state) => {
                        return `<tr>
                        <td class="state-name">${state}</td>
                        ${Object.keys(seriesGroups)
                            .sort()
                            .map((seriesType) =>
                                seriesGroups[seriesType]
                                    .sort()
                                    .map((config) => {
                                        const key = config === 'item' ? seriesType : `${seriesType}-${config}`;
                                        const status = itemStylerStatus[key];
                                        const hasState = status && status.used && !status.unseenStates.has(state);

                                        let color = '#999';
                                        let tooltip = 'Configuration not used';

                                        if (status && status.used) {
                                            if (hasState) {
                                                color = '#4caf50';
                                                tooltip = `${seriesType} ${config}: State "${state}" seen`;
                                            } else {
                                                color = '#ffd700';
                                                tooltip = `${seriesType} ${config}: State "${state}" NOT seen`;
                                            }
                                        }

                                        return `<td class="matrix-cell" style="background: ${color};" title="${tooltip}"></td>`;
                                    })
                                    .join('')
                            )
                            .join('')}
                    </tr>`;
                    })
                    .join('')}
            </tbody>
        </table>
        <div class="matrix-legend">
            <strong>Legend:</strong>
            <span class="legend-item"><span class="legend-color" style="background: #4caf50;"></span> State seen</span>
            <span class="legend-item"><span class="legend-color" style="background: #ffd700;"></span> State not seen</span>
            <span class="legend-item"><span class="legend-color" style="background: #999;"></span> Config not used</span>
        </div>
    `;

    statusContainer.innerHTML = statusHtml;
    matrixContainer.innerHTML = matrixHtml;
}

console.log('ItemStyler Test Page Ready!');
console.log('Hover over chart elements or legend items to trigger itemStyler callbacks.');
console.log('Check the browser console for logged parameters.');
console.log('');
console.log('To see all highlightState values:');
console.log('- none: Default state when nothing is highlighted');
console.log('- item-highlighted: Hover over a specific data point');
console.log('- item-unhighlighted: Other items when one is hovered');
console.log('- series-highlighted: Click on a legend item to highlight a series');
console.log('- series-unhighlighted: Other series when one is highlighted');

setTimeout(updateStatusIndicators, 100);
