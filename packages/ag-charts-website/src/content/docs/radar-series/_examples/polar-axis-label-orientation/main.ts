import { AgEnterpriseCharts, AgPolarChartOptions, AgAngleCategoryAxisLabelOrientation, AgPolarAxisOptions } from 'ag-charts-enterprise';
import { getData } from './data';

function getAxesOptions(orientation: AgAngleCategoryAxisLabelOrientation): AgPolarAxisOptions[] {
    return [
        {
            type: 'angle-category',
            label: { orientation },
        },
        {
            type: 'radius-number',
        },
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
            type: 'radar-line',
            angleKey: 'subject',
            radiusKey: 'grade',
        },
    ],
    axes: getAxesOptions('parallel'),
};

const chart = AgEnterpriseCharts.create(options);

function changeOrientation(orientation: AgAngleCategoryAxisLabelOrientation) {
    AgEnterpriseCharts.update(chart, {
        ...options,
        axes: getAxesOptions(orientation),
    });
}

function changeOrientationFixed() {
    changeOrientation('fixed');
}

function changeOrientationParallel() {
    changeOrientation('parallel');
}

function changeOrientationPerpendicular() {
    changeOrientation('perpendicular');
}
