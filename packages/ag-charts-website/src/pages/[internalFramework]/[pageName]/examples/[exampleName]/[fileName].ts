import { getCollection } from 'astro:content';
import { getContentRootFileUrl } from '@utils/pages';
import { getIsDev } from '@utils/env';
import { getGeneratedDocsContents } from '@features/docs/utils/examplesGenerator';
import type { InternalFramework } from '@ag-grid-types';
import { getDocExampleFiles } from '@features/docs/utils/pageData';
import { fileNameToMimeType } from '@utils/fileNameToMimeType';

interface Params {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
    fileName: string;
}

export async function getStaticPaths() {
    const pages = await getCollection('docs');
    const exampleFiles = await getDocExampleFiles({
        pages,
    });
    return exampleFiles;
}

export async function get({ params }: { params: Params }) {
    const { internalFramework, pageName, exampleName, fileName } = params;

    const contentRoot = getContentRootFileUrl();
    const createErrorBody = ({ availableFiles }: any) => {
        const error = getIsDev()
            ? {
                  error: 'File not found',
                  contentPath: contentRoot.pathname,
                  availableFiles: Object.keys(availableFiles),
              }
            : {
                  error: 'File not found',
              };

        return JSON.stringify(error);
    };

    const { files = {} } =
        (await getGeneratedDocsContents({
            internalFramework,
            pageName,
            exampleName,
        })) || {};
    const file = files && files[fileName];
    const body = file ? file : createErrorBody({ availableFiles: files });

    const response = new Response(body, {
        headers: {
            'Content-Type': fileNameToMimeType(fileName),
        },
    });
    return response;
}
