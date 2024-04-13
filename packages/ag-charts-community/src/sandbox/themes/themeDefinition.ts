import { defaultsDeep } from '../util/object';

type ValidValue = boolean | number | string | ValidValue[];

export class ThemeDefinition<T extends string> {
    constructor(
        public readonly themeName: string,
        public readonly themeVariables: ThemeVariables<T>,
        public readonly themeDefault: object,
        public readonly extendsTheme?: string
    ) {}

    get isDark() {
        return this.themeName.endsWith('-dark');
    }

    createVariant(themeName: string, themeVars?: { [K in T]?: ValidValue }, themeDefault?: object) {
        return new ThemeDefinition(
            themeName,
            this.themeVariables.createVariant(themeVars),
            defaultsDeep(themeDefault, this.themeDefault),
            this.themeName
        );
    }
}

export class ThemeVariables<T extends string> {
    private symbolMap = new Map<T, symbol>();
    private valuesMap = new Map<symbol, ValidValue>();

    constructor(themeVars?: Record<T, ValidValue>) {
        if (themeVars) {
            this.set(themeVars);
        }
    }

    use(varName: T) {
        if (!this.symbolMap.has(varName)) {
            this.symbolMap.set(varName, Symbol(varName));
        }
        return this.symbolMap.get(varName)!;
    }

    set(themeVars: { [K in T]?: ValidValue }) {
        for (const [varName, value] of Object.entries(themeVars)) {
            this.valuesMap.set(this.use(varName as T), value as ValidValue);
        }
    }

    createVariant(themeVars?: { [K in T]?: ValidValue }) {
        const cloneInstance = new ThemeVariables<T>();
        cloneInstance.symbolMap = this.symbolMap;
        cloneInstance.valuesMap = new Map(this.valuesMap);
        if (themeVars) {
            cloneInstance.set(themeVars);
        }
        return cloneInstance;
    }
}
