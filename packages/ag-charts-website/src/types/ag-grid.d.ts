import type Gallery from '../content/gallery/data.json';

export type Framework = 'javascript' | 'react' | 'angular' | 'vue';

export type InternalFramework =
    | 'vanilla'
    | 'typescript'
    | 'react'
    | 'reactFunctional'
    | 'reactFunctionalTs'
    | 'angular'
    | 'vue'
    | 'vue3';

export type Library = 'charts' | 'grid';

export type GalleryData = typeof Gallery;
