import { describe, expect, it } from 'vitest';

import { AutoSizedLabel, AutoSizedSecondaryLabel } from './autoSizedLabel';

// The auto-sized label path derives its own budget and keeps its documented `overflowStrategy`, so it
// must not inherit the base label's undocumented `truncate` semantics. Lock its defaults.
describe('AutoSizedLabel', () => {
    it('defaults wrapping to on-space and overflowStrategy to ellipsis', () => {
        const label = new AutoSizedLabel();
        expect(label.wrapping).toBe('on-space');
        expect(label.overflowStrategy).toBe('ellipsis');
    });

    it('applies the same defaults to the secondary label', () => {
        const label = new AutoSizedSecondaryLabel();
        expect(label.wrapping).toBe('on-space');
        expect(label.overflowStrategy).toBe('ellipsis');
    });
});
