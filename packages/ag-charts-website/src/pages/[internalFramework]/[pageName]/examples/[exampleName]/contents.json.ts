import type { InternalFramework } from '@ag-grid-types';
import { getDocsExamplePages } from '@features/docs/utils/pageData';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { getGeneratedContents } from '../../../../../features/example-generator';
import { format } from '../../../../../utils/format';

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

    const files: Record<string, string> = {};
    for (const [fileName, fileText] of Object.entries(generatedContents?.files ?? {})) {
        try {
            files[fileName] = await format(fileName, fileText);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(`Unable to prettier format ${fileName} for [${internalFramework}/${pageName}/${exampleName}]`);
            files[fileName] = fileText;
        }
    }

    return new Response(JSON.stringify({ ...generatedContents, files }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
