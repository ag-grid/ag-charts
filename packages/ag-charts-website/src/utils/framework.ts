import { FRAMEWORK_DISPLAY_TEXT } from '../constants';
import type { Framework } from '../types/ag-grid';

export const getFrameworkDisplayText = (framework: Framework): string => {
    return FRAMEWORK_DISPLAY_TEXT[framework];
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
}) => {
    switch (framework) {
        case 'vue':
            return useVue3 ? 'vue3' : 'vue';
        case 'javascript':
            return useTypescript ? 'typescript' : 'vanilla';
        case 'react':
            return useFunctionalReact ? (useTypescript ? 'reactFunctionalTs' : 'reactFunctional') : 'react';
        default:
            return framework;
    }
};
