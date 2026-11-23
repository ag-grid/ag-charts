import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { getGeneratedContents } from './examplesGenerator';
import type { InternalFramework } from './types';

describe('getGeneratedContents for an example tagged @ag-skip-fws', () => {
    let root: string;
    let folderPath: string;

    beforeAll(async () => {
        root = await fs.mkdtemp(path.join(os.tmpdir(), 'skip-fws-'));
        folderPath = path.join(root, 'page', '_examples', 'example');
        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(
            path.join(folderPath, 'main.ts'),
            `// @ag-skip-fws
import { AgCharts } from 'ag-charts-community';

class Unsupported {}

const options = { container: document.getElementById('myChart'), data: [new Unsupported()] };

AgCharts.create(options);
`
        );
        await fs.writeFile(path.join(folderPath, 'index.html'), `<div id="myChart"></div>`);
    });

    afterAll(async () => {
        await fs.rm(root, { recursive: true, force: true });
    });

    const generate = async (internalFramework: InternalFramework) => {
        const contents = await getGeneratedContents({ internalFramework, folderPath, ignoreDarkMode: true });
        return Object.values(contents!.generatedFiles).join('\n');
    };

    // The placeholder's `container` is not a property of the inferred type of its options, so `strict` needs the type.
    test.each([
        ['typescript', 'const options: AgChartOptions = {'],
        ['reactFunctionalTs', 'useState<AgChartOptions>('],
        ['angular', 'public options: AgChartOptions;'],
        ['vue3', 'ref<AgChartOptions>('],
    ] as const)('%s variant is the placeholder, with its options typed as AgChartOptions', async (framework, typed) => {
        const output = await generate(framework);

        expect(output).toContain('Frameworks not supported');
        expect(output).not.toContain('Unsupported');
        expect(output).toContain(typed);
        expect(output.match(/import[^;]*\bAgChartOptions\b[^;]*from/g)).toHaveLength(1);
    });

    test('the vanilla variant is the example itself', async () => {
        const output = await generate('vanilla');

        expect(output).toContain('Unsupported');
        expect(output).not.toContain('Frameworks not supported');
    });
});
