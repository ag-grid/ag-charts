// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { random } from './randomHelpers';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const allData = [
    { location: ['Europe', 'United Kingdom', 'London'], total: undefined, gold: 27, silver: 23, bronze: 17 },
    { location: ['Europe', 'United Kingdom', 'Manchester'], total: undefined, gold: 12, silver: 8, bronze: 10 },
    { location: ['Europe', 'Germany', 'Berlin'], total: undefined, gold: 17, silver: 10, bronze: 15 },
    { location: ['Asia', 'China', 'Beijing'], total: undefined, gold: 38, silver: 32, bronze: 18 },
    { location: ['Asia', 'China', 'Shanghai'], total: undefined, gold: 20, silver: 15, bronze: 12 },
    { location: ['Asia', 'Japan', 'Tokyo'], total: undefined, gold: 27, silver: 14, bronze: 17 },
    { location: ['North America', 'United States', 'Los Angeles'], total: undefined, gold: 46, silver: 37, bronze: 38 },
    { location: ['North America', 'United States', 'New York'], total: undefined, gold: 30, silver: 28, bronze: 25 },
    { location: ['North America', 'Canada', 'Toronto'], total: undefined, gold: 8, silver: 6, bronze: 10 },
    { location: ['South America', 'Brazil', 'Rio de Janeiro'], total: undefined, gold: 7, silver: 6, bronze: 6 },
    { location: ['Africa', 'South Africa', 'Cape Town'], total: undefined, gold: 4, silver: 4, bronze: 6 },
    { location: ['Oceania', 'Australia', 'Sydney'], total: undefined, gold: 17, silver: 7, bronze: 22 },
    { location: ['Oceania', 'New Zealand', 'Auckland'], total: undefined, gold: 10, silver: 5, bronze: 8 },
];

const totalData: any = [];
for (const row of allData) {
    const totalRow = totalData.find((d: any) => d.location[0] === row.location[0]);
    if (totalRow) {
        totalRow.total += row.gold + row.silver + row.bronze;
        totalRow.count += 1;
    } else {
        totalData.push({
            location: [row.location[0]],
            total: row.gold + row.silver + row.bronze,
            count: 1,
            gold: undefined,
            silver: undefined,
            bronze: undefined,
        });
    }
}

for (const row of totalData) {
    row.total = row.total / row.count;
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: async ({ windowStart, windowEnd }) => {
            if (!Array.isArray(windowStart) || !Array.isArray(windowEnd)) {
                return totalData;
            }

            const delayTime = 2000 + Math.floor(random() * 500);
            await delay(delayTime);

            let startIndex = allData.findIndex((d) => d.location[0] === windowStart[0]);
            if (startIndex === -1) startIndex = 0;
            let endIndex = allData.findIndex((d) => d.location[0] === windowEnd[0]);
            if (endIndex === -1) endIndex = allData.length;

            const data: any = [];
            for (let index = 0; index < allData.length; index++) {
                if (endIndex - startIndex > 3 || index < startIndex || index > endIndex) {
                    const totalRow = totalData.find((d: any) => d.location[0] === allData[index].location[0]);
                    const dataRow = data.find((d: any) => d.location[0] === allData[index].location[0]);
                    if (!dataRow) {
                        data.push(totalRow);
                    }
                } else {
                    data.push(allData[index]);
                }
            }

            return data;
        },
    },
    navigator: { enabled: true },
    zoom: { enabled: true },
    axes: {
        x: {
            type: 'grouped-category',
        },
    },
    series: [
        { type: 'bar', stacked: true, xKey: 'location', yKey: 'total' },
        { type: 'bar', stacked: true, xKey: 'location', yKey: 'gold' },
        { type: 'bar', stacked: true, xKey: 'location', yKey: 'silver' },
        { type: 'bar', stacked: true, xKey: 'location', yKey: 'bronze' },
    ],
};

AgCharts.create(options);
