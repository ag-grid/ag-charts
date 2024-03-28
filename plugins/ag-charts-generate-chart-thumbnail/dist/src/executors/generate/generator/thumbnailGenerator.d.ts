import { type AgChartThemeName } from 'ag-charts-community';
import 'ag-charts-enterprise';
import { type GeneratedContents } from 'ag-charts-generate-example-files';
interface Params {
    example: GeneratedContents;
    theme: AgChartThemeName;
    outputPath: string;
    dpi: number;
}
export declare function generateExample({ example, theme, outputPath, dpi }: Params): Promise<void>;
export {};
