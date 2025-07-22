import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Label Highlight State Styling Demo',
    },
    subtitle: {
        text: 'Hover over data points or legend items to see label styling changes',
    },
    data: [
        { month: 'Jan', series1: 30, series2: 45 },
        { month: 'Feb', series1: 25, series2: 55 },
        { month: 'Mar', series1: 40, series2: 35 },
        { month: 'Apr', series1: 35, series2: 50 },
        { month: 'May', series1: 45, series2: 40 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'series1',
            yName: 'Product A',
            stroke: '#5470c6',
            marker: {
                size: 10,
                itemStyler: ({ highlightState }) => {
                    switch (highlightState) {
                        case 'item-highlighted':
                            return {
                                fill: 'red',
                                stroke: 'red',
                                strokeWidth: 2,
                                size: 15,
                            };
                        case 'item-unhighlighted':
                            return {
                                fillOpacity: 0.3,
                                strokeOpacity: 0.3,
                                size: 8,
                            };
                        case 'series-highlighted':
                            return {
                                strokeWidth: 2,
                                size: 12,
                            };
                        case 'series-unhighlighted':
                            return {
                                fillOpacity: 0.2,
                                strokeOpacity: 0.2,
                                size: 6,
                            };
                    }
                },
            },
            label: {
                enabled: true,
                itemStyler: ({ highlightState }) => {
                    switch (highlightState) {
                        case 'item-highlighted':
                            return {
                                color: 'red',
                                fontWeight: 'bold',
                                fontSize: 14,
                            };
                        case 'item-unhighlighted':
                            return {
                                color: 'gray',
                                fontSize: 10,
                            };
                        case 'series-highlighted':
                            return {
                                fontWeight: 'bold',
                                fontSize: 12,
                            };
                        case 'series-unhighlighted':
                            return {
                                color: 'lightgray',
                                fontSize: 8,
                            };
                    }
                },
            },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'series2',
            yName: 'Product B',
            stroke: '#91cc75',
            marker: {
                size: 10,
                itemStyler: ({ highlightState }) => {
                    switch (highlightState) {
                        case 'item-highlighted':
                            return {
                                fill: 'orange',
                                stroke: 'orange',
                                strokeWidth: 2,
                                size: 15,
                            };
                        case 'item-unhighlighted':
                            return {
                                fillOpacity: 0.3,
                                strokeOpacity: 0.3,
                                size: 8,
                            };
                        case 'series-highlighted':
                            return {
                                strokeWidth: 2,
                                size: 12,
                            };
                        case 'series-unhighlighted':
                            return {
                                fillOpacity: 0.2,
                                strokeOpacity: 0.2,
                                size: 6,
                            };
                    }
                },
            },
            label: {
                enabled: true,
                itemStyler: ({ highlightState }) => {
                    switch (highlightState) {
                        case 'item-highlighted':
                            return {
                                color: 'orange',
                                fontWeight: 'bold',
                                fontSize: 14,
                            };
                        case 'item-unhighlighted':
                            return {
                                color: 'gray',
                                fontSize: 10,
                            };
                        case 'series-highlighted':
                            return {
                                fontWeight: 'bold',
                                fontSize: 12,
                            };
                        case 'series-unhighlighted':
                            return {
                                color: 'lightgray',
                                fontSize: 8,
                            };
                    }
                },
            },
        },
    ],
    legend: {
        position: 'bottom',
    },
};

AgCharts.create(options);
