import { getGalleryExamplesJs } from '@components/homepage/components/gallery-examples/galleryExamplesData';
import { type CollectionEntry, getEntry } from 'astro:content';

const { data: galleryData } = (await getEntry('homepageGallery', 'examples')) as CollectionEntry<'homepageGallery'>;
const { data: allGalleryData } = (await getEntry('gallery', 'data')) as CollectionEntry<'gallery'>;

export async function GET() {
    try {
        const js = await getGalleryExamplesJs({
            galleryData,
            allGalleryData,
        });
        return new Response(js, {
            status: 200,
            headers: {
                'Content-Type': 'application/javascript',
            },
        });
    } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Unknown error', {
            status: 500,
            headers: {
                'Content-Type': 'application/javascript',
            },
        });
    }
}
