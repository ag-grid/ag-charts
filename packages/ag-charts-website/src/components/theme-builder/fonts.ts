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
