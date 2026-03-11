import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

interface DataItem {
    id: string;
    category: string;
    value: number;
}

let nextId = 1;

function createItem(): DataItem {
    const id = `item-${nextId}`;
    return {
        id,
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
    dataIdKey: 'id',
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
    for (let i = 0; i < 3; i++) {
        newItems.push(createItem());
    }
    data.push(...newItems);
    chart.applyTransaction({ add: newItems });
}

function removeById() {
    if (data.length === 0) return;
    const lastItem = data.pop()!;
    // Only need the ID field to remove
    chart.applyTransaction({ remove: [{ id: lastItem.id } as any] });
}

function updateById() {
    if (data.length === 0) return;
    // Create a brand-new object with the same ID
    const existing = data[0];
    const replacement: DataItem = {
        id: existing.id,
        category: existing.category,
        value: Math.round(Math.random() * 100),
    };
    data[0] = replacement;
    chart.applyTransaction({ update: [replacement] });
}
