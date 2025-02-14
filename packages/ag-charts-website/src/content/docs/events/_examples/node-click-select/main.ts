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
                nodeClick: (event: any) => {
                    toggleNode(event.datum);
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

function toggleNode(datum: any) {
    const { month } = datum;
    if (selectedMonths.has(month)) {
        selectedMonths.delete(month);
    } else {
        selectedMonths.add(month);
    }

    options.data = getData();
    chart.update(options);
}
