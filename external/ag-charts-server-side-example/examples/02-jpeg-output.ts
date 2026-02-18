import * as fs from 'fs';
import * as path from 'path';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartsServerSide } from 'ag-charts-server-side';

ModuleRegistry.registerModules([AllCommunityModule]);

const buffer = await AgChartsServerSide.render({
    options: {
        data: [
            { category: 'Q1', value: 10 },
            { category: 'Q2', value: 25 },
            { category: 'Q3', value: 15 },
            { category: 'Q4', value: 30 },
        ],
        series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
    },
    width: 400,
    height: 300,
    format: 'jpeg',
    quality: 85,
    pixelRatio: 2,
});

const outputPath = path.join(import.meta.dirname, '..', 'output', 'chart.jpg');
fs.writeFileSync(outputPath, buffer);
console.log(`Wrote ${buffer.length} bytes to ${outputPath} (800x600 actual pixels)`);
