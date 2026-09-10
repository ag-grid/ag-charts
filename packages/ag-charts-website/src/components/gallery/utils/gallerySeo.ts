import { GALLERY_EXAMPLE_COPY, type GalleryExampleCopy } from '../galleryCopy';

export type GallerySeo = GalleryExampleCopy;

/**
 * The copy a gallery example page serves, shared with its `.md` twin so the two describe the
 * example identically. Throws on an unknown example rather than rendering an empty page.
 */
export function resolveGallerySeo(exampleName: string): GallerySeo {
    const copy = GALLERY_EXAMPLE_COPY[exampleName];
    if (copy == null) {
        throw new Error(
            `No gallery copy for example "${exampleName}". ` +
                `Add a row to GALLERY_EXAMPLE_COPY in components/gallery/galleryCopy.ts.`
        );
    }
    return copy;
}

/**
 * The H1 an example page serves, which is also its anchor text on the hub and in the `.md` twin, so
 * that a link and its destination name the example identically.
 */
export function resolveGalleryH1(exampleName: string): string {
    return resolveGallerySeo(exampleName).h1;
}

/** A chart family named in the singular, from its `title` in `data.json`: `Bar` reads as `Bar Chart`. */
export function galleryFamilyName(title: string): string {
    return title.endsWith('Chart') ? title : `${title} Chart`;
}

/** Heading for a chart family, from its `title` in `data.json`: `Bar` reads as `Bar Charts`. */
export function galleryFamilyHeading(title: string): string {
    return `${galleryFamilyName(title)}s`;
}
