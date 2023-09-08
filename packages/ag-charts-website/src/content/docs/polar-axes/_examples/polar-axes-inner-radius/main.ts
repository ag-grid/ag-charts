import { AgEnterpriseCharts, AgPolarChartOptions, AgAngleCategoryAxisLabelOrientation, AgPolarAxisOptions } from 'ag-charts-enterprise';
import { getData } from './data';

function getAxesOptions(innerRadiusRatio: number): AgPolarAxisOptions[] {
    return [
        { type: 'angle-category' },
        { type: 'radius-number', innerRadiusRatio },
    ];
}

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'School Grades',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'subject',
            radiusKey: 'grade',
        },
    ],
    axes: getAxesOptions(0.25),
};

const chart = AgEnterpriseCharts.create(options);

function changeInnerRadius(innerRadiusRatio: number) {
    AgEnterpriseCharts.update(chart, {
        ...options,
        axes: getAxesOptions(innerRadiusRatio),
    });
}

function changeInnerRadius25() {
    changeInnerRadius(0.25);
}

function changeInnerRadius50() {
    changeInnerRadius(0.5);
}

function changeInnerRadius75() {
    changeInnerRadius(0.75);
}
