import type { GalleryData } from '@ag-grid-types';
import { getGeneratedGalleryContentsFileList } from './examplesGenerator';
import { getGalleryExamples } from './filesData';

export function getGalleryPages({ galleryData }: { galleryData: GalleryData }) {
    const galleryExamples = getGalleryExamples({ galleryData });
    const galleryExamplePages = galleryExamples.map(
        ({ exampleName, page, prevExample, nextExampleOne, nextExampleTwo }) => {
            return {
                params: {
                    pageName: exampleName,
                },
                props: {
                    page,
                    prevExample,
                    nextExampleOne,
                    nextExampleTwo,
                },
            };
        }
    );

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
