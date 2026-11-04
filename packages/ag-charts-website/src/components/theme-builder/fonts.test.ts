import { describe, expect, it } from 'vitest';

import { getStackParams } from './chartsTheme';
import { googleFontSpecs } from './fonts';

describe('googleFontSpecs', () => {
    it('names each Google font once per weight its text is set in', () => {
        expect(googleFontSpecs({ fontFamily: { googleFont: 'Inter' }, fontWeight: 200, titleFontWeight: 500 })).toEqual(
            ['200 16px "Inter"', '500 16px "Inter"']
        );
    });

    it('skips references, which name no font of their own', () => {
        expect(
            googleFontSpecs({
                fontFamily: { googleFont: 'Inter' },
                fontWeight: 400,
                titleFontWeight: { ref: 'fontWeight' },
            })
        ).toEqual(['400 16px "Inter"']);
    });

    // The stock themes' stack leads with IBM Plex Sans, which the page declares.
    it('reads a page-declared Google font named in a CSS stack', () => {
        expect(googleFontSpecs(getStackParams('ag-default'))).toContain('400 16px "IBM Plex Sans"');
    });

    it('ignores fonts the page does not declare', () => {
        expect(googleFontSpecs({ fontFamily: ['Arial', 'sans-serif'], fontWeight: 400 })).toEqual([]);
    });
});
