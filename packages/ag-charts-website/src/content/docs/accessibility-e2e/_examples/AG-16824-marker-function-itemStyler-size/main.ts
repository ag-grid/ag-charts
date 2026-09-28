import { AgCharts, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import type {
    AgActiveChangeEvent,
    AgCartesianChartOptions,
    AgMarkerShapeFnParams,
    AgPath,
    AgScatterSeriesItemStylerParams,
} from 'ag-charts-community';

ModuleRegistry.registerModules([AllCommunityModule]);

function updatePath(pathData: string, path: AgPath, scale: number, x: number, y: number) {
    path.clear();

    let x0 = 0;
    let y0 = 0;
    for (const { 1: command, 2: coordinateString } of pathData.matchAll(/([a-z])([^a-z]*)/gi)) {
        const coordinates = Array.from(coordinateString.matchAll(/([\d.]+)/g), (m) => (parseFloat(m[0]) - 0.5) * scale);

        const relative = command === command.toLowerCase();
        const dx = relative ? x0 : 0;
        const dy = relative ? y0 : 0;

        switch (command.toLowerCase()) {
            case 'm':
                x0 = x + coordinates[0] + dx;
                y0 = y + coordinates[1] + dy;
                path.moveTo(x0, y0);
                break;
            case 'l':
                x0 = x + coordinates[0] + dx;
                y0 = y + coordinates[1] + dy;
                path.lineTo(x0, y0);
                break;
            case 'v':
                y0 = y + coordinates[0] + dy;
                path.lineTo(x0, y0);
                break;
            case 'h':
                x0 = x + coordinates[0] + dx;
                path.lineTo(x0, y0);
                break;
            case 'z':
                path.closePath();
                break;
        }
    }
}

function agChartsLogo({ path, size, x, y }: AgMarkerShapeFnParams) {
    const pathData = [
        'M0.480769 0.846154V0.692308H0.211538L0.134615 0.769423V0.846154H0.480769Z',
        'M0 0.615385V0.769L0.134615 0.769231L0.288308 0.615385L0 0.614481V0.615385Z',
        'M1 0.384615V0.230769H0.673077L0.596154 0.307692L0.519231 0.384615H1Z',
        'M0.596154 0.307692L0.673077 0.230769V0.153846H0.0961538V0.307692H0.596154Z',
        'M0.711538 0.615385V0.461635H0.442308L0.383074 0.520772L0.365385 0.538462H0.365356L0.288308 0.615385H0.711538Z',
        'M0.192308 0.384615V0.538462H0.365356L0.383074 0.520772L0.519231 0.384615H0.192308Z',
    ].join('');
    updatePath(pathData, path, size, x, y);
}

type DataType = { id: number; height: number; weight: number; age: number };

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: [
        { id: 0, height: 174, weight: 65.6, age: 21 },
        { id: 1, height: 175.3, weight: 71.8, age: 23 },
        { id: 2, height: 193.5, weight: 80.7, age: 28 },
        { id: 3, height: 186.5, weight: 72.6, age: 23 },
        { id: 4, height: 187.2, weight: 78.8, age: 22 },
        { id: 5, height: 181.5, weight: 74.8, age: 21 },
        { id: 6, height: 184, weight: 86.4, age: 26 },
        { id: 7, height: 184.5, weight: 78.4, age: 27 },
    ],
    series: [
        {
            type: 'scatter',
            title: 'Male',
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            shape: agChartsLogo,
            itemStyler: (params: AgScatterSeriesItemStylerParams<DataType, unknown>) => {
                if (params.datum.id === 2) {
                    return { size: 30 };
                }
            },
        },
    ],
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<DataType, unknown>) => {
            events.push(ev);
        },
    },
};

const chart = AgCharts.create(options);
let events: AgActiveChangeEvent<DataType, unknown>[] = [];

function popEvents(): AgActiveChangeEvent[] {
    const result = events;
    events = [];
    return result;
}

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
