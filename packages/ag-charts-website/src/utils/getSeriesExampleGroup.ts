import type { GalleryData } from '@ag-grid-types';

export function getSeriesExampleGroup({
    seriesExampleName,
    galleryData,
}: {
    seriesExampleName: string;
    galleryData: GalleryData;
}) {
    const series = galleryData.series.flat();
    return series.find(({ examples }) => {
        return Boolean(examples.find(({ name }) => name === seriesExampleName));
    });
}
