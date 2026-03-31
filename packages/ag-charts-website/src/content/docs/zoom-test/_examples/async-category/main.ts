// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const totalData = [
    {
        quarter: "Q1'18",
        total: 202,
        iphone: undefined,
        mac: undefined,
        ipad: undefined,
        wearables: undefined,
        services: undefined,
    },
    {
        quarter: "Q2'18",
        total: 200,
        iphone: undefined,
        mac: undefined,
        ipad: undefined,
        wearables: undefined,
        services: undefined,
    },
    {
        quarter: "Q3'18",
        total: 200,
        iphone: undefined,
        mac: undefined,
        ipad: undefined,
        wearables: undefined,
        services: undefined,
    },
    {
        quarter: "Q4'18",
        total: 206,
        iphone: undefined,
        mac: undefined,
        ipad: undefined,
        wearables: undefined,
        services: undefined,
    },
];

const allData = [
    { quarter: "Q1'18", total: undefined, iphone: 140, mac: 16, ipad: 14, wearables: 12, services: 20 },
    { quarter: "Q2'18", total: undefined, iphone: 124, mac: 20, ipad: 14, wearables: 12, services: 30 },
    { quarter: "Q3'18", total: undefined, iphone: 112, mac: 20, ipad: 18, wearables: 14, services: 36 },
    { quarter: "Q4'18", total: undefined, iphone: 118, mac: 24, ipad: 14, wearables: 14, services: 36 },
];

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: async ({ windowStart, windowEnd }) => {
            if (typeof windowStart !== 'string' || typeof windowEnd !== 'string') {
                return totalData;
            }

            const delayTime = 2000 + Math.floor(Math.random() * 500);
            await delay(delayTime);

            let startIndex = allData.findIndex((d) => d.quarter === windowStart);
            if (startIndex === -1) startIndex = 0;
            let endIndex = allData.findIndex((d) => d.quarter === windowEnd);
            if (endIndex === -1) endIndex = allData.length;

            const data = [];
            for (let index = 0; index < allData.length; index++) {
                if (endIndex - startIndex > 1 || index < startIndex || index > endIndex) {
                    data.push(totalData[index]);
                } else {
                    data.push(allData[index]);
                }
            }

            return data;
        },
    },
    navigator: { enabled: true },
    zoom: { enabled: true },
    series: [
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'total' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'iphone' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'mac' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'ipad' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'wearables' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'services' },
    ],
};

AgCharts.create(options);
