export type Unit<T extends string> = number & { readonly unit: T };
export type Pixel = Unit<'px'>;

export function makeUnit<T extends string>(a: number, unit: T): Unit<T> {
    const b = a as number & { unit: T };
    b.unit = unit;
    return b;
}

export interface UnitTransformer<Src extends string, Dst extends string> {
    convert(src: Unit<Src>): Unit<Dst>;
    inverse(dst: Unit<Dst>): Unit<Src>;
}

export class IdentityUnitTransformer<T extends string> implements UnitTransformer<T, T> {
    convert(src: Unit<T>) {
        return src;
    }
    inverse(dst: Unit<T>) {
        return dst;
    }
}
