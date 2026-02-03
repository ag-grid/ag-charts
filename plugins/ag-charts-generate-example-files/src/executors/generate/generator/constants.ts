import type { ExampleType, InternalFramework } from './types';

export const EXAMPLE_TYPES: ExampleType[] = ['generated', 'mixed', 'typescript', 'multi'];

/**
 * The source entry file to generate framework code from
 */
export const SOURCE_ENTRY_FILE_NAME = 'main.ts';

/**
 * The main angular file name that is generated from the source entry file
 */
export const ANGULAR_GENERATED_MAIN_FILE_NAME = 'app.component.ts';

export const INTERNAL_FRAMEWORK_DEPENDENCIES: Partial<Record<InternalFramework, Record<string, string>>> = {
    angular: {
        '@angular/core': '^20.0.0',
        '@angular/common': '^20.0.0',
        '@angular/forms': '^20.0.0',
        '@angular/platform-browser': '^20.0.0',
    },
    reactFunctional: {
        react: '^19.2.0',
        'react-dom': '^19.2.0',
        '@types/react': '^19.2.0',
        '@types/react-dom': '^19.2.0',
    },
    reactFunctionalTs: {
        react: '^19.2.0',
        'react-dom': '^19.2.0',
        '@types/react': '^19.2.0',
        '@types/react-dom': '^19.2.0',
    },
};
