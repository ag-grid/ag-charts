import type { Scale } from './scale';
/**
 * Maps a discrete domain to a continuous numeric range.
 */
export declare class BandScale<D, I = number> implements Scale<D, number, I> {
    static is(value: any): value is BandScale<any, any>;
    readonly type: 'band' | 'ordinal-time';
    protected invalid: boolean;
    range: number[];
    round: boolean;
    interval?: I;
    protected refresh(): void;
    /**
     * Maps datum to its index in the {@link domain} array.
     * Used to check for duplicate data (not allowed).
     */
    protected index: Map<D, number>;
    /**
     * The output range values for datum at each index.
     */
    protected ordinalRange: number[];
    /**
     * Contains unique data only.
     */
    protected _domain: D[];
    set domain(values: D[]);
    get domain(): D[];
    getDomain(): D[];
    ticks(): D[];
    convert(d: D): number;
    invert(position: number): D;
    invertNearest(position: number): D;
    private _bandwidth;
    get bandwidth(): number;
    private _step;
    get step(): number;
    private _inset;
    get inset(): number;
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
    update(): void;
    private getIndex;
}
