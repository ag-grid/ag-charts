import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Range Column',
    },
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

const chart = AgCharts.create(options);

let updating = false;
let refreshIntervalId: string | number | NodeJS.Timeout | undefined;
function startUpdates() {
    if (updating) {
        return;
    }

    updating = true;
    update();
    refreshIntervalId = setInterval(update, 1500);
}

function stopUpdates() {
    if (!updating) {
        return;
    }

    updating = false;
    clearInterval(refreshIntervalId);
}

function update() {
    options.data = getUpdatedData();
    chart.update(options);
}

function getUpdatedData() {
    const optionsData = options.data ?? [];

    // Update
    console.log('updating');
    const randomNumber = Math.random();
    const scaleBy = randomNumber < 0.5 ? randomNumber + 1 : randomNumber;
    const updatedData = optionsData.map((d: any) => ({
        ...d,
        low: d.low * scaleBy,
        high: d.high * scaleBy,
    }));

    // Add
    console.log('adding');
    const datum = data[Math.floor(Math.random() * updatedData.length)];
    const newDatum = {
        ...datum,
        date: `Nov ${Math.floor(Math.random() * 100)}`,
    };
    const usedDates = new Set(updatedData.map(({ date }) => date));
    if (!usedDates.has(newDatum.date)) {
        const addIndex = Math.floor(Math.random() * updatedData.length);
        updatedData.splice(addIndex, 0, newDatum);
    }

    // Remove
    const removeIndex = Math.floor(updatedData.length * Math.random());
    updatedData.splice(removeIndex, 1);

    // Shuffle
    console.log('shuffling');
    let currentIndex = updatedData.length;
    let randomIndex;

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [updatedData[currentIndex], updatedData[randomIndex]] = [updatedData[randomIndex], updatedData[currentIndex]];
    }
    return (options.data = updatedData);
}
