import type { AxisModule } from '../../module/axisModule';
import type { ModuleContext } from '../../module/moduleContext';
import type { ChartAxis } from '../chartAxis';
export declare class AxisRegistry {
    private readonly axesMap;
    private readonly hidden;
    private readonly themeTemplates;
    register(axisType: string, module: Pick<AxisModule, 'instanceConstructor' | 'themeTemplate' | 'hidden'>): void;
    create(axisType: string, moduleContext: ModuleContext): ChartAxis;
    has(axisType: string): boolean;
    keys(): IterableIterator<string>;
    publicKeys(): string[];
    setThemeTemplate(axisType: string, themeTemplate: object): this;
    getThemeTemplate(axisType: string): object | undefined;
}
export declare const axisRegistry: AxisRegistry;
