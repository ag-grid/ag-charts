import type { GalleryData } from '@ag-grid-types';
import { SKIP_GALLERY_IMAGE_GENERATION } from '@constants';

import type { ThemeName } from '../../../stores/themeStore';
import { getGeneratedContentsFileList } from '../../example-generator';
import { GALLERY_INTERNAL_FRAMEWORK } from '../constants';
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
    if (SKIP_GALLERY_IMAGE_GENERATION) {
        return [];
    }

    const galleryExamples = getGalleryExamples({ galleryData });
    const themes: ThemeName[] = [
        'ag-default',
        'ag-default-dark',
        'ag-sheets',
        'ag-sheets-dark',
        'ag-polychroma',
        'ag-polychroma-dark',
        'ag-vivid',
        'ag-vivid-dark',
        'ag-material',
        'ag-material-dark',
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
        const exampleFileList = await getGeneratedContentsFileList({
            type: 'gallery',
            framework: GALLERY_INTERNAL_FRAMEWORK,
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
