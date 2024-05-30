import type { IThemeVariables, ThemeVars, ValidValue } from './themeTypes';

export class ThemeVariables<T extends string> implements IThemeVariables<T> {
    private symbolMap = new Map<T, symbol>();
    private valuesMap = new Map<symbol, ValidValue>();

    constructor(themeVars?: Record<T, ValidValue>) {
        if (themeVars) {
            this.set(themeVars);
        }
    }

    createVariant(themeVars?: ThemeVars<T>) {
        const cloneInstance = new ThemeVariables<T>();
        cloneInstance.symbolMap = this.symbolMap;
        cloneInstance.valuesMap = new Map(this.valuesMap);
        if (themeVars) {
            cloneInstance.set(themeVars);
        }
        return cloneInstance;
    }

    get(varName: T) {
        const varSymbol = this.symbolMap.get(varName);
        return varSymbol && this.valuesMap.get(varSymbol);
    }

    set(themeVars: ThemeVars<T>) {
        for (const [varName, value] of Object.entries(themeVars)) {
            this.valuesMap.set(this.use(varName as T), value as ValidValue);
        }
    }

    use(varName: T) {
        if (!this.symbolMap.has(varName)) {
            this.symbolMap.set(varName, Symbol(varName));
        }
        return this.symbolMap.get(varName)!;
    }
}
