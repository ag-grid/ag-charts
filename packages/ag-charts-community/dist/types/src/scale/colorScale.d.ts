import type { Scale } from './scale';
export declare class ColorScale implements Scale<number, string, number> {
    readonly type = "color";
    protected invalid: boolean;
    domain: number[];
    range: string[];
    private parsedRange;
    update(): void;
    convert(x: number): string;
    protected refresh(): void;
}
