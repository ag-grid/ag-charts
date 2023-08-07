import { getEntry } from 'astro:content';
import { getContentRootFileUrl } from '@utils/pages';
import { getIsDev } from '@utils/env';
import { getGalleryExampleFiles } from '@features/gallery/utils/pageData';
import { getGeneratedGalleryContents } from '@features/gallery/utils/examplesGenerator';

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

    const { files = {} } =
        (await getGeneratedGalleryContents({
            exampleName,
        })) || {};
    const file = files && files[fileName];
    const body = file ? file : createErrorBody({ availableFiles: files });

    return {
        body,
    };
}
