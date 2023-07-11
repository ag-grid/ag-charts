import { persistentAtom, persistentMap } from '@nanostores/persistent';
import { InternalFramework } from '../types/ag-grid.d';

export type FrameworkContext = {
    useFunctionalReact: boolean;
    useTypescript: boolean;
    useVue3: boolean;
};

const LOCALSTORAGE_PREFIX = 'documentation';
const DEFAULT_INTERNAL_FRAMEWORK: InternalFramework = 'vanilla';

export const $internalFramework = persistentAtom(
    `${LOCALSTORAGE_PREFIX}:internalFramework`,
    DEFAULT_INTERNAL_FRAMEWORK
);
export const $frameworkContext = persistentMap<FrameworkContext>(`${LOCALSTORAGE_PREFIX}:context`, {
    useFunctionalReact: true,
    useTypescript: false,
    useVue3: false,
});
