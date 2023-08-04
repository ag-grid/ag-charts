import type { GalleryData } from '../../../types/ag-grid';
import { getGeneratedGalleryContentsFileList } from './examplesGenerator';
import { getGalleryExamples } from './filesData';

export function getGalleryPages({ galleryData }: { galleryData: GalleryData }) {
    const galleryExamples = getGalleryExamples({ galleryData });
    const galleryExamplePages = galleryExamples.map(({ exampleName, page, prevExample, nextExample }) => {
        return {
            params: {
                pageName: exampleName,
            },
            props: {
                page,
                prevExample,
                nextExample,
            },
        };
    });

    return galleryExamplePages;
}

export function getGalleryExamplePages({ galleryData }: { galleryData: GalleryData }) {
    const galleryExamples = getGalleryExamples({ galleryData });
    const galleryExamplePages = galleryExamples.map(({ exampleName }) => {
        return {
            params: {
                exampleName,
            },
        };
    });

    return galleryExamplePages;
}

export async function getGalleryExampleFiles({ galleryData }: { galleryData: GalleryData }) {
    const galleryExamples = getGalleryExamples({ galleryData });
    const exampleFilesPromises = galleryExamples.map(async ({ exampleName }) => {
        const exampleFileList = await getGeneratedGalleryContentsFileList({
            exampleName,
        });

        return exampleFileList.map((fileName) => {
            return {
                exampleName,
                fileName,
            };
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles.map(({ exampleName, fileName }) => {
        return {
            params: {
                exampleName,
                fileName,
            },
        };
    });
}
