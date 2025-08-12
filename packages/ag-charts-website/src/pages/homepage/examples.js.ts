import { getGalleryExamplesJs } from '@components/homepage/components/gallery-examples/galleryExamplesData';
import { getIsDev } from '@utils/env';
import { type CollectionEntry, getEntry } from 'astro:content';
import { transform } from 'esbuild';

const { data: galleryData } = (await getEntry('homepageGallery', 'examples')) as CollectionEntry<'homepageGallery'>;
const { data: allGalleryData } = (await getEntry('gallery', 'data')) as CollectionEntry<'gallery'>;

async function minifyJs(js: string): Promise<string> {
    const res = await transform(js, {
        minify: true,
        loader: 'js',
        format: 'esm', // your script tag uses type="module"
        target: 'es2019',
        legalComments: 'none',
        sourcemap: false,
    });
    return res.code;
}

export async function GET() {
    const js = await getGalleryExamplesJs({
        galleryData,
        allGalleryData,
    });

    const output = getIsDev() ? js : await minifyJs(js);

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'application/javascript',
        },
    });
}
