import type { Scale } from './scale';
/**
 * Maps a discrete domain to a continuous numeric range.
 */
export declare class BandScale<D, I = number> implements Scale<D, number, I> {
    static is(value: any): value is BandScale<any, any>;
    readonly type: 'band' | 'ordinal-time';
    protected invalid: boolean;
    interval?: I;
    protected refresh(): void;
    /**
     * Maps datum to its index in the {@link domain} array.
     * Used to check for duplicate datums (not allowed).
     */
    protected index: Map<D | D[], number>;
    /**
     * The output range values for datum at each index.
     */
    protected ordinalRange: number[];
    /**
     * Contains unique datums only. Since `{}` is used in place of `Map`
     * for IE11 compatibility, the datums are converted `toString` before
     * the uniqueness check.
     */
    protected _domain: D[];
    set domain(values: D[]);
    get domain(): D[];
    range: number[];
    ticks(): D[];
    convert(d: D): number;
    invert(position: number): D;
    invertNearest(position: number): D;
    private _bandwidth;
    get bandwidth(): number;
    private _step;
    get step(): number;
    private _rawBandwidth;
    get rawBandwidth(): number;
    set padding(value: number);
    get padding(): number;
    /**
     * The ratio of the range that is reserved for space between bands.
     */
    private _paddingInner;
    set paddingInner(value: number);
    get paddingInner(): number;
    /**
     * The ratio of the range that is reserved for space before the first
     * and after the last band.
     */
    private _paddingOuter;
    set paddingOuter(value: number);
    get paddingOuter(): number;
    round: boolean;
    update(): void;
    private getIndex;
}
