import { getGalleryExampleThemePages } from '@features/gallery/utils/pageData';
import type { ThemeName } from '@stores/themeStore';
import { extensionMimeType } from '@utils/mimeType';
import { getEntry } from 'astro:content';

import { getThumbnailContents } from '../../../../features/example-generator';

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

export async function GET({ params }: { params: Params }) {
    const { format } = params;
    const body = await getThumbnailContents({
        type: 'gallery-thumbnail',
        ...params,
    });

    return new Response(body, {
        headers: {
            'Content-Type': extensionMimeType(format),
        },
    });
}
