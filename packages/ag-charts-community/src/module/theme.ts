import type { SeriesPaletteFactoryParams } from './coreModulesTypes';

export function singleSeriesPaletteFactory({ takeColors }: SeriesPaletteFactoryParams) {
    const {
        fills: [fill],
        strokes: [stroke],
    } = takeColors(1);
    return { fill, stroke };
}

export function markerPaletteFactory(params: SeriesPaletteFactoryParams) {
    return { marker: singleSeriesPaletteFactory(params) };
}
