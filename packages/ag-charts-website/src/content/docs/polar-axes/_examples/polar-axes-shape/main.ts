import { AgEnterpriseCharts, AgPolarChartOptions, AgAngleCategoryAxisLabelOrientation, AgPolarAxisOptions } from 'ag-charts-enterprise';
import { getData } from './data';

function getAxesOptions(shape: 'polygon' | 'circle'): AgPolarAxisOptions[] {
    return [
        { type: 'angle-category', shape },
        { type: 'radius-number', shape },
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
    axes: getAxesOptions('polygon'),
};

const chart = AgEnterpriseCharts.create(options);

function changeShape(orientation: 'polygon' | 'circle') {
    AgEnterpriseCharts.update(chart, {
        ...options,
        axes: getAxesOptions(orientation),
    });
}

function changeShapePolygon() {
    changeShape('polygon');
}

function changeShapeCircle() {
    changeShape('circle');
}
