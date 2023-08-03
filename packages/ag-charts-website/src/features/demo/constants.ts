import { SITE_BASE_URL_SEGMENTS } from '../../constants';
import type { InternalFramework } from '../../types/ag-grid';
import type { ExampleType } from '../examples-generator/types';

export const DEMO_INTERNAL_FRAMEWORK: InternalFramework = 'vanilla';
export const DEMO_EXAMPLE_TYPE: ExampleType = 'generated';

// Main file endpoint name for plain chart example
export const PLAIN_ENTRY_FILE_NAME = 'plain-main';

export const DEFAULT_THUMBNAIL_WIDTH = 600;
export const DEFAULT_THUMBNAIL_HEIGHT = 375;

export const DEMO_EXAMPLE_NAME_PATH_INDEX = SITE_BASE_URL_SEGMENTS + 2;
