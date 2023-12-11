import type { GalleryData, GalleryExample } from '@ag-grid-types';
import { getContentRootFileUrl, getExampleRootFileUrl, getPublicFileUrl } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import { readFileSync } from 'fs';
import GithubSlugger from 'github-slugger';

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

export const getSeriesTypeName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const series = galleryData.series.flat();

    const foundSeries = series.find(({ examples }) => {
        const foundExample = examples.find(({ name }) => {
            return name === exampleName;
        });

        return Boolean(foundExample);
    });

    return foundSeries?.title;
};

export const getSeriesTypeSlug = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const slugger = new GithubSlugger();
    const name = getSeriesTypeName({ galleryData, exampleName });
    const slug = name ? slugger.slug(name) : undefined;
    return slug;
};

export const getExample = ({
    galleryData,
    exampleName,
}: {
    galleryData: GalleryData;
    exampleName: string;
}): undefined | GalleryExample => {
    const series = galleryData.series.flat();
    let result;
    series.flat().forEach(({ examples }) => {
        const foundExample = examples.find(({ name }) => {
            return name === exampleName;
        });

        if (foundExample) {
            result = foundExample;
        }
    });

    return result;
};

export const getExampleName = ({ galleryData, exampleName }: { galleryData: GalleryData; exampleName: string }) => {
    const example = getExample({
        galleryData,
        exampleName,
    });

    return example?.name;
};

export const getChartExampleTitle = ({
    galleryData,
    exampleName,
}: {
    galleryData: GalleryData;
    exampleName: string;
}) => {
    const example = getExample({
        galleryData,
        exampleName,
    });

    return example?.title;
};

export const getGalleryExamples = ({ galleryData }: { galleryData: GalleryData }) => {
    const series = galleryData.series.flat();

    const allExamples = series.flatMap((series) => series.examples);

    const galleryExamples = series.flatMap((series) => {
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
                nextExampleOne: allExamples.length > exampleIndex + 1 ? allExamples[exampleIndex + 1] : allExamples[0],
                nextExampleTwo: allExamples.length > exampleIndex + 2 ? allExamples[exampleIndex + 2] : allExamples[1],
            };
        });
    });

    return galleryExamples;
};
