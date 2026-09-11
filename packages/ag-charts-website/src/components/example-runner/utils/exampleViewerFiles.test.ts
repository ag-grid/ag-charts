import type { GeneratedContents } from '@components/example-generator/types';
import { describe, expect, it } from 'vitest';

import { getExampleViewerFiles } from './exampleViewerFiles';

const contents = {
    files: {
        'main.ts': [
            'const options = {};',
            '/** DARK MODE START **/',
            'options.theme = "ag-default-dark";',
            '/** DARK MODE END **/',
            '',
        ].join('\n'),
        'index.html': '<div id="myChart"></div>\n',
        'styles.css': '.red { color: red; }\n',
        'ag-example-styles.css': 'body { margin: 0; }\n',
        'head.html': '<meta name="example" />\n',
    },
    entryFileName: 'main.ts',
    mainFileName: 'main.ts',
} as unknown as GeneratedContents;

describe('getExampleViewerFiles', () => {
    it('drops the files the code viewer hides and strips the generator harness from the main file', () => {
        const { files, mainFileName } = getExampleViewerFiles(contents, 'vanilla');

        expect(mainFileName).toBe('main.ts');
        expect(Object.keys(files)).toEqual(['main.ts', 'styles.css']);
        expect(files['main.ts']).not.toContain('DARK MODE');
        expect(files['main.ts']).toContain('const options = {};');
    });

    it('leaves out index.html for every framework, as the viewer shows the rendered page instead', () => {
        for (const internalFramework of ['vanilla', 'typescript', 'reactFunctionalTs', 'angular', 'vue3'] as const) {
            expect(
                Object.keys(getExampleViewerFiles(contents, internalFramework).files),
                internalFramework
            ).not.toContain('index.html');
        }
    });

    it('falls back to the entry file when there is no main file', () => {
        const { mainFileName } = getExampleViewerFiles(
            { ...contents, mainFileName: undefined } as unknown as GeneratedContents,
            'typescript'
        );

        expect(mainFileName).toBe('main.ts');
    });

    it('leaves the generated contents untouched', () => {
        const before = JSON.stringify(contents);
        getExampleViewerFiles(contents, 'vanilla');

        expect(JSON.stringify(contents)).toBe(before);
    });
});
