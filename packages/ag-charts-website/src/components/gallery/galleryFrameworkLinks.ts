import type { Framework } from '@ag-grid-types';
import { FRAMEWORK_DISPLAY_TEXT } from '@constants';
import { urlWithPrefix } from '@utils/urlWithPrefix';

/**
 * Framework quick-start links rendered beneath a gallery example's intro.
 *
 * Links rather than in-page code tabs because the example runner is vanilla-only
 * (`GALLERY_INTERNAL_FRAMEWORK`), so there is no per-framework source to tab between.
 */
const ORDER: readonly Framework[] = ['javascript', 'react', 'angular', 'vue'] as const;

export const GALLERY_FRAMEWORK_LINKS = ORDER.map((framework) => ({
    framework,
    label: FRAMEWORK_DISPLAY_TEXT[framework],
    url: urlWithPrefix({ url: './quick-start/', framework }),
}));
