import type { InternalFramework } from '@ag-grid-types';
import { getGeneratedDocsContents } from '@features/docs/utils/examplesGenerator';
import { getDocsExamplePages } from '@features/docs/utils/pageData';
import { getCollection } from 'astro:content';

interface Params {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

export async function getStaticPaths() {
    const pages = await getCollection('docs');
    const examples = await getDocsExamplePages({
        pages,
    });
    return examples;
}

export async function get({ params }: { params: Params }) {
    const { internalFramework, pageName, exampleName } = params;

    const generatedContents =
        (await getGeneratedDocsContents({
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
