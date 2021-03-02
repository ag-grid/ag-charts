
var systemLoad = 0;
var userLoad = 0;
var data = [];
var refreshRateInMilliseconds = 50;
var millisecondsOfData = 30 * 1000;

function calculateRandomDelta(maxChange) {
    return maxChange / 2 - Math.floor(Math.random() * Math.floor(maxChange + 1));
}

function ensureBounds(load, max) {
    if (load > max) {
        return max;
    } else if (load < 0) {
        return 0;
    }

    return load;
}

function calculateCpuUsage() {
    systemLoad = ensureBounds(systemLoad + calculateRandomDelta(2), 30);
    userLoad = ensureBounds(userLoad + calculateRandomDelta(4), 70);
}

function getData() {
    var dataCount = millisecondsOfData / refreshRateInMilliseconds;
    data.shift();

    var timeDelta = (dataCount - data.length - 1) * refreshRateInMilliseconds;
    var now = Date.now();

    while (data.length < dataCount) {
        calculateCpuUsage();
        data.push({ time: now - timeDelta, system: systemLoad, user: userLoad });
        timeDelta -= refreshRateInMilliseconds;
    }

    return data;
}

var options = {
    container: document.querySelector('#myChart'),
    autoSize: true,
    data: getData(),
    title: {
        text: 'Simulated CPU Usage',
        fontSize: 18,
    },
    series: [
        {
            type: 'area',
            xKey: 'time',
            yKeys: ['system', 'user'],
            yNames: ['System', 'User'],
            fills: ['#ec4d3d', '#4facf2'],
            fillOpacity: 0.5,
            strokes: ['#ec4d3d', '#4facf2']
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Load (%)',
            },
            min: 0,
            max: 100,
        }],
    legend: {
        position: 'bottom',
    },
};

var chart = agCharts.AgChart.create(options);

// inScope[updateData]
function updateData() {
    var now = Date.now();
    options.data = getData();
    options.axes[0].min = now - millisecondsOfData;
    options.axes[0].max = now;

    agCharts.AgChart.update(chart, options);
}

setInterval(this.updateData, refreshRateInMilliseconds);