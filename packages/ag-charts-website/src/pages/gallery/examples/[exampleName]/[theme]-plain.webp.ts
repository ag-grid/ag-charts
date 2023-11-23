import { getGalleryExampleThemePages } from '@features/gallery/utils/pageData';
import type { ThemeName } from '@stores/themeStore';
import { getEntry } from 'astro:content';

import { generateExample } from '../../../../utils/generateExample';

export const prerender = true;

interface Params {
    exampleName: string;
    theme: ThemeName;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExampleThemePages({ galleryData: galleryDataEntry.data });
    return pages;
}

export async function get({ params }: { params: Params }) {
    return await generateExample({ ...params, format: 'webp' });
}
