import type { SeriesPaletteFactoryParams } from './coreModulesTypes';
export declare function singleSeriesPaletteFactory({ takeColors }: SeriesPaletteFactoryParams): {
    fill: string;
    stroke: string;
};
export declare function markerPaletteFactory(params: SeriesPaletteFactoryParams): {
    marker: {
        fill: string;
        stroke: string;
    };
};
