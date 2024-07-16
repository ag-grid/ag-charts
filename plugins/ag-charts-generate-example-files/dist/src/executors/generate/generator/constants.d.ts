import type { ExampleType, InternalFramework } from './types';
export declare const EXAMPLE_TYPES: ExampleType[];
/**
 * The source entry file to generate framework code from
 */
export declare const SOURCE_ENTRY_FILE_NAME = "main.ts";
/**
 * The main angular file name that is generated from the source entry file
 */
export declare const ANGULAR_GENERATED_MAIN_FILE_NAME = "app.component.ts";
export declare const INTERNAL_FRAMEWORK_DEPENDENCIES: Partial<Record<InternalFramework, Record<string, string>>>;
