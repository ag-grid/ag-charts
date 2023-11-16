import type { Framework, InternalFramework } from '@ag-grid-types';
import { persistentAtom, persistentMap } from '@nanostores/persistent';
import { getInternalFramework } from '@utils/framework';

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

/**
 * Set internal framework and update framework context
 */
export const setInternalFramework = (internalFramework: InternalFramework) => {
    // Update framework context
    if (internalFramework === 'vanilla') {
        $frameworkContext.setKey('useTypescript', false);
    } else if (internalFramework === 'typescript') {
        $frameworkContext.setKey('useTypescript', true);
    } else if (internalFramework === 'react') {
        $frameworkContext.setKey('useFunctionalReact', false);
        $frameworkContext.setKey('useTypescript', false);
    } else if (internalFramework === 'reactFunctional') {
        $frameworkContext.setKey('useFunctionalReact', true);
        $frameworkContext.setKey('useTypescript', false);
    } else if (internalFramework === 'reactFunctionalTs') {
        $frameworkContext.setKey('useFunctionalReact', true);
        $frameworkContext.setKey('useTypescript', true);
    } else if (internalFramework === 'vue') {
        $frameworkContext.setKey('useVue3', false);
    } else if (internalFramework === 'vue3') {
        $frameworkContext.setKey('useVue3', true);
    }

    $internalFramework.set(internalFramework);
};

/**
 * Get framework context key converting from localstorage string to
 * boolean value
 */
export const getFrameworkContextKey = (key: keyof FrameworkContext): boolean => {
    const context = $frameworkContext.get();

    return context[key] === 'true';
};

/**
 * Update the internal framework based on the framework and current framework context
 */
export const updateInternalFrameworkBasedOnFramework = (framework: Framework) => {
    const internalFramework = getInternalFramework({
        framework,
        useFunctionalReact: getFrameworkContextKey('useFunctionalReact'),
        useVue3: getFrameworkContextKey('useVue3'),
        useTypescript: getFrameworkContextKey('useTypescript'),
    });

    // NOTE: Set store directly instead of `setInternalFramework`, as
    // we don't want to update the framework context here since we are
    // using it to determine what to set to
    $internalFramework.set(internalFramework);
};
