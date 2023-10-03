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

export function getGalleryExampleThemePages({ galleryData }: { galleryData: GalleryData }) {
    const galleryExamples = getGalleryExamples({ galleryData });
    const themes = [
        'ag-default',
        'ag-material',
        'ag-pastel',
        'ag-solar',
        'ag-vivid',
        'ag-default-dark',
        'ag-material-dark',
        'ag-pastel-dark',
        'ag-solar-dark',
        'ag-vivid-dark',
        'deordered',
        'mini-hue',
        'enter',
        'enterprise-001',
        'enterprise-002',
        'enterprise-003',
        'excel',
    ];
    const galleryExamplePages = galleryExamples.flatMap(({ exampleName }) => {
        return themes.map((theme) => {
            return {
                params: {
                    exampleName,
                    theme,
                },
            };
        });
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
