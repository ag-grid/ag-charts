import type { BindingImport } from './parser-utils';
export declare function wrapOptionsUpdateCode(code: string, before?: string, after?: string, localVar?: string): string;
export declare function getChartImports(imports: BindingImport[], usesChartApi: boolean): string;
