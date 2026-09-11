import { setFontFamilyOptions } from '@ag-website-shared/components/theme-builder/FontFamilyValueEditor';
import { setNonAdvancedParams, setThemeParamSource } from '@ag-website-shared/theming/ParamModel';
import { setFeatureModels } from '@ag-website-shared/theming/PartModel';
import { setBaseTheme, setRenderedFeatures } from '@ag-website-shared/theming/rendered-theme';

import { CHARTS_PARAM_DEFAULTS, chartsShadowTheme } from './chartsTheme';
import { CHARTS_FONT_FAMILY_OPTIONS } from './fonts';
import { CURATED_KEYS } from './params';

// Point the shared, host-agnostic theme-builder model at AG Charts' params
// rather than grid's themeQuartz. Charts has no swappable-part features, so both
// the feature registry and the rendered-preview feature list are empty.
setThemeParamSource(() => CHARTS_PARAM_DEFAULTS);
setNonAdvancedParams(CURATED_KEYS);
setFeatureModels(() => []);
setBaseTheme(chartsShadowTheme);
setRenderedFeatures([]);

setFontFamilyOptions(CHARTS_FONT_FAMILY_OPTIONS);

// Not registered here: setParamDocsProvider. The param descriptions are the
// JSDoc on `AgChartThemeParams`, which reaches the browser only through the
// site's generated interface reference - 4MB of it - so the host extracts the
// ~5KB the builder needs at build time and registers that. A host that does not
// leaves every param without a tooltip, which is the only thing lost.
