import type { SeriesPaletteFactoryParams } from '../module/coreModulesTypes';

export const singleSeriesPaletteFactory = ({ takeColors }: SeriesPaletteFactoryParams) => {
    const {
        fills: [fill],
        strokes: [stroke],
    } = takeColors(1);
    return { fill, stroke };
};

export const markerPaletteFactory = (params: SeriesPaletteFactoryParams) => {
    const { fill, stroke } = singleSeriesPaletteFactory(params);
    return { marker: { fill, stroke } };
};
