import { getGalleryExampleThemePages } from '@features/gallery/utils/pageData';
import type { ThemeName } from '@stores/themeStore';
import { getEntry } from 'astro:content';

import { generateExample } from '../../../../utils/generateExample';

export const prerender = true;
const formats = ['png' as const, 'webp' as const];

interface Params {
    exampleName: string;
    theme: ThemeName;
    format: (typeof formats)[number];
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExampleThemePages({ galleryData: galleryDataEntry.data });
    const result: { params: Params }[] = [];
    for (const page of pages) {
        formats.forEach((format) => {
            result.push({ params: { ...page.params, format } });
        });
    }
    return result;
}

export async function get({ params }: { params: Params }) {
    return await generateExample({ ...params });
}
