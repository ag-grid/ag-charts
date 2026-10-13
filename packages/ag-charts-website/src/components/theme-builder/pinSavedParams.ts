import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import { allParamModels } from '@ag-website-shared/theming/ParamModel';
import { enabledAdvancedParamsAtom } from '@ag-website-shared/theming/advanced-params';
import type { Store } from '@ag-website-shared/theming/store';
import { useStore } from 'jotai';
import { useLayoutEffect } from 'react';

const savedParamsPinnedAtom = atomWithJSONStorage<boolean>('saved-params-pinned', false);

/**
 * A param outside the panel's groups only applies while pinned into All
 * Parameters. Params that left the groups may still hold a value saved before
 * they did, so pin those once, otherwise a returning user's theme would silently
 * lose them from both the preview and the export.
 */
export const pinSavedParams = (store: Store) => {
    if (store.get(savedParamsPinnedAtom)) {
        return;
    }
    const pinned = new Set(store.get(enabledAdvancedParamsAtom));
    for (const param of allParamModels()) {
        if (param.onlyEditableAsAdvancedParam && param.hasValue(store)) {
            pinned.add(param.property);
        }
    }
    store.set(enabledAdvancedParamsAtom, pinned);
    store.set(savedParamsPinnedAtom, true);
};

export const PinSavedParams = () => {
    const store = useStore();
    useLayoutEffect(() => pinSavedParams(store), [store]);
    return null;
};
