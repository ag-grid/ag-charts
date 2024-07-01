import type { FontStyle, FontWeight } from 'ag-charts-types';
import { Group } from '../scene/group';
import type { RenderContext } from '../scene/node';
import type { Line } from '../scene/shape/line';
import type { Marker } from './marker/marker';
export declare class MarkerLabel extends Group {
    static readonly className = "MarkerLabel";
    private readonly label;
    private readonly symbolsGroup;
    constructor();
    destroy(): void;
    proxyButton?: HTMLButtonElement;
    pageIndex: number;
    text?: string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    private _markers;
    set markers(value: Marker[]);
    get markers(): Marker[];
    private _lines;
    set lines(value: Line[]);
    get lines(): Line[];
    update(dimensionProps: {
        length: number;
        spacing: number;
    }[]): void;
    render(renderCtx: RenderContext): void;
}
