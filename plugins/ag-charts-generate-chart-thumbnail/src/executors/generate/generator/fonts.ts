import path from 'path';
import { FontLibrary } from 'skia-canvas';

/**
 * Thumbnails render through skia-canvas in Node, where IBM Plex Sans is neither installed nor
 * fetchable via a stylesheet, so register it to keep them matching the examples they preview.
 * Weights mirror the website's Google Fonts request; non-Latin text falls back to platform fonts.
 */
const IBM_PLEX_SANS_WEIGHTS = [400, 500, 700];

export function registerThumbnailFonts() {
    const packageRoot = path.dirname(require.resolve('@fontsource/ibm-plex-sans/package.json'));
    const files = IBM_PLEX_SANS_WEIGHTS.map((weight) =>
        path.join(packageRoot, 'files', `ibm-plex-sans-latin-${weight}-normal.woff2`)
    );

    FontLibrary.use('IBM Plex Sans', files);
}
