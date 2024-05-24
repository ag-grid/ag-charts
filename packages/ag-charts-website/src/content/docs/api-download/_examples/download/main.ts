import { AgAreaSeriesOptions, AgChartOptions, AgCharts } from 'ag-charts-community';

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

const chart = AgCharts.create(options);

function download() {
    chart.download();
}

function downloadFixedSize() {
    chart.download({ width: 600, height: 300 });
}

function openImage() {
    chart.getImageDataURL({ width: 600, height: 300 }).then((imageDataURL) => {
        const image = new Image();
        image.src = imageDataURL;

        const tab = window.open(imageDataURL);
        if (tab) {
            tab.document.write(image.outerHTML);
            tab.document.close();
        }
    });
}
