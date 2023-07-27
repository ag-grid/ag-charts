import type { DemoExamples } from '../../../types/ag-grid';
import { getContentRootFileUrl } from '../../../utils/pages';
import { pathJoin } from '../../../utils/pathJoin';

export const getFolderUrl = ({ exampleName }: { exampleName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const sourceExamplesPath = pathJoin(contentRoot.pathname, 'demo', '_examples', exampleName);

    return new URL(sourceExamplesPath, import.meta.url);
};

export const getChartTypeName = ({ demos, exampleName }: { demos: DemoExamples; exampleName: string }) => {
    const { chartTypes } = demos;

    const foundChartType = chartTypes.find(({ demos: chartDemos }) => {
        const foundExample = chartDemos.find(({ example }) => {
            return example === exampleName;
        });

        return Boolean(foundExample);
    });

    return foundChartType?.name;
};

export const getExampleName = ({ demos, exampleName }: { demos: DemoExamples; exampleName: string }) => {
    const { chartTypes } = demos;
    let result;
    chartTypes.forEach(({ demos: chartDemos }) => {
        const foundExample = chartDemos.find(({ example }) => {
            return example === exampleName;
        });

        if (foundExample) {
            result = foundExample.name;
        }
    });

    return result;
};

export const getChartExampleTitle = ({ demos, exampleName }: { demos: DemoExamples; exampleName: string }) => {
    const chartTypeName = getChartTypeName({
        demos,
        exampleName,
    });
    const pageName = `${chartTypeName} Chart`;
    const displayExampleName = getExampleName({
        demos,
        exampleName,
    });

    return `${pageName} - ${displayExampleName}`;
};

export const getDemoExamples = ({ demos }: { demos: DemoExamples }) => {
    const { chartTypes } = demos;
    const demoExamples = chartTypes
        .map(({ demos }) => {
            return demos.map(({ example }) => {
                return {
                    exampleName: example,
                };
            });
        })
        .flat();

    return demoExamples;
};
