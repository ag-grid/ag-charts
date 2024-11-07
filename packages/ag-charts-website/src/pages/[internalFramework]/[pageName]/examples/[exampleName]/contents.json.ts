import type { InternalFramework } from '@ag-grid-types';
import { getDocsExamplePages } from '@components/docs/utils/pageData';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { getGeneratedContents } from '../../../../../components/example-generator';

export async function getStaticPaths() {
    const pages = await getCollection('docs');
    const examples = await getDocsExamplePages({
        pages,
    });
    return examples;
}

export async function GET(context: APIContext) {
    const { internalFramework, pageName, exampleName } = context.params;

    const generatedContents = await getGeneratedContents({
        type: 'docs',
        framework: internalFramework as InternalFramework,
        pageName: pageName!,
        exampleName: exampleName!,
    });

    return new Response(JSON.stringify(generatedContents), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
