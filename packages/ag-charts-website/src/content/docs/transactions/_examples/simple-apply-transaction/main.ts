import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

interface DataItem {
    category: string;
    value: number;
}

let nextId = 1;

function createItem(): DataItem {
    return {
        category: `Item ${nextId++}`,
        value: Math.round(Math.random() * 100),
    };
}

function getInitialData(): DataItem[] {
    const items: DataItem[] = [];
    for (let i = 0; i < 20; i++) {
        items.push(createItem());
    }
    return items;
}

const data: DataItem[] = getInitialData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'value',
        },
    ],
};

const chart = AgCharts.create(options);

function addItems() {
    const newItems: DataItem[] = [];
    for (let i = 0; i < 5; i++) {
        newItems.push(createItem());
    }
    data.push(...newItems);
    chart.applyTransaction({ add: newItems });
}

function addAtIndex() {
    const newItem = createItem();
    const insertIndex = Math.min(2, data.length);
    data.splice(insertIndex, 0, newItem);
    chart.applyTransaction({ add: [newItem], addIndex: 2 });
}

function removeItem() {
    if (data.length === 0) return;
    const itemToRemove = data.pop()!;
    chart.applyTransaction({ remove: [itemToRemove] });
}

function updateItems() {
    if (data.length === 0) return;
    const itemsToUpdate = data.slice(0, Math.min(5, data.length));
    for (const item of itemsToUpdate) {
        item.value = Math.round(Math.random() * 100);
    }
    chart.applyTransaction({ update: itemsToUpdate });
}
