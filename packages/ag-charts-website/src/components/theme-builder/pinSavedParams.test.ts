import { ParamModel } from '@ag-website-shared/theming/ParamModel';
import { enabledAdvancedParamsAtom } from '@ag-website-shared/theming/advanced-params';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { CURATED_KEYS } from './params';
import { pinSavedParams } from './pinSavedParams';
import './registerThemeBuilderConfig';

describe('pinSavedParams', () => {
    it('pins a saved param that is only editable from All Parameters', () => {
        expect(CURATED_KEYS).not.toContain('fontWeight');
        const store = createStore();
        store.set(ParamModel.for('fontWeight').valueAtom, 'bold');

        pinSavedParams(store);

        expect(store.get(enabledAdvancedParamsAtom)).toEqual(new Set(['fontWeight']));
    });

    it('leaves panel params and unset params unpinned', () => {
        const store = createStore();
        store.set(ParamModel.for('fontSize').valueAtom, 16);

        pinSavedParams(store);

        expect(store.get(enabledAdvancedParamsAtom)).toEqual(new Set());
    });

    it('runs once, so a param unpinned afterwards stays unpinned', () => {
        const store = createStore();
        store.set(ParamModel.for('fontWeight').valueAtom, 'bold');
        pinSavedParams(store);

        store.set(enabledAdvancedParamsAtom, new Set());
        pinSavedParams(store);

        expect(store.get(enabledAdvancedParamsAtom)).toEqual(new Set());
    });
});
