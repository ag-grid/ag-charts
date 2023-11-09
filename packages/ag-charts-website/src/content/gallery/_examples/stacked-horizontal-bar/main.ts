import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

function getTotal(datum: any) {
    return datum.ownerOccupied + datum.privateRented + datum.localAuthority + datum.housingAssociation;
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData().sort(function (a: any, b: any) {
        return getTotal(b) - getTotal(a);
    }),
    title: {
        text: 'UK Housing Stock',
    },
    footnote: {
        text: 'Source: Ministry of Housing, Communities & Local Government',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'ownerOccupied',
            yName: 'Owner occupied',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'privateRented',
            yName: 'Private rented',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'localAuthority',
            yName: 'Local authority',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'housingAssociation',
            yName: 'Housing association',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'top',
            nice: false,
        },
    ],
};

AgEnterpriseCharts.create(options);
