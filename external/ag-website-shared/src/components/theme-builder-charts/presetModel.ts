import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import type { Store } from '@ag-website-shared/theming/store';
import { useAtomValue } from 'jotai';

/**
 * Which preset the current theme was started from.
 *
 * Stored rather than held in component state because it decides the exported
 * theme's `baseTheme`, and that has to survive a reload: the params and the
 * palette are persisted, so a returning user with a dark theme would otherwise
 * get it emitted on top of the light base theme.
 *
 * The id alone, not the preset - the definitions move, and a copy in local
 * storage would keep resolving to whatever it was when the user last visited.
 */
const selectedPresetAtom = atomWithJSONStorage<string | undefined>('charts-preset', undefined);

export const useSelectedPresetId = () => useAtomValue(selectedPresetAtom);

export const setSelectedPresetId = (store: Store, id: string) => store.set(selectedPresetAtom, id);

export const getSelectedPresetId = (store: Store) => store.get(selectedPresetAtom);
