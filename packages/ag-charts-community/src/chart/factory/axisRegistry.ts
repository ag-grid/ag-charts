import type { AxisModule } from '../../module/axisModule';
import type { ModuleContext } from '../../module/moduleContext';
import type { ChartAxis } from '../chartAxis';

export class AxisRegistry {
    private axesMap = new Map<string, new (moduleContext: ModuleContext) => ChartAxis>();
    private hidden = new Set<string>();
    private themeTemplates = new Map<string, object>();

    register(axisType: string, module: Pick<AxisModule, 'instanceConstructor' | 'themeTemplate' | 'hidden'>) {
        this.axesMap.set(axisType, module.instanceConstructor);
        if (module.themeTemplate) {
            this.setThemeTemplate(axisType, module.themeTemplate);
        }
        if (module.hidden) {
            this.hidden.add(axisType);
        }
    }

    create(axisType: string, moduleContext: ModuleContext) {
        const AxisConstructor = this.axesMap.get(axisType);
        if (AxisConstructor) {
            return new AxisConstructor(moduleContext);
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
