import { getCollection } from 'astro:content';
import { getDocExamplePages } from '../../../../../utils/pages';
import { getGeneratedContents } from '../../../../../features/examples-generator/examplesGenerator';
import type { InternalFramework } from '../../../../../types/ag-grid';

interface Params {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

export async function getStaticPaths() {
    const pages = await getCollection('docs');
    const examples = await getDocExamplePages({
        pages,
    });
    return examples;
}

export async function get({ params }: { params: Params }) {
    const { internalFramework, pageName, exampleName } = params;

    const generatedContents =
        (await getGeneratedContents({
            internalFramework,
            pageName,
            exampleName,
        })) || {};
    const response = generatedContents;
    const body = JSON.stringify(response);

    return {
        body,
    };
}
