import { getCollection } from 'astro:content';
import { getDocExampleFiles } from '../../../../../utils/pages';
import { getIsDev } from '../../../../../utils/env';
import { getContentRootFileUrl } from '../../../../../features/examples-generator/utils/fileUtils';
import { getGeneratedContents } from '../../../../../features/examples-generator/examplesGenerator';
import type { InternalFramework } from '../../../../../types/ag-grid';

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

    const { files } =
        (await getGeneratedContents({
            internalFramework,
            pageName,
            exampleName,
        })) || {};
    const file = files && files[fileName];
    const body = file ? file : createErrorBody({ availableFiles: files });

    return {
        body,
    };
}
