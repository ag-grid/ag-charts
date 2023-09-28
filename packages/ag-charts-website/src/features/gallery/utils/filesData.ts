import type { GalleryData } from '@ag-grid-types';
import { getContentRootFileUrl, getPublicFileUrl } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import { readFileSync } from 'fs';

import { getPageHashUrl } from './urlPaths';

export const getGalleryData = ({ isDev }: { isDev?: boolean } = {}): GalleryData => {
    const contentPath = getContentRootFileUrl({ isDev });
    const galleryDataFilePath = pathJoin(contentPath, 'gallery', 'data.json');
    const galleryDataFilePathUrl = new URL(galleryDataFilePath, import.meta.url);

    const galleryDataFile = readFileSync(galleryDataFilePathUrl).toString();
    const galleryData = JSON.parse(galleryDataFile);

    return galleryData;
};

export const getPlainThumbnailFolderUrl = ({ isDev }: { isDev?: boolean }) => {
    const publicPath = getPublicFileUrl({ isDev });
    const thumbnailFolderPath = pathJoin(publicPath.pathname, 'gallery', 'thumbnails');

    return new URL(thumbnailFolderPath, import.meta.url);
};

export const getPlainThumbnailFileUrl = ({ exampleName, isDev }: { exampleName: string; isDev?: boolean }) => {
    const folderPath = getPlainThumbnailFolderUrl({ isDev });
    const thumbnailFilePath = pathJoin(folderPath.pathname, `${exampleName}-plain.png`);

    return new URL(thumbnailFilePath, import.meta.url);
};

export const getFolderUrl = ({ exampleName }: { exampleName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const sourceExamplesPath = pathJoin(contentRoot.pathname, 'gallery', '_examples', exampleName);

    return new URL(sourceExamplesPath, import.meta.url);
};

export const getSeriesTypeName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const { series } = galleryData;

    const foundSeries = series.find(({ examples }) => {
        const foundExample = examples.find(({ name }) => {
            return name === exampleName;
        });

        return Boolean(foundExample);
    });

    return foundSeries?.title;
};

export const getExampleName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const { series } = galleryData;
    let result;
    series.forEach(({ examples }) => {
        const foundExample = examples.find(({ name }) => {
            return name === exampleName;
        });

        if (foundExample) {
            result = foundExample.title;
        }
    });

    return result;
};

export const getChartExampleTitle = ({
    galleryData,
    exampleName,
}: {
    galleryData: GalleryData;
    exampleName: string;
}) => {
    const chartSeriesName = getSeriesTypeName({
        galleryData,
        exampleName,
    });
    const pageName = `${chartSeriesName} Chart`;
    const displayExampleName = getExampleName({
        galleryData,
        exampleName,
    });

    return `${pageName} - ${displayExampleName}`;
};

export const getGalleryExamples = ({ galleryData }: { galleryData: GalleryData }) => {
    const { series } = galleryData;

    const allExamples = series.map((series) => series.examples).flat();

    const galleryExamples = series
        .map((series) => {
            const { examples } = series;
            return examples.map((example) => {
                const exampleIndex = allExamples.findIndex((item) => item.name === example.name);

                return {
                    exampleName: example.name,
                    page: {
                        ...example,
                        seriesTitle: series.title,
                        chartSeriesName: series.name,
                        docsUrl: getPageHashUrl({ chartSeriesName: series.name }),
                        icon: series.icon,
                        enterprise: series.enterprise,
                    },
                    prevExample: exampleIndex > 0 ? allExamples[exampleIndex - 1] : allExamples[allExamples.length - 1],
                    nextExampleOne:
                        allExamples.length > exampleIndex + 1 ? allExamples[exampleIndex + 1] : allExamples[0],
                    nextExampleTwo:
                        allExamples.length > exampleIndex + 2 ? allExamples[exampleIndex + 2] : allExamples[1],
                };
            });
        })
        .flat();

    return galleryExamples;
};
