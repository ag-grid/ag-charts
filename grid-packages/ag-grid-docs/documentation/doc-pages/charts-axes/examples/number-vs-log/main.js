var options = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'A', share: 10 },
        { os: 'B', share: 100 },
        { os: 'C', share: 1000 }
    ],
    series: [{
        type: 'line',
        xKey: 'os',
        yKey: 'share'
    }],
    axes: [{
        type: 'category',
        position: 'bottom'
    }, {
        type: 'number',
        position: 'left',
        label: {
            format: '.0f'
        },
        tick: {
            count: 10
        }
    }],
    legend: {
        enabled: false
    }
};

var chart = agCharts.AgChart.create(options);

function useNumberAxis() {
    options.axes[1] = {
        type: 'number',
        position: 'left',
        min: 1,
        label: {
            format: '.0f'
        },
        tick: {
            count: 10
        }
    };
    agCharts.AgChart.update(chart, options);
}

function useLogAxis() {
    options.axes[1] = {
        type: 'log',
        position: 'left',
        min: 10,
        label: {
            format: '.0f'
        },
        tick: {
            count: 10
        }
    };
    agCharts.AgChart.update(chart, options);
}

function useBaseTwoLogAxis() {
    options.axes[1] = {
        type: 'log',
        position: 'left',
        min: 10,
        label: {
            format: '.0f'
        },
        tick: {
            count: 10
        },
        base: 2
    };
    agCharts.AgChart.update(chart, options);
}

function useLogAxisWithFewerTicks() {
    options.axes[1] = {
        type: 'log',
        position: 'left',
        min: 10,
        label: {
            format: '.0f'
        },
        tick: {
            count: 2 // a hint that we want a smaller tick count
        }
    };
    agCharts.AgChart.update(chart, options);
}