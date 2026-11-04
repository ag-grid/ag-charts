import type { FontFamilyOption } from '@ag-website-shared/components/theme-builder/FontFamilyValueEditor';

/** AG Charts' own default stack, offered first so it round-trips cleanly. */
export const CHARTS_FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
    {
        label: 'IBM Plex Sans',
        value: { googleFont: 'IBM Plex Sans' },
    },
    {
        label: 'System',
        value: [
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Oxygen-Sans',
            'Ubuntu',
            'Cantarell',
            'Helvetica Neue',
            'sans-serif',
        ],
    },
    { label: 'Arial', value: ['Arial', 'sans-serif'] },
    { label: 'Inter', value: { googleFont: 'Inter' } },
    { label: 'Roboto', value: { googleFont: 'Roboto' } },
    { label: 'Open Sans', value: { googleFont: 'Open Sans' } },
    { label: 'Lato', value: { googleFont: 'Lato' } },
    { label: 'IBM Plex Mono', value: { googleFont: 'IBM Plex Mono' } },
    { label: 'Merriweather', value: { googleFont: 'Merriweather' } },
    { label: 'Times New Roman', value: 'Times New Roman' },
];

const isFontFamilyParam = (property: string) => property === 'fontFamily' || property.endsWith('FontFamily');
const isReference = (value: unknown) => typeof value === 'object' && value != null && 'ref' in value;

/**
 * For the builder's own charts only, never the exported theme: a lone web font
 * falls back to the browser's serif default until it loads.
 */
export const withSansFallback = (params: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(
        Object.keys(params).map((property) => {
            const value = params[property];
            return [
                property,
                value != null && isFontFamilyParam(property) && !isReference(value)
                    ? [value].flat().concat('system-ui', 'sans-serif')
                    : value,
            ];
        })
    );

const isFontWeightParam = (property: string) => property === 'fontWeight' || property.endsWith('FontWeight');

const googleFontFamilies = (value: unknown): string[] =>
    [value]
        .flat()
        .flatMap((font) =>
            typeof font === 'object' && font != null && 'googleFont' in font ? [String(font.googleFont)] : []
        );

/** The Google fonts in the font family menu, which the page declares up front. */
export const MENU_GOOGLE_FONTS = Array.from(
    new Set(CHARTS_FONT_FAMILY_OPTIONS.flatMap(({ value }) => googleFontFamilies(value)))
).sort();

/** Kept identical to `LoadFontFamilyMenuFonts`' URLs, so the menu's imports are cache hits. */
export const googleFontStylesheetUrl = (family: string) =>
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;

/**
 * The page-declared Google fonts a family value names, whether as `{ googleFont }`
 * or by name in a CSS stack - the stock themes' own stack leads with IBM Plex Sans.
 */
const declaredGoogleFontFamilies = (value: unknown): string[] =>
    [value].flat().flatMap((font) => {
        if (typeof font !== 'string') return googleFontFamilies(font);
        return font
            .split(',')
            .map((family) => family.trim().replace(/^["']|["']$/g, ''))
            .filter((family) => MENU_GOOGLE_FONTS.includes(family));
    });

/**
 * `document.fonts.load` specs for each Google font weight a set of params sets
 * text in. Params are read whole, the stock theme's included, since a weight
 * left to the theme still needs its face.
 */
export const googleFontSpecs = (params: Record<string, unknown>): string[] => {
    const keys = Object.keys(params);
    const families = new Set(keys.filter(isFontFamilyParam).flatMap((key) => declaredGoogleFontFamilies(params[key])));
    const weights = new Set(
        keys
            .filter(isFontWeightParam)
            .map((key) => params[key])
            .filter((weight) => typeof weight === 'number' || typeof weight === 'string')
    );
    return [...families].flatMap((family) => [...weights].map((weight) => `${weight} 16px "${family}"`));
};
