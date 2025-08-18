import { getGalleryExamplesData } from '@components/homepage/components/gallery-examples/galleryExamplesData';
import { type CollectionEntry, getEntry } from 'astro:content';

const { data: galleryData } = (await getEntry('homepageGallery', 'examples')) as CollectionEntry<'homepageGallery'>;
const { data: allGalleryData } = (await getEntry('gallery', 'data')) as CollectionEntry<'gallery'>;

export async function GET() {
    const output = await getGalleryExamplesData({
        galleryData,
        allGalleryData,
    });

    return new Response(JSON.stringify(output), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
