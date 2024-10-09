import { defaultsDeep } from '../util/object.util';
import type { IThemeDefinition, IThemeVariables, ThemeName, ThemeVars } from './themeTypes';

export class ThemeDefinition<T extends string, D extends object> implements IThemeDefinition<T> {
    readonly isDark: boolean;

    constructor(
        public readonly themeName: ThemeName,
        public readonly themeVariables: IThemeVariables<T>,
        public readonly themeDefaults: D,
        public readonly baseTheme?: ThemeName
    ) {
        this.isDark = themeName.endsWith('-dark');
    }

    createVariant(themeName: ThemeName, themeVars?: ThemeVars<T>, themeDefaults?: D) {
        return new ThemeDefinition(
            themeName,
            this.themeVariables.createVariant(themeVars),
            defaultsDeep(themeDefaults, this.themeDefaults),
            this.themeName
        );
    }
}