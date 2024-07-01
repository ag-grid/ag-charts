import { Color } from './color';
export declare function interpolateNumber(a: number, b: number): (d: number) => number;
export declare function interpolateColor(a: Color | string, b: Color | string): (d: number) => string;
