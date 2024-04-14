import { defaultsDeep } from '../util/object';
import type { IThemeDefinition, IThemeVariables, ThemeVars } from './themeTypes';

export class ThemeDefinition<T extends string> implements IThemeDefinition<T> {
    readonly isDark: boolean;

    constructor(
        public readonly themeName: string,
        public readonly themeVariables: IThemeVariables<T>,
        public readonly themeDefaults: object,
        public readonly baseTheme?: string
    ) {
        this.isDark = themeName.endsWith('-dark');
    }

    createVariant(themeName: string, themeVars?: ThemeVars<T>, themeDefaults?: object) {
        return new ThemeDefinition(
            themeName,
            this.themeVariables.createVariant(themeVars),
            defaultsDeep(themeDefaults, this.themeDefaults),
            this.themeName
        );
    }
}
