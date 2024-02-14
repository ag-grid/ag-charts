import type { ModuleContext } from '../../module/moduleContext';
import type { ChartAxis } from '../chartAxis';

class AxisTypes extends Map<string, new (moduleContext: ModuleContext) => ChartAxis> {
    create(axisType: string, moduleContext: ModuleContext) {
        const AxisConstructor = this.get(axisType);
        if (AxisConstructor) {
            return new AxisConstructor(moduleContext);
        }
        throw new Error(`AG Charts - unknown axis type: ${axisType}`);
    }
}

export const axisTypes = new AxisTypes();
export const axisThemes = new Map<string, object>();
