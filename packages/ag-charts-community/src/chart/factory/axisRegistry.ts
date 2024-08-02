import type { AxisModule } from '../../module/axisModule';
import type { ModuleContext } from '../../module/moduleContext';
import type { ChartAxis } from '../chartAxis';

export class AxisRegistry {
    private readonly axesMap = new Map<string, (moduleContext: ModuleContext) => ChartAxis>();
    private readonly hidden = new Set<string>();
    private readonly themeTemplates = new Map<string, object>();

    register(axisType: string, module: Pick<AxisModule, 'moduleFactory' | 'themeTemplate' | 'hidden'>) {
        this.axesMap.set(axisType, module.moduleFactory);
        if (module.themeTemplate) {
            this.setThemeTemplate(axisType, module.themeTemplate);
        }
        if (module.hidden) {
            this.hidden.add(axisType);
        }
    }

    create(axisType: string, moduleContext: ModuleContext) {
        const axisFactory = this.axesMap.get(axisType);
        if (axisFactory) {
            return axisFactory(moduleContext);
        }
        throw new Error(`AG Charts - unknown axis type: ${axisType}`);
    }

    has(axisType: string) {
        return this.axesMap.has(axisType);
    }

    keys() {
        return this.axesMap.keys();
    }

    publicKeys() {
        return [...this.keys()].filter((k) => !this.hidden.has(k));
    }

    setThemeTemplate(axisType: string, themeTemplate: object) {
        this.themeTemplates.set(axisType, themeTemplate);
        return this;
    }

    getThemeTemplate(axisType: string) {
        return this.themeTemplates.get(axisType);
    }
}

export const axisRegistry = new AxisRegistry();
