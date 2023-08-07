import { readFileSync } from 'fs';
import type { GalleryData } from '../../../types/ag-grid';
import { getContentRootFileUrl, getPublicFileUrl } from '../../../utils/pages';
import { pathJoin } from '../../../utils/pathJoin';
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

export const getChartTypeName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const { chartTypes } = galleryData;

    const foundChartType = chartTypes.find(({ examples }) => {
        const foundExample = examples.find(({ example }) => {
            return example === exampleName;
        });

        return Boolean(foundExample);
    });

    return foundChartType?.name;
};

export const getExampleName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const { chartTypes } = galleryData;
    let result;
    chartTypes.forEach(({ examples }) => {
        const foundExample = examples.find(({ example }) => {
            return example === exampleName;
        });

        if (foundExample) {
            result = foundExample.name;
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
    const chartTypeName = getChartTypeName({
        galleryData,
        exampleName,
    });
    const pageName = `${chartTypeName} Chart`;
    const displayExampleName = getExampleName({
        galleryData,
        exampleName,
    });

    return `${pageName} - ${displayExampleName}`;
};

export const getGalleryExamples = ({ galleryData }: { galleryData: GalleryData }) => {
    const { chartTypes } = galleryData;

    const allExamples = chartTypes.map((chartType) => chartType.examples).flat();

    const galleryExamples = chartTypes
        .map((chartType) => {
            const { examples } = chartType;
            return examples.map((example) => {
                const exampleIndex = allExamples.findIndex((item) => item.name === example.name);

                return {
                    exampleName: example.name,
                    page: {
                        ...example,
                        chartTypeTitle: chartType.title,
                        chartTypeName: chartType.name,
                        docsUrl: getPageHashUrl({ chartTypeName: chartType.name }),
                        icon: chartType.icon,
                        enterprise: chartType.enterprise,
                    },
                    prevExample: exampleIndex > 0 ? allExamples[exampleIndex - 1] : allExamples[allExamples.length - 1],
                    nextExample: allExamples.length > exampleIndex + 1 ? allExamples[exampleIndex + 1] : allExamples[0],
                };
            });
        })
        .flat();

    return galleryExamples;
};
