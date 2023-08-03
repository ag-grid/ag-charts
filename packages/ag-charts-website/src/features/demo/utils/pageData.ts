import type { DemoExamples } from '../../../types/ag-grid';
import { getGeneratedDemoContentsFileList } from './examplesGenerator';
import { getDemoExamples } from './filesData';

export function getDemoPages({ demos }: { demos: DemoExamples }) {
    const demoExamples = getDemoExamples({ demos });
    const demoExamplePages = demoExamples.map(({ exampleName, page, prevDemo, nextDemo }) => {
        return {
            params: {
                pageName: exampleName,
            },
            props: {
                page,
                prevDemo,
                nextDemo,
            },
        };
    });

    return demoExamplePages;
}

export function getDemoExamplePages({ demos }: { demos: DemoExamples }) {
    const demoExamples = getDemoExamples({ demos });
    const demoExamplePages = demoExamples.map(({ exampleName }) => {
        return {
            params: {
                exampleName,
            },
        };
    });

    return demoExamplePages;
}

export async function getDemoExampleFiles({ demos }: { demos: DemoExamples }) {
    const demoExamples = getDemoExamples({ demos });
    const exampleFilesPromises = demoExamples.map(async ({ exampleName }) => {
        const exampleFileList = await getGeneratedDemoContentsFileList({
            exampleName,
        });

        return exampleFileList.map((fileName) => {
            return {
                exampleName,
                fileName,
            };
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles.map(({ exampleName, fileName }) => {
        return {
            params: {
                exampleName,
                fileName,
            },
        };
    });
}
