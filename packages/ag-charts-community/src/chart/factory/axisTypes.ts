import type { ModuleContext } from '../../module/moduleContext';
import type { ChartAxis } from '../chartAxis';

const AXIS_CONSTRUCTORS: Record<string, new (moduleContext: ModuleContext) => ChartAxis> = {};

export function registerAxis(axisType: string, ctor: new (moduleContext: ModuleContext) => ChartAxis) {
    AXIS_CONSTRUCTORS[axisType] = ctor;
}

export function getAxis(axisType: string, moduleCtx: ModuleContext) {
    const axisConstructor = AXIS_CONSTRUCTORS[axisType];
    if (axisConstructor) {
        return new axisConstructor(moduleCtx);
    }

    throw new Error(`AG Charts - unknown axis type: ${axisType}`);
}

export const AXIS_TYPES = {
    has(axisType: string) {
        return Object.hasOwn(AXIS_CONSTRUCTORS, axisType);
    },

    get axesTypes() {
        return Object.keys(AXIS_CONSTRUCTORS);
    },
};

const AXIS_THEME_TEMPLATES: Record<string, {}> = {};

export function registerAxisThemeTemplate(axisType: string, theme: {}) {
    AXIS_THEME_TEMPLATES[axisType] = theme;
}

export function getAxisThemeTemplate(axisType: string): {} {
    return AXIS_THEME_TEMPLATES[axisType] ?? {};
}
