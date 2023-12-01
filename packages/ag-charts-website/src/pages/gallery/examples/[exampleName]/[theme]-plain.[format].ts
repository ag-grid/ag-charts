import { THUMBNAIL_POOL_SIZE } from '@constants';
import { getGalleryExampleThemePages } from '@features/gallery/utils/pageData';
import type { ThemeName } from '@stores/themeStore';
import { getEntry } from 'astro:content';
import sharp from 'sharp';

import { generateExample } from '../../../../utils/generateExample';

export const prerender = true;
const formats = ['png' as const, 'webp' as const];

interface Params {
    exampleName: string;
    theme: ThemeName;
    format: (typeof formats)[number];
}

interface Props {
    uncompressed?: Buffer;
}

interface Page {
    params: Params;
    props: Props;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExampleThemePages({ galleryData: galleryDataEntry.data });

    const result: Page[] = [];
    for (let i = 0; i < pages.length; i += THUMBNAIL_POOL_SIZE) {
        const chunk = pages.slice(i, i + THUMBNAIL_POOL_SIZE);

        const examples = await Promise.all(
            chunk.map(async ({ params }): Promise<Buffer> => {
                const { exampleName, theme } = params;
                const uncompressed = await generateExample({ exampleName, theme });
                return uncompressed;
            })
        );
        const subPages = chunk.flatMap(({ params }, index): Page[] => {
            const { exampleName, theme } = params;
            const uncompressed = examples[index];
            return formats.map((format) => ({
                params: { exampleName, theme, format },
                props: { uncompressed },
            }));
        });

        result.push(...subPages);
    }

    return result;
}

export async function get({ params, props }: { params: Params; props: Props }) {
    const { exampleName, theme, format } = params;
    const uncompressed = props.uncompressed ?? (await generateExample({ exampleName, theme }));

    let result: Buffer;
    switch (format) {
        case 'png':
            result = await sharp(uncompressed).png().toBuffer();
            break;
        case 'webp':
            result = await sharp(uncompressed).webp().toBuffer();
            break;
    }

    return {
        body: result,
        encoding: 'binary',
    };
}
