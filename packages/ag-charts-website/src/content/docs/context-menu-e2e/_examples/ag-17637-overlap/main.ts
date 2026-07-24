import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

// The x-axis is positioned with `crossAt` and the y-axis carries a crossline so that both overlap the
// series area near the 'Feb' node. Right-clicking that node must offer every region it intersects.
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Crossline / Axis / Series-Node Overlap' },
    data: [
        { category: 'Jan', value: -8 },
        { category: 'Feb', value: 12 },
        { category: 'Mar', value: -6 },
        { category: 'Apr', value: 15 },
        { category: 'May', value: -9 },
        { category: 'Jun', value: 18 },
        { category: 'Jul', value: -11 },
        { category: 'Aug', value: 14 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'category',
            crossAt: { value: 0 },
            crossLines: [{ type: 'line', value: 'May', stroke: 'blue', strokeWidth: 2 }],
        },
        y: {
            type: 'number',
            crossLines: [{ type: 'line', value: 8, stroke: 'red', strokeWidth: 2 }],
        },
    },
    contextMenu: {
        // Labels end in a comma so the menu's textContent concatenates to a stable, assertable string.
        items: [
            { showOn: 'always', label: 'always,', action: () => {} },
            { showOn: 'axis', label: 'axis,', action: () => {} },
            { showOn: 'crossline', label: 'crossline,', action: () => {} },
            { showOn: 'series-area', label: 'series-area,', action: () => {} },
            { showOn: 'series-node', label: 'series-node,', action: () => {} },
        ],
    },
};

AgCharts.create(options);
