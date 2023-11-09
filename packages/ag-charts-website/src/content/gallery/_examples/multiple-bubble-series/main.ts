import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getCoffeeIndustryData, getFoodIndustryData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'The Food & Coffee Industries',
    },
    subtitle: {
        text: 'Growth Rate Versus Number of Franchises',
    },
    footnote: {
        text: 'Comparative Analysis of UK Food and Coffee Franchises',
    },
    series: [
        {
            type: 'bubble',
            data: getFoodIndustryData(),
            xKey: 'numberOfFranchises',
            xName: 'Number of Franchises',
            yKey: 'growthRate',
            yName: 'Food Industry Growth Rate',
            sizeKey: 'licenseFee',
            sizeName: 'Lisense Fee',
            labelKey: 'franchiseName',
            labelName: 'Franchise',
            marker: {
                maxSize: 90,
                formatter: ({ datum }) => {
                    const { growthRate } = datum;
                    return {
                        fillOpacity: growthRate / 18,
                    };
                },
            },
            label: {},
        },
        {
            type: 'bubble',
            data: getCoffeeIndustryData(),
            xKey: 'numberOfFranchises',
            xName: 'Number of Franchises',
            yKey: 'growthRate',
            yName: 'Coffee Industry Growth Rate',
            sizeKey: 'licenseFee',
            sizeName: 'Lisense Fee',
            labelKey: 'franchiseName',
            labelName: 'Franchise',
            marker: {
                maxSize: 90,
                formatter: ({ datum }) => {
                    const { growthRate } = datum;
                    return {
                        fillOpacity: growthRate / 24,
                    };
                },
            },
            label: {},
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            min: -11000,
            max: 50000,
            title: {
                text: 'Number Of Franchises →',
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    strokeWidth: 2,
                    strokeOpacity: 0.5,
                    label: {
                        text: '^',
                        position: 'top',
                        fontSize: 14,
                        padding: 0,
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Franchise Growth Rate',
            },
            nice: false,
        },
    ],
};

AgEnterpriseCharts.create(options);
