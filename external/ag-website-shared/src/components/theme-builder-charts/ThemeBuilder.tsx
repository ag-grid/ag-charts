import { LoadFontFamilyMenuFonts } from '@ag-website-shared/components/theme-builder/FontFamilyValueEditor';
import { ThemeBuilderProvider } from '@ag-website-shared/components/theme-builder/ThemeBuilderProvider';

import { RootContainer } from './RootContainer';
import { DEFAULT_PRESET, toSharedPreset } from './presets';
import './registerThemeBuilderConfig';

export const ThemeBuilder = ({ isDark }: { isDark: boolean }) => (
    <ThemeBuilderProvider initialPreset={toSharedPreset(DEFAULT_PRESET, isDark)}>
        <LoadFontFamilyMenuFonts />
        <RootContainer isDark={isDark} />
    </ThemeBuilderProvider>
);
