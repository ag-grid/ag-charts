import { describe, expect, it } from 'vitest';

import type { FontFields } from '../annotationDatum';
import { resizeFont } from './styles';

describe('annotation style utils', () => {
    describe('resizeFont', () => {
        it('keeps a set lineHeight in proportion to the new font size', () => {
            const font: FontFields = { fontFamily: 'Verdana', fontSize: 10, lineHeight: 15 };
            resizeFont(font, 20);
            expect(font).toEqual({ fontFamily: 'Verdana', fontSize: 20, lineHeight: 30 });
        });

        it('leaves an unset lineHeight unset', () => {
            const font: FontFields = { fontFamily: 'Verdana', fontSize: 10 };
            resizeFont(font, 20);
            expect(font).toEqual({ fontFamily: 'Verdana', fontSize: 20 });
        });
    });
});
