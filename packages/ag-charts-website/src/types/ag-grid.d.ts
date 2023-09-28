import type { IconName } from '@components/icon/Icon';
import type { CollectionEntry } from 'astro:content';
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
export interface GalleryExample {
    title: string;
    description: string;
    /**
     * Example identifier
     */
    name: string;
}
export interface GalleryExampleChartType {
    title: string;
    name: string;
    icon: string;
    enterprise: boolean;
    examples: GalleryExample[];
}

/**
 * Menu types
 *
 * Replicates Astro content validation in `src/content/config.ts`
 */
export type MenuData = CollectionEntry<'menu'>['data'];
export interface MenuItem {
    title: string;
    path?: string;
    url?: string;
    icon?: IconName;
    frameworks?: Framework[];
    isEnterprise?: boolean;
    items?: MenuItem[];
}
