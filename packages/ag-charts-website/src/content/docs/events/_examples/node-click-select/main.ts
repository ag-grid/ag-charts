import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const selectedMonths = new Set<string>();

function getData() {
    return [
        { month: 'March', units: 25, brands: { BMW: 10, Toyota: 15 }, selected: selectedMonths.has('March') },
        { month: 'April', units: 27, brands: { Ford: 17, BMW: 10 }, selected: selectedMonths.has('April') },
        { month: 'May', units: 42, brands: { Nissan: 20, Toyota: 22 }, selected: selectedMonths.has('May') },
    ];
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Number of Cars Sold',
    },
    subtitle: {
        text: '(click a marker to toggle its selected state)',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'units',
            listeners: {
                seriesNodeClick: (event: any) => {
                    toggleDatum(event, event.datum);
                },
            },
            marker: {
                size: 16,
                itemStyler: (params) => {
                    // Use a different size and color for selected nodes.
                    if (params.datum.selected) {
                        return {
                            fill: 'red',
                            size: 24,
                        };
                    }
                },
            },
            cursor: 'pointer',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

const chart = AgCharts.create(options);

function toggleDatum(_event: any, datum?: any) {
    if (datum == null) {
        selectedMonths.clear();
    } else if (selectedMonths.has(datum.month)) {
        selectedMonths.delete(datum.month);
    } else {
        selectedMonths.add(datum.month);
    }

    options.data = getData();
    chart.update(options);
}
