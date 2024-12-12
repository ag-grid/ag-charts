import { getGalleryExampleFiles } from '@components/gallery/utils/pageData';
import { getIsDev } from '@utils/env';
import { fileNameToMimeType } from '@utils/mimeType';
import { getContentRootFileUrl } from '@utils/pages';
import { getEntry } from 'astro:content';

import { getGeneratedContents } from '../../../../components/example-generator';

interface Params {
    exampleName: string;
    fileName: string;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const exampleFiles = await getGalleryExampleFiles({
        galleryData: galleryDataEntry?.data,
    });
    return exampleFiles;
}

export async function GET({ params }: { params: Params }) {
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

    const { files = {} } =
        (await getGeneratedContents({
            type: 'gallery',
            exampleName,
        })) ?? {};
    const file = files ? files[fileName] : undefined;
    const body = file ? file : createErrorBody({ availableFiles: files });

    const response = new Response(body, {
        headers: {
            'Content-Type': fileNameToMimeType(fileName),
        },
    });
    return response;
}
