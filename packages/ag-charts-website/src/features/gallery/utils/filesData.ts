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

export const getPlainThumbnailFileUrl = ({ exampleName, isDev }: { exampleName: string; isDev?: boolean }) => {
    const publicPath = getPublicFileUrl({ isDev });
    const thumbnailFilePath = pathJoin(publicPath.pathname, 'gallery', 'thumbnails', `${exampleName}-plain.png`);

    return new URL(thumbnailFilePath, import.meta.url);
};

export const getFolderUrl = ({ exampleName }: { exampleName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const sourceExamplesPath = pathJoin(contentRoot.pathname, 'gallery', '_examples', exampleName);

    return new URL(sourceExamplesPath, import.meta.url);
};

export const getChartTypeName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const { chartTypes } = galleryData;

    const foundChartType = chartTypes.find(({ demos: chartDemos }) => {
        const foundExample = chartDemos.find(({ example }) => {
            return example === exampleName;
        });

        return Boolean(foundExample);
    });

    return foundChartType?.name;
};

export const getExampleName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const { chartTypes } = galleryData;
    let result;
    chartTypes.forEach(({ demos: chartDemos }) => {
        const foundExample = chartDemos.find(({ example }) => {
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
    const galleryExamples = chartTypes
        .map((chartType) => {
            const { demos } = chartType;
            return demos.map((demo, i) => {
                const { example } = demo;
                return {
                    exampleName: example,
                    page: {
                        ...demo,
                        chartType: chartType.name,
                        slug: chartType.slug,
                        docsUrl: getPageHashUrl({ chartTypeSlug: chartType.slug }),
                        icon: chartType.icon,
                        enterprise: chartType.enterprise,
                    },
                    prevDemo: i > 0 ? demos[i - 1] : demos[demos.length - 1],
                    nextDemo: demos.length > i + 1 ? demos[i + 1] : demos[0],
                };
            });
        })
        .flat();

    return galleryExamples;
};
