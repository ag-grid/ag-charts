import type { ExampleType } from './types';

export const EXAMPLE_TYPES: ExampleType[] = ['generated', 'mixed', 'typescript', 'multi'];

/**
 * The source entry file to generate framework code from
 */
export const SOURCE_ENTRY_FILE_NAME = 'main.ts';

/**
 * The main angular file name that is generated from the source entry file
 */
export const ANGULAR_GENERATED_MAIN_FILE_NAME = 'app.component.ts';
