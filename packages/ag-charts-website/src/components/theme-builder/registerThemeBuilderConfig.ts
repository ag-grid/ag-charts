import { setFontFamilyOptions } from '@ag-website-shared/components/theme-builder/FontFamilyValueEditor';
import { setNonAdvancedParams, setThemeParamSource } from '@ag-website-shared/theming/ParamModel';
import { setFeatureModels } from '@ag-website-shared/theming/PartModel';
import { setBaseTheme, setRenderedBaseThemeAtom } from '@ag-website-shared/theming/base-theme';
import { setRenderedFeatures } from '@ag-website-shared/theming/rendered-theme';
import { setProductVersion } from '@ag-website-shared/theming/store';

import { VERSION } from 'ag-charts-community';

import { CHARTS_PARAM_DEFAULTS, DEFAULT_THEME_NAME, getShadowTheme } from './chartsTheme';
import { CHARTS_FONT_FAMILY_OPTIONS } from './fonts';
import { CURATED_KEYS } from './params';
import { shadowBaseThemeAtom } from './presetModel';

// Charts has no swappable-part features, so both feature lists stay empty.
setThemeParamSource(() => CHARTS_PARAM_DEFAULTS);
setNonAdvancedParams(CURATED_KEYS);
setFeatureModels(() => []);
setBaseTheme(getShadowTheme(DEFAULT_THEME_NAME));
setRenderedBaseThemeAtom(shadowBaseThemeAtom);
setRenderedFeatures([]);

setFontFamilyOptions(CHARTS_FONT_FAMILY_OPTIONS);

setProductVersion(VERSION);

// setParamDocsProvider and setParamDocsUrlProvider are the host's to register,
// the descriptions coming from a 4MB reference it reduces at build time.
