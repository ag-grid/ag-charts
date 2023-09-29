import type { Framework, InternalFramework } from '@ag-grid-types';
import { FRAMEWORK_DISPLAY_TEXT } from '@constants';

export const getFrameworkDisplayText = (framework: Framework): string => {
    return FRAMEWORK_DISPLAY_TEXT[framework];
};

export const getFrameworkFromInternalFramework = (internalFramework: InternalFramework): Framework => {
    switch (internalFramework) {
        case 'typescript':
        case 'vanilla':
            return 'javascript';
        case 'react':
        case 'reactFunctionalTs':
        case 'reactFunctional':
            return 'react';
        case 'vue':
        case 'vue3':
            return 'vue';
        default:
            return internalFramework;
    }
};

/**
 * The "internalFramework" is the framework name we use inside the example runner depending on which options the
 * user has selected. It can be one of the following:
 *
 * - 'vanilla' (JavaScript)
 * - 'react' (React Classes)
 * - 'reactFunctional' (React Hooks)
 * - 'angular' (Angular)
 * - 'vue' (Vue)
 * - 'vue3' (Vue 3)
 */
export const getInternalFramework = ({
    framework,
    useFunctionalReact,
    useVue3,
    useTypescript,
}: {
    framework: string;
    useFunctionalReact?: boolean;
    useVue3?: boolean;
    useTypescript?: boolean;
}): InternalFramework => {
    switch (framework) {
        case 'vue':
            return useVue3 ? 'vue3' : 'vue';
        case 'javascript':
            return useTypescript ? 'typescript' : 'vanilla';
        case 'react':
            return useFunctionalReact ? (useTypescript ? 'reactFunctionalTs' : 'reactFunctional') : 'react';
        default:
            return framework as InternalFramework;
    }
};

export const isReactInternalFramework = (internalFramework: InternalFramework) => {
    const reactInternalFrameworks: InternalFramework[] = ['react', 'reactFunctional', 'reactFunctionalTs'];
    if (!internalFramework) {
        return false;
    }

    return reactInternalFrameworks.includes(internalFramework);
};

export const isVueInternalFramework = (internalFramework: InternalFramework) => {
    const reactInternalFrameworks: InternalFramework[] = ['vue', 'vue3'];
    if (!internalFramework) {
        return false;
    }

    return reactInternalFrameworks.includes(internalFramework);
};
