import { AgAreaSeriesOptions, AgCharts, AgChartOptions } from 'ag-charts-community';

import { getData } from './data';

function buildSeries(name: string): AgAreaSeriesOptions {
    return {
        type: 'area',
        xKey: 'year',
        yKey: name.toLowerCase(),
        yName: name,
        fillOpacity: 0.5,
    };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Browser Usage Statistics',
    },
    subtitle: {
        text: '2009-2019',
    },
    data: getData(),
    series: [buildSeries('IE'), buildSeries('Chrome'), buildSeries('Firefox'), buildSeries('Safari')],
    legend: { position: 'top' },
};

let chart = AgCharts.create(options);

function download() {
    AgCharts.download(chart);
}

function downloadFixedSize() {
    AgCharts.download(chart, { width: 600, height: 300 });
}

function openImage() {
    AgCharts.getImageDataURL(chart, { width: 600, height: 300 }).then((imageDataURL) => {
        const image = new Image();
        image.src = imageDataURL;

        const tab = window.open(imageDataURL);
        if (tab) {
            tab.document.write(image.outerHTML);
            tab.document.close();
        }
    });
}
