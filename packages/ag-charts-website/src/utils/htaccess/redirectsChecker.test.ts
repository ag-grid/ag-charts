import { describe, expect, it } from 'vitest';

import { isRegexReplacementTarget } from './redirectsChecker';

describe('isRegexReplacementTarget', () => {
    it('flags targets that interpolate a captured group so they are not validated literally', () => {
        // RedirectMatch pattern targets — the literal "$1" path can never exist in the build output.
        expect(isRegexReplacementTarget('/javascript/$1')).toBe(true);
        expect(isRegexReplacementTarget('/react/$1')).toBe(true);
        expect(isRegexReplacementTarget('/$1/bar-series/')).toBe(true);
        expect(isRegexReplacementTarget('/$1/axes-configuration/')).toBe(true);
    });

    it('does not flag concrete targets that point at a real built page', () => {
        expect(isRegexReplacementTarget('/react/quick-start/')).toBe(false);
        expect(isRegexReplacementTarget('/enterprise-charts/')).toBe(false);
        expect(isRegexReplacementTarget('/gallery/')).toBe(false);
    });
});
