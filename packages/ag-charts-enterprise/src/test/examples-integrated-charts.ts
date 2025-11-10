import type { AgCartesianChartOptions, AgChartOptions, AgChartTheme, AgPolarChartOptions } from 'ag-charts-types';

const BASE_THEME: AgChartTheme = {
    baseTheme: {
        baseTheme: {
            baseTheme: {
                baseTheme: 'ag-default',
            },
            overrides: {
                common: {
                    axes: {
                        number: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        category: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        'grouped-category': {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        log: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        time: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                    },
                    padding: {
                        top: 20,
                        right: 30,
                        bottom: 20,
                        left: 20,
                    },
                },
                pie: {
                    series: {
                        title: {
                            _enabledFromTheme: true,
                        },
                        calloutLabel: {
                            _enabledFromTheme: true,
                        },
                        sectorLabel: {
                            enabled: false,
                            _enabledFromTheme: true,
                        },
                    },
                },
            },
        },
        overrides: {
            common: {
                title: {
                    enabled: true,
                    text: 'Medals by Age',
                },
            },
            bar: {
                axes: {
                    category: {
                        label: {
                            rotation: 0,
                        },
                    },
                },
            },
        },
    } as any,
    overrides: {},
};

function addToString({ value, ...others }: { id: any; value: any }) {
    return {
        toString() {
            return value;
        },
        value,
        ...others,
    };
}

const COMMON = {
    theme: BASE_THEME,
    mode: 'integrated',
    data: [
        {
            age: addToString({
                id: 0,
                value: 18,
            }),
            gold: 0,
            silver: 1,
            bronze: 1,
        },
        {
            age: addToString({
                id: 1,
                value: 19,
            }),
            gold: 1,
            silver: 0,
            bronze: 0,
        },
        {
            age: addToString({
                id: 2,
                value: 21,
            }),
            gold: 1,
            silver: 0,
            bronze: 1,
        },
        {
            age: addToString({
                id: 3,
                value: 22,
            }),
            gold: 2,
            silver: 1,
            bronze: 5,
        },
        {
            age: addToString({
                id: 4,
                value: 23,
            }),
            gold: 1,
            silver: 4,
            bronze: 1,
        },
        {
            age: addToString({
                id: 5,
                value: 24,
            }),
            gold: 1,
            silver: 3,
            bronze: 1,
        },
        {
            age: addToString({
                id: 6,
                value: 25,
            }),
            gold: 3,
            silver: 4,
            bronze: 6,
        },
        {
            age: addToString({
                id: 7,
                value: 26,
            }),
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 8,
                value: 27,
            }),
            gold: 3,
            silver: 3,
            bronze: 4,
        },
        {
            age: addToString({
                id: 9,
                value: 28,
            }),
            gold: 3,
            silver: 1,
            bronze: 1,
        },
        {
            age: addToString({
                id: 10,
                value: 29,
            }),
            gold: 0,
            silver: 2,
            bronze: 0,
        },
        {
            age: addToString({
                id: 11,
                value: 30,
            }),
            gold: 1,
            silver: 0,
            bronze: 1,
        },
        {
            age: addToString({
                id: 12,
                value: 31,
            }),
            gold: 2,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 13,
                value: 32,
            }),
            gold: 1,
            silver: 1,
            bronze: 2,
        },
        {
            age: addToString({
                id: 14,
                value: 33,
            }),
            gold: 0,
            silver: 3,
            bronze: 2,
        },
        {
            age: addToString({
                id: 15,
                value: 34,
            }),
            gold: 1,
            silver: 0,
            bronze: 0,
        },
        {
            age: addToString({
                id: 16,
                value: 35,
            }),
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 17,
                value: 36,
            }),
            gold: 0,
            silver: 0,
            bronze: 1,
        },
        {
            age: addToString({
                id: 18,
                value: 38,
            }),
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 19,
                value: 39,
            }),
            gold: 1,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 20,
                value: 40,
            }),
            gold: 1,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 21,
                value: 42,
            }),
            gold: 0,
            silver: 1,
            bronze: 1,
        },
        {
            age: addToString({
                id: 22,
                value: 45,
            }),
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 23,
                value: 47,
            }),
            gold: 0,
            silver: 0,
            bronze: 1,
        },
        {
            age: addToString({
                id: 24,
                value: 55,
            }),
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: addToString({
                id: 25,
                value: 61,
            }),
            gold: 0,
            silver: 1,
            bronze: 0,
        },
    ],
};

const COLUMN_BASIC: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const COLUMN_STACKED: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            grouped: false,
            stacked: true,
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            grouped: false,
            stacked: true,
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            grouped: false,
            stacked: true,
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const COLUMN_STACKED_NORMALISED: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            label: {},
        },
    },
    series: [
        {
            type: 'bar',
            grouped: false,
            stacked: true,
            normalizedTo: 100,
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            grouped: false,
            stacked: true,
            normalizedTo: 100,
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            grouped: false,
            stacked: true,
            normalizedTo: 100,
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const BAR_BASIC: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        y: {
            type: 'category',
            position: 'left',
        },
        x: {
            type: 'number',
            position: 'bottom',
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const BAR_STACKED: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        y: {
            type: 'category',
            position: 'left',
        },
        x: {
            type: 'number',
            position: 'bottom',
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: true,
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: true,
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: true,
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const BAR_STACKED_NORMALISED: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        y: {
            type: 'category',
            position: 'left',
        },
        x: {
            type: 'number',
            position: 'bottom',
            label: {},
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: true,
            normalizedTo: 100,
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: true,
            normalizedTo: 100,
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: true,
            normalizedTo: 100,
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const BAR_DUPLICATE_VALUES: AgCartesianChartOptions = {
    ...COMMON,
    data: COMMON.data.slice(0, 4).concat({
        age: addToString({
            id: 4,
            value: 21,
        }),
        gold: 3,
        silver: 1,
        bronze: 2,
    }),
    axes: {
        y: {
            type: 'category',
            position: 'left',
        },
        x: {
            type: 'number',
            position: 'bottom',
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: true,
            stacked: false,
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const COMMON_POLAR = {
    ...COMMON,
    data: [
        {
            age: 18,
            gold: 0,
            silver: 1,
            bronze: 1,
        },
        {
            age: 19,
            gold: 1,
            silver: 0,
            bronze: 0,
        },
        {
            age: 21,
            gold: 1,
            silver: 0,
            bronze: 1,
        },
        {
            age: 22,
            gold: 2,
            silver: 1,
            bronze: 5,
        },
        {
            age: 23,
            gold: 1,
            silver: 4,
            bronze: 1,
        },
        {
            age: 24,
            gold: 1,
            silver: 3,
            bronze: 1,
        },
        {
            age: 25,
            gold: 3,
            silver: 4,
            bronze: 6,
        },
        {
            age: 26,
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: 27,
            gold: 3,
            silver: 3,
            bronze: 4,
        },
        {
            age: 28,
            gold: 3,
            silver: 1,
            bronze: 1,
        },
        {
            age: 29,
            gold: 0,
            silver: 2,
            bronze: 0,
        },
        {
            age: 30,
            gold: 1,
            silver: 0,
            bronze: 1,
        },
        {
            age: 31,
            gold: 2,
            silver: 1,
            bronze: 0,
        },
        {
            age: 32,
            gold: 1,
            silver: 1,
            bronze: 2,
        },
        {
            age: 33,
            gold: 0,
            silver: 3,
            bronze: 2,
        },
        {
            age: 34,
            gold: 1,
            silver: 0,
            bronze: 0,
        },
        {
            age: 35,
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: 36,
            gold: 0,
            silver: 0,
            bronze: 1,
        },
        {
            age: 38,
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: 39,
            gold: 1,
            silver: 1,
            bronze: 0,
        },
        {
            age: 40,
            gold: 1,
            silver: 1,
            bronze: 0,
        },
        {
            age: 42,
            gold: 0,
            silver: 1,
            bronze: 1,
        },
        {
            age: 45,
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: 47,
            gold: 0,
            silver: 0,
            bronze: 1,
        },
        {
            age: 55,
            gold: 0,
            silver: 1,
            bronze: 0,
        },
        {
            age: 61,
            gold: 0,
            silver: 1,
            bronze: 0,
        },
    ],
};

const PIE_BASIC: AgPolarChartOptions = {
    ...COMMON_POLAR,
    series: [
        {
            type: 'pie',
            angleKey: 'gold',
            angleName: 'Gold',
            sectorLabelKey: 'gold',
            calloutLabelKey: 'age',
            calloutLabelName: 'Age',
        },
    ],
};

const PIE_DUPLICATE_VALUES: AgPolarChartOptions = {
    ...COMMON_POLAR,
    data: COMMON_POLAR.data.slice(0, 4).concat({
        age: 21,
        gold: 3,
        silver: 0,
        bronze: 0,
    }),
    series: [
        {
            type: 'pie',
            angleKey: 'gold',
            angleName: 'Gold',
            sectorLabelKey: 'gold',
            calloutLabelKey: 'age',
            calloutLabelName: 'Age',
        },
    ],
};

const PIE_OBJECT_VALUES: AgPolarChartOptions = {
    ...COMMON_POLAR,
    data: [
        { asset: { id: 0, name: 'Stocks', value: { x: '15%' } }, amount: 60000 },
        { asset: { id: 1, name: 'Bonds', value: { x: '20%' } }, amount: 40000 },
        { asset: { id: 2, name: 'Cash', value: { x: '10%' } }, amount: 7000 },
        { asset: { id: 3, name: 'Real Estate', value: { x: '25%' } }, amount: 5000 },
        { asset: { id: 4, name: 'Commodities', value: { x: '5%' } }, amount: 3000 },
    ],
    series: [
        {
            type: 'pie',
            angleKey: 'amount',
            calloutLabelKey: 'asset.name',
            legendItemKey: 'asset',
        },
    ],
    legend: {
        item: {
            label: {
                formatter: ({ datum: { asset = {} } }) => {
                    return `${asset.name} - ${asset?.value?.x}`;
                },
            },
        },
    },
};

const DONUT_BASIC: AgPolarChartOptions = {
    ...COMMON_POLAR,
    series: [
        {
            type: 'donut',
            angleKey: 'gold',
            angleName: 'Gold',
            sectorLabelKey: 'gold',
            calloutLabelKey: 'age',
            calloutLabelName: 'Age',
            outerRadiusOffset: 0,
            innerRadiusOffset: -20,
            title: {
                text: 'Gold',
                showInLegend: true,
            },
            calloutLine: {
                colors: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
            },
        },
        {
            type: 'donut',
            angleKey: 'silver',
            angleName: 'Silver',
            sectorLabelKey: 'silver',
            calloutLabelKey: 'age',
            calloutLabelName: 'Age',
            outerRadiusOffset: -40,
            innerRadiusOffset: -60,
            title: {
                text: 'Silver',
                showInLegend: true,
            },
            calloutLine: {
                colors: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
            },
        },
        {
            type: 'donut',
            angleKey: 'bronze',
            angleName: 'Bronze',
            sectorLabelKey: 'bronze',
            calloutLabelKey: 'age',
            calloutLabelName: 'Age',
            outerRadiusOffset: -80,
            innerRadiusOffset: -100,
            title: {
                text: 'Bronze',
                showInLegend: true,
            },
            calloutLine: {
                colors: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
            },
        },
    ],
};

const LINE_BASIC: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const SCATTER_BASIC: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'scatter',
            xKey: 'gold',
            xName: 'Gold',
            yKey: 'silver',
            yName: 'Silver',
            title: 'Silver vs Gold',
            labelKey: 'age',
            labelName: 'Age',
        },
    ],
};

const BUBBLE_BASIC: AgCartesianChartOptions = {
    ...COMMON,
    series: [
        {
            type: 'bubble',
            xKey: 'gold',
            xName: 'Gold',
            yKey: 'silver',
            yName: 'Silver',
            title: 'Silver vs Gold',
            sizeKey: 'bronze',
            sizeName: 'Bronze',
            labelKey: 'age',
            labelName: 'Age',
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

const AREA_BASIC: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
            stacked: false,
        },
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
            stacked: false,
        },
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
            stacked: false,
        },
    ],
};

const AREA_STACKED: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
            stacked: true,
        },
    ],
};

const AREA_STACKED_NORMALISED: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'gold',
            yName: 'Gold',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'silver',
            yName: 'Silver',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'age',
            xName: 'Age',
            yKey: 'bronze',
            yName: 'Bronze',
            normalizedTo: 100,
            stacked: true,
        },
    ],
};

const HISTOGRAM: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'histogram',
            xKey: 'gold',
            xName: 'Gold',
            yName: 'Frequency',
            areaPlot: false,
        },
    ],
};

const COMBO_LINE: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [{}],
            },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'age',
            yKey: 'gold',
            yName: 'Gold',
            stacked: false,
            grouped: true,
        },
        {
            type: 'bar',
            xKey: 'age',
            yKey: 'silver',
            yName: 'Silver',
            stacked: false,
            grouped: true,
        },
        {
            type: 'line',
            xKey: 'age',
            yKey: 'bronze',
            yName: 'Bronze',
            // stacked: false,
        },
    ],
};

const COMBO_AREA: AgCartesianChartOptions = {
    ...COMMON,
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [{}],
            },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'age',
            yKey: 'gold',
            yName: 'Gold',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'age',
            yKey: 'silver',
            yName: 'Silver',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'age',
            yKey: 'bronze',
            yName: 'Bronze',
            stacked: false,
            grouped: true,
        },
    ],
};

const CROSSFILTER_COMMON = {
    mode: 'integrated',
};

const CROSSFILTER_THEME = {
    baseTheme: {
        baseTheme: {
            baseTheme: {
                baseTheme: 'ag-default-dark',
            },
            overrides: {
                common: {
                    axes: {
                        number: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        category: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        'grouped-category': {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        log: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                        time: {
                            title: {
                                _enabledFromTheme: true,
                            },
                        },
                    },
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                    },
                },
                pie: {
                    series: {
                        title: {
                            _enabledFromTheme: true,
                        },
                        calloutLabel: {
                            _enabledFromTheme: true,
                        },
                        sectorLabel: {
                            enabled: false,
                            _enabledFromTheme: true,
                        },
                    },
                },
            },
        },
    },
};

const CROSSFILTER_BAR: AgCartesianChartOptions = {
    ...CROSSFILTER_COMMON,
    theme: {
        baseTheme: {
            baseTheme: CROSSFILTER_THEME,
            overrides: {
                common: {
                    title: {
                        enabled: true,
                        text: 'Handsets Sold (Units)',
                    },
                    legend: {
                        enabled: false,
                    },
                },
            },
        } as any,
        overrides: {},
    },
    data: [
        {
            handset: addToString({
                id: 0,
                value: 'Apple iPhone 12',
            }),
            sale: 79,
            'sale-filtered-out': 0,
        },
        {
            handset: addToString({
                id: 1,
                value: 'Sony Xperia',
            }),
            sale: 73,
            'sale-filtered-out': 0,
        },
        {
            handset: addToString({
                id: 2,
                value: 'Huawei P40',
            }),
            sale: 88,
            'sale-filtered-out': 0,
        },
        {
            handset: addToString({
                id: 3,
                value: 'Google Pixel 5',
            }),
            sale: 88,
            'sale-filtered-out': 0,
        },
        {
            handset: addToString({
                id: 4,
                value: 'Motorola Edge',
            }),
            sale: 90,
            'sale-filtered-out': 0,
        },
        {
            handset: addToString({
                id: 5,
                value: 'Samsung Galaxy S10',
            }),
            sale: 82,
            'sale-filtered-out': 0,
        },
    ],
    axes: {
        y: {
            type: 'category',
            position: 'left',
        },
        x: {
            type: 'number',
            position: 'bottom',
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: false,
            xKey: 'handset',
            xName: 'Handset',
            yKey: 'sale',
            yName: 'Sale Price',
            highlight: {
                highlightedItem: {},
            },
            fill: '#f3622d',
            stroke: '#aa4520',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            grouped: false,
            stacked: false,
            xKey: 'handset',
            xName: 'Handset',
            yKey: 'sale-filtered-out',
            yName: 'Sale Price',
            highlight: {
                highlightedItem: {},
            },
            fill: 'rgba(243, 98, 45, 0.3)',
            stroke: 'rgba(170, 69, 32, 0.3)',
            showInLegend: false,
        },
    ],
};

const CROSSFILTER_COLUMN: AgCartesianChartOptions = {
    ...CROSSFILTER_COMMON,
    theme: {
        baseTheme: {
            baseTheme: CROSSFILTER_THEME,
            overrides: {
                common: {
                    title: {
                        enabled: true,
                        text: 'Quarterly Sales ($)',
                    },
                    legend: {
                        enabled: false,
                    },
                    axes: {
                        category: {
                            label: {
                                rotation: 0,
                            },
                        },
                        number: {
                            label: {},
                        },
                    },
                },
            },
        } as any,
        overrides: {},
    },
    data: [
        {
            quarter: addToString({
                id: 0,
                value: 'Q1',
            }),
            sale: 62949,
            'sale-filtered-out': null,
        },
        {
            quarter: addToString({
                id: 1,
                value: 'Q2',
            }),
            sale: 77933,
            'sale-filtered-out': null,
        },
        {
            quarter: addToString({
                id: 2,
                value: 'Q3',
            }),
            sale: 74555,
            'sale-filtered-out': null,
        },
        {
            quarter: addToString({
                id: 3,
                value: 'Q4',
            }),
            sale: 66873,
            'sale-filtered-out': null,
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            grouped: false,
            stacked: false,
            xKey: 'quarter',
            xName: 'Quarter',
            yKey: 'sale',
            yName: 'Sale Price',
            highlight: {
                highlightedItem: {},
            },
            fill: '#f3622d',
            stroke: '#aa4520',
            listeners: {},
        },
        {
            type: 'bar',
            grouped: false,
            stacked: false,
            xKey: 'quarter',
            xName: 'Quarter',
            yKey: 'sale-filtered-out',
            yName: 'Sale Price',
            highlight: {
                highlightedItem: {},
            },
            fill: 'rgba(243, 98, 45, 0.3)',
            stroke: 'rgba(170, 69, 32, 0.3)',
            listeners: {},
            showInLegend: false,
        },
    ],
};

const CROSSFILTER_PIE_FILTERED: AgPolarChartOptions = {
    ...CROSSFILTER_COMMON,
    theme: {
        baseTheme: {
            baseTheme: CROSSFILTER_THEME,
            overrides: {
                common: {
                    title: {
                        enabled: true,
                        text: 'Sales by Representative ($)',
                    },
                },
                pie: {
                    series: {
                        title: {
                            enabled: false,
                        },
                        calloutLabel: {
                            enabled: false,
                        },
                    },
                    legend: {
                        position: 'right',
                    },
                },
            },
        } as any,
        overrides: {},
    },
    data: [
        {
            salesRep: 'Alton Watson',
            sale: 0.1653718693975118,
            'sale-filtered-out': 1,
            'sale-total': 36814,
        },
        {
            salesRep: 'Cathy Wilkins',
            sale: 0.23581589958158997,
            'sale-filtered-out': 1,
            'sale-total': 41825,
        },
        {
            salesRep: 'Reis Vasquez',
            sale: 0.265677188170497,
            'sale-filtered-out': 1,
            'sale-total': 45209,
        },
        {
            salesRep: 'Caleb Scott',
            sale: 0.2870173712803774,
            'sale-filtered-out': 1,
            'sale-total': 44729,
        },
        {
            salesRep: 'Jermaine Price',
            sale: 0.2268597643249078,
            'sale-filtered-out': 1,
            'sale-total': 33351,
        },
        {
            salesRep: 'Charlie Dodd',
            sale: 0.2306537428225254,
            'sale-filtered-out': 1,
            'sale-total': 37966,
        },
        {
            salesRep: 'Aden Moreno',
            sale: 0.2298660882685779,
            'sale-filtered-out': 1,
            'sale-total': 42416,
        },
    ],
    series: [
        {
            type: 'pie',
            angleKey: 'sale-total',
            angleName: 'Sale Price',
            sectorLabelKey: 'sale',
            calloutLabelKey: 'salesRep',
            calloutLabelName: 'Sales Rep',
            calloutLabel: {
                enabled: false,
            },
            highlight: {
                highlightedItem: {},
            },
            radiusKey: 'sale-filtered-out',
            radiusMin: 0,
            radiusMax: 1,
            listeners: {},
            fills: [
                '#f3622d4d',
                '#fba71b4d',
                '#57b7574d',
                '#41a9c94d',
                '#4258c94d',
                '#9a42c84d',
                '#c841644d',
                '#8888884d',
            ],
            strokes: [
                '#aa45204d',
                '#b075134d',
                '#3d803d4d',
                '#2d768d4d',
                '#2e3e8d4d',
                '#6c2e8c4d',
                '#8c2d464d',
                '#5f5f5f4d',
            ],
            showInLegend: false,
        },
        {
            type: 'pie',
            angleKey: 'sale-total',
            angleName: 'Sale Price',
            sectorLabelKey: 'sale',
            calloutLabelKey: 'salesRep',
            calloutLabelName: 'Sales Rep',
            calloutLabel: {
                enabled: false,
            },
            highlight: {
                highlightedItem: {},
            },
            radiusKey: 'sale',
            radiusMin: 0,
            radiusMax: 1,
            listeners: {},
        },
    ],
};

const CROSSFILTER_BAR_FILTERED: AgCartesianChartOptions = {
    ...CROSSFILTER_BAR,
    data: [
        {
            handset: addToString({
                id: 0,
                value: 'Apple iPhone 12',
            }),
            sale: 22,
            'sale-filtered-out': 57,
        },
        {
            handset: addToString({
                id: 1,
                value: 'Sony Xperia',
            }),
            sale: 18,
            'sale-filtered-out': 55,
        },
        {
            handset: addToString({
                id: 2,
                value: 'Huawei P40',
            }),
            sale: 19,
            'sale-filtered-out': 69,
        },
        {
            handset: addToString({
                id: 3,
                value: 'Google Pixel 5',
            }),
            sale: 20,
            'sale-filtered-out': 68,
        },
        {
            handset: addToString({
                id: 4,
                value: 'Motorola Edge',
            }),
            sale: 21,
            'sale-filtered-out': 69,
        },
        {
            handset: addToString({
                id: 5,
                value: 'Samsung Galaxy S10',
            }),
            sale: 17,
            'sale-filtered-out': 65,
        },
    ],
};

const CROSSFILTER_COLUMN_FILTERED: AgCartesianChartOptions = {
    ...CROSSFILTER_COLUMN,
    data: [
        {
            quarter: addToString({
                id: 0,
                value: 'Q1',
            }),
            sale: null,
            'sale-filtered-out': 62949,
        },
        {
            quarter: addToString({
                id: 1,
                value: 'Q2',
            }),
            sale: null,
            'sale-filtered-out': 77933,
        },
        {
            quarter: addToString({
                id: 2,
                value: 'Q3',
            }),
            sale: null,
            'sale-filtered-out': 74555,
        },
        {
            quarter: addToString({
                id: 3,
                value: 'Q4',
            }),
            sale: 66873,
            'sale-filtered-out': null,
        },
    ],
};

export const CATEGORY_LINE_ANIMATION_QUARTERS = Array.from({ length: 14 }, (_, id) => ({
    id,
    label: `week ${id}`,
    toString: () => `week ${id}`,
}));

const CATEGORY_LINE_ANIMATION: AgCartesianChartOptions = {
    theme: BASE_THEME,
    data: [
        { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[3], week: 3, iphone: 60, android: 50 },
        { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[4], week: 4, iphone: 185, android: 90 },
        { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[5], week: 5, iphone: 148, android: 70 },
        { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[6], week: 6, iphone: 130, android: 130 },
        { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[9], week: 9, iphone: 62, android: 120 },
        { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[10], week: 10, iphone: 137, android: 105 },
        { quarter: CATEGORY_LINE_ANIMATION_QUARTERS[11], week: 11, iphone: 121, android: 100 },
    ],
    series: [
        {
            type: 'line' as const,
            xKey: 'quarter',
            yKey: 'iphone',
        },
        {
            type: 'line' as const,
            xKey: 'quarter',
            yKey: 'android',
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
        },
        x: {
            position: 'bottom',
            type: 'category',
        },
    },

    // @ts-expect-error Not part of the public API.
    mode: 'integrated' as const,
};

const RADAR_LINE_BASIC: AgPolarChartOptions = {
    ...COMMON,
    data: [
        {
            division: addToString({ id: 0, value: 'Sales' }),
            recurring: 485829,
            individual: 263971,
        },
        {
            division: addToString({ id: 1, value: 'Finance' }),
            recurring: 291245,
            individual: 46821,
        },
        {
            division: addToString({ id: 2, value: 'Consultancy' }),
            recurring: 315284,
            individual: 216473,
        },
        {
            division: addToString({ id: 3, value: 'Operations' }),
            recurring: 154319,
            individual: 29867,
        },
        {
            division: addToString({ id: 4, value: 'Media' }),
            recurring: 215284,
            individual: 61473,
        },
    ],
    axes: { angle: { type: 'angle-category' }, radius: { type: 'radius-number' } },
    series: [
        {
            type: 'radar-line',
            angleKey: 'division',
            angleName: 'Division',
            radiusKey: 'recurring',
            radiusName: 'Recurring revenue',
        },
        {
            type: 'radar-line',
            angleKey: 'division',
            angleName: 'Division',
            radiusKey: 'individual',
            radiusName: 'Individual sales',
        },
    ],
};

type TestCase = {
    options: AgChartOptions;
    enterpriseCharts?: boolean;
};
export const EXAMPLES: Record<string, TestCase> = {
    COLUMN_BASIC: { options: COLUMN_BASIC },
    COLUMN_STACKED: { options: COLUMN_STACKED },
    COLUMN_STACKED_NORMALISED: { options: COLUMN_STACKED_NORMALISED },
    BAR_BASIC: { options: BAR_BASIC },
    BAR_STACKED: { options: BAR_STACKED },
    BAR_STACKED_NORMALISED: { options: BAR_STACKED_NORMALISED },
    BAR_DUPLICATE_VALUES: { options: BAR_DUPLICATE_VALUES },
    PIE_BASIC: { options: PIE_BASIC },
    PIE_DUPLICATE_VALUES: { options: PIE_DUPLICATE_VALUES },
    PIE_OBJECT_VALUES: { options: PIE_OBJECT_VALUES },
    DONUT_BASIC: { options: DONUT_BASIC },
    LINE_BASIC: { options: LINE_BASIC },
    SCATTER_BASIC: { options: SCATTER_BASIC },
    BUBBLE_BASIC: { options: BUBBLE_BASIC },
    AREA_BASIC: { options: AREA_BASIC },
    AREA_STACKED: { options: AREA_STACKED },
    AREA_STACKED_NORMALISED: { options: AREA_STACKED_NORMALISED },
    HISTOGRAM: { options: HISTOGRAM, enterpriseCharts: true },
    COMBO_LINE: { options: COMBO_LINE },
    COMBO_AREA: { options: COMBO_AREA },
    CROSSFILTER_BAR: { options: CROSSFILTER_BAR },
    CROSSFILTER_COLUMN: { options: CROSSFILTER_COLUMN },
    CROSSFILTER_PIE_FILTERED: { options: CROSSFILTER_PIE_FILTERED },
    CROSSFILTER_BAR_FILTERED: { options: CROSSFILTER_BAR_FILTERED },
    CROSSFILTER_COLUMN_FILTERED: { options: CROSSFILTER_COLUMN_FILTERED },
    CATEGORY_LINE_ANIMATION: { options: CATEGORY_LINE_ANIMATION },
    RADAR_LINE_BASIC: { options: RADAR_LINE_BASIC, enterpriseCharts: true },
};
