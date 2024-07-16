import { type AgChartThemeName } from 'ag-charts-community';
import 'ag-charts-enterprise';
import { type GeneratedContents } from 'ag-charts-generate-example-files';
interface Params {
    example: GeneratedContents;
    theme: AgChartThemeName;
    outputPath: string;
    dpi: number;
    mockText: boolean;
}
export declare function generateThumbnail({ example, theme, outputPath, dpi, mockText }: Params): Promise<void>;
export {};
