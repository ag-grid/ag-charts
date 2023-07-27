import { getEntry } from 'astro:content';
import { getContentRootFileUrl } from '../../../../utils/pages';
import { getIsDev } from '../../../../utils/env';
import { getDemoExampleFiles } from '../../../../features/demo/utils/pageData';
import { getGeneratedDemoContents } from '../../../../features/demo/utils/examplesGenerator';

interface Params {
    exampleName: string;
    fileName: string;
}

export async function getStaticPaths() {
    const demosEntry = await getEntry('demo', 'demos');
    const exampleFiles = await getDemoExampleFiles({
        demos: demosEntry.data,
    });
    return exampleFiles;
}

export async function get({ params }: { params: Params }) {
    const { exampleName, fileName } = params;

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
        (await getGeneratedDemoContents({
            exampleName,
        })) || {};
    const file = files && files[fileName];
    const body = file ? file : createErrorBody({ availableFiles: files });

    return {
        body,
    };
}
