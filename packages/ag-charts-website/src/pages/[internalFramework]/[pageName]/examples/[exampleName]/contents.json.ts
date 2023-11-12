import type { InternalFramework } from '@ag-grid-types';
import { getGeneratedDocsContents } from '@features/docs/utils/examplesGenerator';
import { getDocsExamplePages } from '@features/docs/utils/pageData';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { format } from '../../../../../utils/format';

export async function getStaticPaths() {
    const pages = await getCollection('docs');
    const examples = await getDocsExamplePages({
        pages,
    });
    return examples;
}

export async function get(context: APIContext) {
    const { internalFramework, pageName, exampleName } = context.params;

    const generatedContents = await getGeneratedDocsContents({
        internalFramework: internalFramework as InternalFramework,
        pageName: pageName!,
        exampleName: exampleName!,
    });

    const files: Record<string, string> = {};
    for (const [fileName, fileText] of Object.entries(generatedContents?.files ?? {})) {
        files[fileName] = await format(fileName, fileText);
    }

    return new Response(JSON.stringify({ ...generatedContents, files }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
