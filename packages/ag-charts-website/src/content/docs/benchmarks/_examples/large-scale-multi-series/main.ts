/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

(window as any).agChartsDebug = 'scene:stats';

const amountOfCurves = 500;
const amountOfDataPointsPerCurve = 10;
const maxYgeneratedValue = 100;
const generatedData = [];
const generatedSeries: AgLineSeriesOptions[] = [];

for (let k = 0; k < amountOfDataPointsPerCurve; k++) {
    let obj = { x: k };
    for (let i = 0; i < amountOfCurves; i++) {
        obj = {
            ...obj,
            ['y' + i]: Math.floor(Math.random() * maxYgeneratedValue),
        };
        generatedSeries[i] = {
            type: 'line',
            xKey: 'x',
            yKey: 'y' + i,
            marker: {
                enabled: true,
            },
        };
    }
    generatedData[k] = obj;
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: '#6806 - AG-Chart: Bad performance on 100+ series objects',
        fontSize: 18,
    },
    autoSize: true,
    data: generatedData,
    series: generatedSeries,
};
/* @ag-options-end */

const start = performance.now();
var chart = AgCharts.create(options);

(chart as any).chart.waitForUpdate().then(() => {
    console.log('Total update time: ', performance.now() - start);
});
